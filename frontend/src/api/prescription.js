import api from './axios';

export const getPrescriptions = () => api.get('/prescriptions/');
export const createPrescription = (data) => api.post('/prescriptions/', data);
export const issuePrescription = (id) => api.patch(`/prescriptions/${id}/`, { status: 'issued' });
export const addPrescriptionItem = (prescriptionId, data) =>
  api.post(`/prescriptions/${prescriptionId}/items/`, data);
// response includes { item, alert } — check alert to show warning