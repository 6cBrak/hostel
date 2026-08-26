import api from './axios'

export const listInvoices = (params) => api.get('/billing/invoices/', { params })
export const getInvoice = (id) => api.get(`/billing/invoices/${id}/`)
export const listPayments = (params) => api.get('/billing/payments/', { params })
export const createPayment = (payload) => api.post('/billing/payments/', payload)
export const listReceipts = (params) => api.get('/billing/receipts/', { params })
