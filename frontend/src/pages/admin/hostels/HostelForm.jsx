import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getHostel, createHostel, updateHostel } from '../../../api/hostels'

const EMPTY = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  phone_number: '',
  email: '',
  description: '',
  has_external_kitchen: false,
  is_active: true,
}

export default function HostelForm() {
  const { id } = useParams()
  const isNew = id === 'nouveau'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [coverImage, setCoverImage] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isNew) return
    getHostel(id)
      .then((r) => {
        const h = r.data
        setForm({
          name: h.name || '',
          address: h.address || '',
          latitude: h.latitude ?? '',
          longitude: h.longitude ?? '',
          phone_number: h.phone_number || '',
          email: h.email || '',
          description: h.description || '',
          has_external_kitchen: h.has_external_kitchen,
          is_active: h.is_active,
        })
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value != null) data.append(key, value)
      })
      if (coverImage) data.append('cover_image', coverImage)

      if (isNew) {
        // slug is required by the model; derive a simple one from the name.
        data.append('slug', form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
        await createHostel(data)
        toast.success('Hostel créé.')
      } else {
        await updateHostel(id, data)
        toast.success('Hostel mis à jour.')
      }
      navigate('/admin/hostels')
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
      <Link to="/admin/hostels" className="text-sm text-brand-600 hover:underline">
        ← Retour aux hostels
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {isNew ? 'Nouveau hostel' : `Modifier ${form.name}`}
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nom
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Adresse
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Latitude (optionnel)
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Longitude (optionnel)
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Téléphone
            <input
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Photo de couverture
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.has_external_kitchen}
            onChange={(e) => setForm({ ...form, has_external_kitchen: e.target.checked })}
          />
          Cuisine externe
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Actif (visible sur le site public)
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
