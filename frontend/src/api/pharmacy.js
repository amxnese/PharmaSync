import api from './axios';

export const getInventory = () => api.get('/inventory/');

export const getPrescriptions = (patientName = '') => {
  const params = patientName ? `?patient=${patientName}` : '';
  return api.get(`/pharmacy/prescriptions/${params}`);
};

export const dispensePrescription = (id) =>
  api.patch(`/pharmacy/prescriptions/${id}/dispense/`);

export const addMedicine = (data) =>
  api.post('/pharmacy/medicines/add/', data);

export const incrementInventory = (id, amount) =>
  api.patch(`/pharmacy/inventory/${id}/increment/`, { amount });