import api from './api';

export const taskService = {
  create: async (columnId, taskData) => {
    const { data } = await api.post(`/tasks/columns/${columnId}`, taskData);
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  update: async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },

  reorder: async (reorderData) => {
    const { data } = await api.put('/tasks/reorder', reorderData);
    return data;
  },

  addComment: async (taskId, text) => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
    return data;
  },
};

export const columnService = {
  update: async (id, title) => {
    const { data } = await api.put(`/columns/${id}`, { title });
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/columns/${id}`);
    return data;
  },

  reorder: async (boardId, columnOrder) => {
    const { data } = await api.put('/columns/reorder', { boardId, columnOrder });
    return data;
  },
};
