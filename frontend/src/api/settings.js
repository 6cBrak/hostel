import api from './axios'

export const getSiteSettings = () => api.get('/settings/')
export const updateSiteSettings = (payload) => api.patch('/settings/', payload)
