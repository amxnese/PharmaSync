import api from './axios';

export const getMedicines = () => api.get('/medicines/');
export const createMedicine = (data) => api.post('/medicines/', data);