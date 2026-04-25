import api from './client';

/**
 * Updates the user's profile information, including avatar.
 * @param {FormData|Object} data - The profile data to update.
 * @returns {Promise<Object>} The updated user data.
 */
export const updateProfile = async (data) => {
  // If data is FormData, we need to let axios set the Content-Type automatically
  const config = data instanceof FormData 
    ? { headers: { 'Content-Type': 'multipart/form-data' } } 
    : {};
    
  const response = await api.patch('/users/profile', data, config);
  return response.data.data;
};

export const verifyEmail = (data) => api.post('/users/verify', data);
export const resendVerificationCode = (email) => api.post('/users/resend-code', { email });

export const fetchMe = async () => {
  const response = await api.get('/users/me');
  return response.data.data.user;
};
export const requestDeletion = async (data) => {
  const response = await api.post('/users/request-deletion', data);
  return response.data;
};

export const confirmDeletion = async (code) => {
  const response = await api.post('/users/confirm-deletion', { code });
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/users/request-reset', { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/users/perform-reset', data);
  return response.data;
};
