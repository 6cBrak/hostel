import api from './axios'

export const getSiteSettings = () => api.get('/settings/')
export const updateSiteSettings = (payload) => api.patch('/settings/', payload)

export const downloadTenantsResetBackup = () =>
  api.get('/administration/reset-backup/', { responseType: 'blob' })
export const resetTenantsData = (confirm) =>
  api.post('/administration/reset-tenants-data/', { confirm })
