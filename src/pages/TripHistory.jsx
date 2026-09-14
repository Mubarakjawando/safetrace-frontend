import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TripHistory() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get('/journeys/mine');
        setTrips(res.data.journeys);
      } catch (err) {
        setError('Could not load trip history.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-reveal" style={{ minHeight: '100vh' }}>
      <div style={{
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <button onClick={() => navigate('/map')} className="page-back-btn">
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div className="mono-label" style={{ letterSpacing: '0.1em' }}>SAFETRACE ABEOKUTA</div>
          <h2 style={{ fontSize: 20 }}>Trip History</h2>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 640 }}>
        {loading && <p style={{ color: 'var(--ink-soft)' }}>Loading trips…</p>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && trips.length === 0 && (
          <div className="strata-card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            <h3 style={{ marginBottom: 6 }}>No trips yet</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
              Your journeys will show up here once you start tracking one.
            </p>
          </div>
        )}

        {trips.map((trip) => (
          <div
            key={trip.id}
            className={`strata-card ${trip.status === 'active' ? 'strata-card--safe' : ''}`}
            style={{ marginBottom: 14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>
                  {trip.destination_name?.split(',')[0] || 'Unnamed destination'}
                </div>
                <div className="mono-label" style={{ marginTop: 4 }}>
                  {formatDate(trip.started_at)}
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                background: trip.status === 'active' ? '#E7F2EB' : 'var(--stone-warm)',
                color: trip.status === 'active' ? 'var(--safe-green)' : 'var(--ink-soft)'
              }}>
                {trip.status === 'active' ? 'IN PROGRESS' : trip.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
