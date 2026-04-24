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
    
  const response = await api.patch('/auth/profile', data, config);
  return response.data.data.user;
};

export const fetchMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
