import api from './axios';

export const getInventory = () => api.get('/inventory/');
export const updateInventory = (id, data) => api.patch(`/inventory/${id}/`, data);