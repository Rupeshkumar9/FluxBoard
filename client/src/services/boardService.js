import api from './api';

export const boardService = {
  getAll: async () => {
    const { data } = await api.get('/boards');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/boards/${id}`);
    return data;
  },

  create: async (boardData) => {
    const { data } = await api.post('/boards', boardData);
    return data;
  },

  update: async (id, boardData) => {
    const { data } = await api.put(`/boards/${id}`, boardData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/boards/${id}`);
    return data;
  },

  addMember: async (boardId, email) => {
    const { data } = await api.post(`/boards/${boardId}/members`, { email });
    return data;
  },

  removeMember: async (boardId, userId) => {
    const { data } = await api.delete(`/boards/${boardId}/members/${userId}`);
    return data;
  },

  createColumn: async (boardId, title) => {
    const { data } = await api.post(`/boards/${boardId}/columns`, { title });
    return data;
  },
};
