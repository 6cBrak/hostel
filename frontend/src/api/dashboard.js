import api from './axios'

export const getDashboardStats = () => api.get('/dashboard/stats/')

const REPORT_ENDPOINTS = {
  rooms: { url: '/reports/rooms/', filename: 'chambres.xlsx' },
  reservations: { url: '/reports/reservations/', filename: 'reservations.xlsx' },
  tenants: { url: '/reports/tenants/', filename: 'locataires.xlsx' },
  revenue: { url: '/reports/revenue/', filename: 'revenus.xlsx' },
  transfers: { url: '/reports/transfers/', filename: 'transferts.xlsx' },
}

export async function downloadReport(key) {
  const report = REPORT_ENDPOINTS[key]
  const response = await api.get(report.url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = report.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
