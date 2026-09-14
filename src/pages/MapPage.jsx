import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useAuth } from '../context/AuthContext';
import { startJourney, endJourney } from '../services/journey';
import { getSocket, disconnectSocket } from '../services/socket';
import { searchPlaces } from '../services/geocode';
import { subscribeToPush } from '../services/push';
import NavDrawer from '../components/NavDrawer';
import ChatWidget from '../components/ChatWidget';

export default function MapPage() {
  const { user, logout } = useAuth();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const nextStepIndexRef = useRef(0);
  const journeyStartTimeRef = useRef(null);
  const distanceTraveledRef = useRef(0);
  const lastPositionRef = useRef(null);
  const deviationCountRef = useRef(0);

  const [destinationQuery, setDestinationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [searching, setSearching] = useState(false);

  const [journey, setJourney] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [deviationAlert, setDeviationAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [journeySummary, setJourneySummary] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ---- Map setup ----
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [3.3619, 7.1475],
      zoom: 13
    });

    mapRef.current.on('load', () => {
      mapRef.current.resize();
      setMapLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- Socket listeners ----
  useEffect(() => {
    const socket = getSocket();

    socket.on('deviation_alert', (data) => {
      setDeviationAlert(data);
      deviationCountRef.current += 1;
      speakAlert('You have moved off your route. Please return to the path, or tap "I am okay".');
    });

    socket.on('deviation_cleared', () => {
      setDeviationAlert(null);
      setStatusMessage('Back on route.');
    });

    socket.on('alert_dispatched', (data) => {
      setStatusMessage(`Emergency contact ${data.contactNotified} has been notified.`);
    });

    return () => {
      socket.off('deviation_alert');
      socket.off('deviation_cleared');
      socket.off('alert_dispatched');
    };
  }, []);

  // ---- Helpers ----
  const speakAlert = (message) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const distanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ---- Destination search ----
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setDestinationQuery(value);
    setSelectedDestination(null);

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    const results = await searchPlaces(value);
    setSuggestions(results);
    setSearching(false);
  };

  const handleSelectSuggestion = (place) => {
    setSelectedDestination(place);
    setDestinationQuery(place.name);
    setSuggestions([]);
  };

  // ---- Start journey ----
  const handleStartJourney = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!selectedDestination) {
      setStatusMessage('Please search and select a destination first.');
      return;
    }

    setLoading(true);

    if (!navigator.geolocation) {
      setStatusMessage('Your browser does not support GPS location.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const data = await startJourney({
            start_lat: latitude,
            start_lng: longitude,
            destination_lat: selectedDestination.lat,
            destination_lng: selectedDestination.lng,
            destination_name: selectedDestination.name
          });

          setJourney(data.journey);
          setSteps(data.steps || []);
          nextStepIndexRef.current = 0;
          window.__arrivalAnnounced = false;
          journeyStartTimeRef.current = Date.now();
          distanceTraveledRef.current = 0;
          lastPositionRef.current = null;
          deviationCountRef.current = 0;

          drawRoute(data.route);
          beginLiveTracking(data.journey.id, data.steps || []);
          setStatusMessage('Journey started. Tracking your location...');
          speakAlert(`Your journey to ${selectedDestination.name.split(',')[0]} has started.`);

          // Ask for push notification permission and subscribe (non-blocking)
          if (import.meta.env.VITE_VAPID_PUBLIC_KEY) {
            subscribeToPush(import.meta.env.VITE_VAPID_PUBLIC_KEY);
          }
        } catch (err) {
          setStatusMessage(err.response?.data?.error || 'Could not start journey.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setStatusMessage('Could not get your location: ' + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const drawRoute = (routeCoords) => {
    const map = mapRef.current;
    if (!map || !routeCoords) return;

    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeCoords.map(p => [p.lng, p.lat])
      }
    };

    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    } else {
      map.addSource('route', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#2B3A5E', 'line-width': 4 }
      });
    }

    const bounds = new maplibregl.LngLatBounds();
    routeCoords.forEach(p => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, { padding: 50 });
  };

  // ---- Live tracking + turn-by-turn + arrival ----
  const beginLiveTracking = (journeyId, routeSteps) => {
    const socket = getSocket();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });

        if (lastPositionRef.current) {
          distanceTraveledRef.current += distanceMeters(
            lastPositionRef.current.lat, lastPositionRef.current.lng,
            latitude, longitude
          );
        }
        lastPositionRef.current = { lat: latitude, lng: longitude };

        socket.emit('gps_update', { journeyId, lat: latitude, lng: longitude });

        // Turn-by-turn announcement
        const nextIndex = nextStepIndexRef.current;
        const currentStep = routeSteps[nextIndex];
        if (currentStep) {
          const dist = distanceMeters(latitude, longitude, currentStep.lat, currentStep.lng);
          if (dist < 30) {
            speakAlert(currentStep.instruction);
            nextStepIndexRef.current = nextIndex + 1;
          }
        }

        // Arrival announcement
        setJourney(currentJourney => {
          if (currentJourney && nextStepIndexRef.current >= routeSteps.length) {
            const distToDestination = distanceMeters(
              latitude, longitude,
              currentJourney.destination_lat, currentJourney.destination_lng
            );
            if (distToDestination < 40 && !window.__arrivalAnnounced) {
              window.__arrivalAnnounced = true;
              speakAlert(`You have arrived at ${currentJourney.destination_name.split(',')[0]}.`);
              setStatusMessage(`Arrived at ${currentJourney.destination_name}.`);
            }
          }
          return currentJourney;
        });

        const map = mapRef.current;
        if (!map) return;

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        } else {
          userMarkerRef.current = new maplibregl.Marker({ color: '#C1592C' })
            .setLngLat([longitude, latitude])
            .addTo(map);
        }
      },
      (err) => {
        setStatusMessage('GPS tracking error: ' + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const handleEndJourney = async () => {
    if (!journey) return;

    const elapsedMs = journeyStartTimeRef.current ? Date.now() - journeyStartTimeRef.current : 0;
    const distanceKm = distanceTraveledRef.current / 1000;
    const deviationCount = deviationCountRef.current;
    const destinationLabel = journey.destination_name;

    try {
      await endJourney(journey.id);
    } catch (err) {
      // still show summary even if the end-journey API call fails
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    window.speechSynthesis.cancel();
    setJourney(null);
    setSteps([]);
    setDeviationAlert(null);
    setSelectedDestination(null);
    setDestinationQuery('');
    setStatusMessage('');

    setJourneySummary({
      destination: destinationLabel,
      distanceKm: distanceKm.toFixed(1),
      minutes: Math.max(1, Math.round(elapsedMs / 60000)),
      deviationCount
    });
  };

  const handleImOkay = () => {
    window.speechSynthesis.cancel();
    const socket = getSocket();
    socket.emit('deviation_response_ok', { journeyId: journey.id });
    setDeviationAlert(null);
    setStatusMessage('Marked as okay. Continuing to monitor your route.');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      disconnectSocket();
    };
  }, []);

  return (
    <div className="page-reveal" style={{ minHeight: '100vh' }}>
      <div style={{
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div className="mono-label" style={{ letterSpacing: '0.1em' }}>SAFETRACE ABEOKUTA</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--indigo-dark)' }}>
            {user?.name}
          </div>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="hamburger-btn">
          <span></span><span></span><span></span>
        </button>
      </div>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {!journey ? (
        <div style={{ padding: 24 }}>
          <div className="strata-card" style={{ maxWidth: 560 }}>
            <h3 style={{ marginBottom: 18 }}>Start a journey</h3>
            <form onSubmit={handleStartJourney}>
              <div style={{ marginBottom: 18, position: 'relative' }}>
                <label className="field-label">Where are you going?</label>
                <input
                  className="field-input"
                  value={destinationQuery}
                  onChange={handleSearchChange}
                  placeholder="e.g. Olumo Rock, Adatan, or a street name"
                  autoComplete="off"
                  required
                />
                {searching && (
                  <div className="mono-label" style={{ marginTop: 6 }}>Searching…</div>
                )}
                {suggestions.length > 0 && (
                  <div className="suggestion-dropdown" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                    background: '#fff', border: '1.5px solid var(--line)', borderRadius: 10,
                    boxShadow: '0 4px 12px rgba(35,32,27,0.1)', zIndex: 10, overflow: 'hidden'
                  }}>
                    {suggestions.map((place, i) => (
                      <div key={i} className="suggestion-item" onClick={() => handleSelectSuggestion(place)}>
                        {place.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading || !selectedDestination}>
                {loading ? 'Starting…' : 'Start journey'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ padding: 24 }} className="journey-panel">
          <div className="strata-card strata-card--safe" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 560
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="pulse-dot"></span>
                <span className="mono-label">TRACKING LIVE</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>
                To {journey.destination_name}
              </div>
            </div>
            <button onClick={handleEndJourney} className="btn btn-alert" style={{ width: 'auto', padding: '10px 20px' }}>
              End journey
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{ padding: '0 24px 16px', color: 'var(--ink-soft)', fontSize: 14 }}>{statusMessage}</div>
      )}

      <div style={{ position: 'relative', borderTop: '1px solid var(--line)' }}>
        {!mapLoaded && (
          <div className="map-skeleton">
            <span className="map-skeleton-label">LOADING MAP…</span>
          </div>
        )}
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '500px', display: mapLoaded ? 'block' : 'none' }}
        />
      </div>

      {deviationAlert && (
        <div className="alert-overlay">
          <div className="alert-modal">
            <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Route deviation detected</h2>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 6, lineHeight: 1.5 }}>{deviationAlert.message}</p>
            <p className="mono-label" style={{ marginBottom: 20 }}>
              {Math.round(deviationAlert.distanceMeters)}m off planned route
            </p>
            <button onClick={handleImOkay} className="btn btn-primary">
              I am okay
            </button>
          </div>
        </div>
      )}

      {journeySummary && (
        <div className="summary-overlay">
          <div className="summary-modal">
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>Journey complete</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
              Arrived at {journeySummary.destination.split(',')[0]}
            </p>

            <div className="summary-stats">
              <div>
                <div className="summary-stat-value">{journeySummary.distanceKm}</div>
                <div className="summary-stat-label">KM TRAVELED</div>
              </div>
              <div>
                <div className="summary-stat-value">{journeySummary.minutes}</div>
                <div className="summary-stat-label">MINUTES</div>
              </div>
              <div>
                <div className="summary-stat-value" style={{ color: journeySummary.deviationCount > 0 ? 'var(--clay)' : 'var(--safe-green)' }}>
                  {journeySummary.deviationCount}
                </div>
                <div className="summary-stat-label">DEVIATIONS</div>
              </div>
            </div>

            <button onClick={() => setJourneySummary(null)} className="btn btn-primary">
              Done
            </button>
          </div>
        </div>
      )}

      <ChatWidget />
    </div>
  );
}