import api from './api';

export const startJourney = async (journeyData) => {
  const response = await api.post('/journeys/start', journeyData);
  return response.data;
};

export const endJourney = async (journeyId) => {
  const response = await api.patch(`/journeys/${journeyId}/end`);
  return response.data;
};