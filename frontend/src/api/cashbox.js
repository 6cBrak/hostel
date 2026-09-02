import api from './axios'

// Pour les listes déroulantes (formulaires) : pas de pagination réelle attendue.
const ALL = { page_size: 200 }

export const listExpenseCategories = (params = ALL) => api.get('/expense-categories/', { params })
export const createExpenseCategory = (payload) => api.post('/expense-categories/', payload)
export const updateExpenseCategory = (id, payload) => api.patch(`/expense-categories/${id}/`, payload)
export const deleteExpenseCategory = (id) => api.delete(`/expense-categories/${id}/`)

export const listExpenses = (params) => api.get('/expenses/', { params })
export const getExpense = (id) => api.get(`/expenses/${id}/`)
export const createExpense = (payload) => api.post('/expenses/', payload)
export const updateExpense = (id, payload) => api.patch(`/expenses/${id}/`, payload)
export const deleteExpense = (id) => api.delete(`/expenses/${id}/`)

export const getCashboxSummary = () => api.get('/cashbox/')
export const listCashMovements = (params) => api.get('/cash-movements/', { params })
export const createCashMovement = (payload) => api.post('/cash-movements/', payload)
