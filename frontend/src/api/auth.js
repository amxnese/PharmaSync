// import api from './axios';

// export const login = async (email, password) => {
//   const res = await api.post('/auth/login/', { email, password });
//   localStorage.setItem('access_token', res.data.access);
//   localStorage.setItem('refresh_token', res.data.refresh);
//   return res.data;
// };

// export const getMe = () => api.get('/auth/me/');

import api from './axios';

export const login = async (email, password) => {
  const res = await api.post('/auth/login/', { email, password });
  // store everything we need
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  localStorage.setItem('role', res.data.role);
  localStorage.setItem('full_name', res.data.full_name);
  return res.data;
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/';
};

export const getRole = () => localStorage.getItem('role');
export const getFullName = () => localStorage.getItem('full_name');
export const isAuthenticated = () => !!localStorage.getItem('access_token');


export const changePassword = (data) => api.post('/auth/change-password/', data);
export const requestOTP = (email) => api.post('/auth/request-otp/', { email });
export const resetPassword = (data) => api.post('/auth/reset-password/', data);