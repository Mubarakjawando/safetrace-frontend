// Photon (by Komoot) — free, no-key place search, biased to Nigeria
export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    limit: 5,
    lat: 7.15,
    lon: 3.35,
    // Nigeria's bounding box roughly, to bias results
    bbox: '2.6,4.2,14.7,13.9'
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`);

  if (!response.ok) return [];

  const data = await response.json();

  return data.features.map(feature => {
    const props = feature.properties;
    const nameParts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
    return {
      name: [...new Set(nameParts)].join(', '),
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0]
    };
  });
};