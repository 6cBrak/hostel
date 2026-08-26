import api from './axios'

export const listUsers = () => api.get('/auth/users/')
export const getUser = (id) => api.get(`/auth/users/${id}/`)
export const createUser = (payload) => api.post('/auth/users/', payload)
export const updateUser = (id, payload) => api.patch(`/auth/users/${id}/`, payload)
export const deactivateUser = (id) => api.delete(`/auth/users/${id}/`)
