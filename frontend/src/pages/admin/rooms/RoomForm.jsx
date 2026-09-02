import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getRoom, createRoom, updateRoom, listHostels, listZones,
  listRoomTypes, listComfortOptions, listAmenities,
  uploadRoomPhoto, deleteRoomPhoto,
} from '../../../api/hostels'
import { ROOM_STATUS_LABELS, ELECTRICITY_POLICY_LABELS } from '../../../lib/roomLabels'

const EMPTY = {
  hostel: '',
  zone: '',
  number: '',
  floor: '',
  room_type: '',
  comfort: '',
  beds_count: '',
  electricity_policy: 'included',
  status: 'available',
  notes: '',
}

export default function RoomForm() {
  const { id } = useParams()
  const isNew = id === 'nouvelle'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [photos, setPhotos] = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState(null)
  const [amenityIds, setAmenityIds] = useState([])
  const [hostels, setHostels] = useState([])
  const [zones, setZones] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [comforts, setComforts] = useState([])
  const [amenities, setAmenities] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [submitting, setSubmitting] = useState(false)
  const [occupancy, setOccupancy] = useState(null)

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
    listRoomTypes().then((r) => setRoomTypes(r.data.results ?? r.data))
    listComfortOptions().then((r) => setComforts(r.data.results ?? r.data))
    listAmenities().then((r) => setAmenities(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    if (!form.hostel) {
      setZones([])
      return
    }
    listZones({ hostel: form.hostel }).then((r) => setZones(r.data.results ?? r.data))
  }, [form.hostel])

  useEffect(() => {
    if (isNew) return
    getRoom(id).then((r) => {
      const room = r.data
      setForm({
        hostel: room.hostel,
        zone: room.zone || '',
        number: room.number,
        floor: room.floor || '',
        room_type: room.room_type,
        comfort: room.comfort,
        beds_count: room.beds_count,
        electricity_policy: room.electricity_policy,
        status: room.status,
        notes: room.notes || '',
      })
      setAmenityIds((room.amenities || []).map((a) => a.id))
      setPhotos(room.photos || [])
      setOccupancy({
        beds_taken: room.beds_taken,
        beds_available: room.beds_available,
        occupancy_status: room.occupancy_status,
      })
    }).finally(() => setLoading(false))
  }, [id, isNew])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      toast.error('Format non autorisé. Formats acceptés : JPG, PNG.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (5 Mo maximum).')
      e.target.value = ''
      return
    }
    setUploadingPhoto(true)
    try {
      const { data } = await uploadRoomPhoto(id, file)
      setPhotos(data.photos || [])
      toast.success('Photo ajoutée.')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors?.detail || "Erreur lors de l'envoi de la photo.")
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handlePhotoDelete = async (photoId) => {
    setDeletingPhotoId(photoId)
    try {
      const { data } = await deleteRoomPhoto(id, photoId)
      setPhotos(data.photos || [])
      toast.success('Photo supprimée.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    } finally {
      setDeletingPhotoId(null)
    }
  }

  const toggleAmenity = (amenityId) => {
    setAmenityIds((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        zone: form.zone || null,
        beds_count: Number(form.beds_count) || 1,
        amenity_ids: amenityIds,
      }
      if (isNew) {
        await createRoom(payload)
        toast.success('Chambre créée.')
      } else {
        await updateRoom(id, payload)
        toast.success('Chambre mise à jour.')
      }
      navigate('/admin/chambres')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div className="max-w-2xl">
      <Link to="/admin/chambres" className="text-sm text-brand-600 hover:underline">
        ← Retour aux chambres
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {isNew ? 'Nouvelle chambre' : `Modifier la chambre ${form.number}`}
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Hostel
            <select
              required
              value={form.hostel}
              onChange={(e) => setForm({ ...form, hostel: e.target.value, zone: '' })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sélectionner —</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Zone / Bloc (optionnel)
            <select
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              disabled={!form.hostel}
            >
              <option value="">— Aucune —</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Numéro
            <input
              required
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Étage (optionnel)
            <input
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Type de chambre
            <select
              required
              value={form.room_type}
              onChange={(e) => {
                const roomType = roomTypes.find((rt) => String(rt.id) === e.target.value)
                setForm((prev) => ({
                  ...prev,
                  room_type: e.target.value,
                  // Préremplit le nombre de lits depuis la capacité du type — reste
                  // éditable ensuite (n'écrase pas une valeur déjà saisie).
                  beds_count: prev.beds_count === '' && roomType ? roomType.capacity : prev.beds_count,
                }))
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sélectionner —</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} ({rt.capacity} pers.)</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Confort
            <select
              required
              value={form.comfort}
              onChange={(e) => setForm({ ...form, comfort: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sélectionner —</option>
              {comforts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nombre de lits
          <input
            type="number"
            min="1"
            required
            value={form.beds_count}
            onChange={(e) => setForm({ ...form, beds_count: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 sm:max-w-[160px]"
          />
          <span className="text-xs font-normal text-gray-400">
            Unité de facturation : chaque lit peut être loué à un locataire distinct.
            {occupancy && (
              <>
                {' '}Actuellement : {occupancy.beds_taken} occupé(s), {occupancy.beds_available} libre(s).
              </>
            )}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Électricité
          <select
            value={form.electricity_policy}
            onChange={(e) => setForm({ ...form, electricity_policy: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(ELECTRICITY_POLICY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Statut
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-medium text-gray-700">Équipements</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={amenityIds.includes(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                />
                {a.name}
              </label>
            ))}
            {amenities.length === 0 && (
              <p className="text-xs text-gray-400">
                Aucun équipement défini — ajoutez-en dans « Référentiels ».
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Photos</p>
          {isNew ? (
            <p className="mt-2 text-xs text-gray-400">
              Enregistrez d'abord la chambre pour pouvoir y ajouter des photos.
            </p>
          ) : (
            <>
              {photos.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative overflow-hidden rounded-md border border-gray-200">
                      <img src={photo.url} alt={photo.name} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handlePhotoDelete(photo.id)}
                        disabled={deletingPhotoId === photo.id}
                        className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60"
                      >
                        {deletingPhotoId === photo.id ? '…' : 'Supprimer'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-60"
                />
                {uploadingPhoto && <p className="mt-2 text-xs text-gray-500">Envoi en cours…</p>}
              </div>
            </>
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Notes internes (optionnel)
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-md bg-brand-900 px-5 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
