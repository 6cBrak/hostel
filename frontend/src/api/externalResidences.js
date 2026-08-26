import api from './axios'

export const listExternalResidences = (params) => api.get('/external-residences/', { params })
export const getExternalResidence = (id) => api.get(`/external-residences/${id}/`)
export const createExternalResidence = (payload) => api.post('/external-residences/', payload)
export const updateExternalResidence = (id, payload) => api.patch(`/external-residences/${id}/`, payload)
export const deleteExternalResidence = (id) => api.delete(`/external-residences/${id}/`)
