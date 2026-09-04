import api from './axios'

export const listMyReservations = () => api.get('/reservations/')
export const listReservations = (params) => api.get('/reservations/', { params })
export const listTenants = (params) => api.get('/reservations/tenants/', { params })
export const listTransfers = (params) => api.get('/reservations/transfers/', { params })
export const getReservation = (id) => api.get(`/reservations/${id}/`)
export const createReservation = (payload) => api.post('/reservations/', payload)
export const respondAlternative = (id, decision) =>
  api.post(`/reservations/${id}/respond-alternative/`, { decision })
export const getMyStudentProfile = () => api.get('/students/me/')
export const updateMyStudentProfile = (payload) => api.patch('/students/me/', payload)

export const uploadMyDocument = (file) => {
  const data = new FormData()
  data.append('file', file)
  return api.post('/students/me/documents/', data)
}
export const deleteMyDocument = (id) => api.delete('/students/me/documents/', { params: { id } })

// Traitement staff des demandes (Lot 4)
export const acceptReservation = (id, roomId, bedsReserved) =>
  api.post(`/reservations/${id}/accept/`, {
    ...(roomId ? { room: roomId } : {}),
    ...(bedsReserved ? { beds_reserved: bedsReserved } : {}),
  })
export const rejectReservation = (id, reason) =>
  api.post(`/reservations/${id}/reject/`, { reason })
export const proposeAlternative = (id, payload) =>
  api.post(`/reservations/${id}/propose-alternative/`, payload)

export const createCheckOut = (payload) => api.post('/check-outs/', payload)
export const extendReservation = (id, additionalMonths) =>
  api.post(`/reservations/${id}/extend/`, { additional_months: additionalMonths })
export const transferReservation = (id, payload) => api.post(`/reservations/${id}/transfer/`, payload)
