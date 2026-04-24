import api from './client';

export const fetchTasks = async (params) => {
  const { data } = await api.get('/tasks', { params });
  return data.data.tasks;
};

export const fetchStats = async () => {
  const { data } = await api.get('/tasks/stats');
  return data.data.stats;
};

export const createTask = async (taskData) => {
  const { data } = await api.post('/tasks', taskData);
  return data.data.task;
};

export const updateTask = async (id, taskData) => {
  const { data } = await api.patch(`/tasks/${id}`, taskData);
  return data.data.task;
};

export const trashTask = async (id) => {
  const { data } = await api.patch(`/tasks/${id}/trash`);
  return data.data.task;
};

export const toggleTask = async (id) => {
  const { data } = await api.patch(`/tasks/${id}/toggle`);
  return data.data.task;
};

export const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`);
};

export const fetchTrash = async () => {
  const { data } = await api.get('/tasks/trash');
  return data.data.trash;
};

export const emptyTrash = async () => {
  await api.delete('/tasks/trash/empty');
};
