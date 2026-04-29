import api from './axios';

export const searchPatients = (name) => api.get(`/patients/search/?name=${name}`);
export const createPatient = (data) => api.post('/patients/', data);
export const searchMedicines = (name) => api.get(`/medicines/search/?name=${name}`);
export const createPrescription = (patientId) => api.post('/prescriptions/', { patient_id: patientId });
export const addItemToPrescription = (prescriptionId, data) =>
  api.post(`/prescriptions/${prescriptionId}/items/`, data);
export const issuePrescription = (id) => api.patch(`/prescriptions/${id}/`, { status: 'issued' });
export const getPrescriptionHistory = () => api.get('/doctor/prescriptions/history/');
export const checkMedicineAvailability = (id) => api.get(`/medicines/${id}/availability/`);
export const updatePatient = (id, data) => api.patch(`/patients/${id}/`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}/`);
export const updatePrescriptionItem = (prescriptionId, itemId, data) =>
  api.patch(`/prescriptions/${prescriptionId}/items/${itemId}/`, data);
export const deletePrescriptionItem = (prescriptionId, itemId) =>
  api.delete(`/prescriptions/${prescriptionId}/items/${itemId}/`);