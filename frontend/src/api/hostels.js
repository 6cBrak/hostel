import api from './axios'

// Pour les listes déroulantes (formulaires) : pas de pagination réelle attendue,
// on demande une page large pour ne rien tronquer silencieusement.
const ALL = { page_size: 200 }

export const listHostels = (params = ALL) => api.get('/hostels/', { params })
export const getHostel = (id) => api.get(`/hostels/${id}/`)
export const createHostel = (payload) => api.post('/hostels/', payload)
export const updateHostel = (id, payload) => api.patch(`/hostels/${id}/`, payload)
export const deleteHostel = (id) => api.delete(`/hostels/${id}/`)

export const listRooms = (params) => api.get('/rooms/', { params })
export const getRoom = (id) => api.get(`/rooms/${id}/`)
export const createRoom = (payload) => api.post('/rooms/', payload)
export const updateRoom = (id, payload) => api.patch(`/rooms/${id}/`, payload)
export const deleteRoom = (id) => api.delete(`/rooms/${id}/`)

export const uploadRoomPhoto = (id, file) => {
  const data = new FormData()
  data.append('file', file)
  return api.post(`/rooms/${id}/photos/`, data)
}
export const deleteRoomPhoto = (id, photoId) =>
  api.delete(`/rooms/${id}/photos/`, { params: { id: photoId } })

export const listRoomTypes = (params = ALL) => api.get('/room-types/', { params })
export const createRoomType = (payload) => api.post('/room-types/', payload)
export const updateRoomType = (id, payload) => api.patch(`/room-types/${id}/`, payload)
export const deleteRoomType = (id) => api.delete(`/room-types/${id}/`)

export const listComfortOptions = (params = ALL) => api.get('/comfort-options/', { params })
export const createComfortOption = (payload) => api.post('/comfort-options/', payload)
export const updateComfortOption = (id, payload) => api.patch(`/comfort-options/${id}/`, payload)
export const deleteComfortOption = (id) => api.delete(`/comfort-options/${id}/`)

export const listAmenities = (params = ALL) => api.get('/amenities/', { params })
export const createAmenity = (payload) => api.post('/amenities/', payload)
export const updateAmenity = (id, payload) => api.patch(`/amenities/${id}/`, payload)
export const deleteAmenity = (id) => api.delete(`/amenities/${id}/`)

export const listZones = (params) => api.get('/zones/', { params: params ?? ALL })
export const createZone = (payload) => api.post('/zones/', payload)
export const updateZone = (id, payload) => api.patch(`/zones/${id}/`, payload)
export const deleteZone = (id) => api.delete(`/zones/${id}/`)

export const listPrices = (params) => api.get('/prices/', { params })
export const getPrice = (id) => api.get(`/prices/${id}/`)
export const createPrice = (payload) => api.post('/prices/', payload)
export const updatePrice = (id, payload) => api.patch(`/prices/${id}/`, payload)
export const deletePrice = (id) => api.delete(`/prices/${id}/`)
