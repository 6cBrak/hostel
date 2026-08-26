import api from './axios'

export const login = (email, password) => api.post('/auth/login/', { email, password })
export const register = (payload) => api.post('/auth/register/', payload)
export const getMe = () => api.get('/auth/me/')
export const updateMe = (payload) => api.patch('/auth/me/', payload)
export const changePassword = (payload) => api.post('/auth/change-password/', payload)
export const logout = (refresh) => api.post('/auth/logout/', { refresh })
