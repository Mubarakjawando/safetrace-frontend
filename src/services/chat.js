import api from './api';

export const getMyMessages = async () => {
  const res = await api.get('/chat/mine');
  return res.data.messages;
};

export const getConversations = async () => {
  const res = await api.get('/chat/conversations');
  return res.data.conversations;
};

export const getConversationWithUser = async (userId) => {
  const res = await api.get(`/chat/conversations/${userId}`);
  return res.data.messages;
};
