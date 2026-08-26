import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getExternalResidence, createExternalResidence, updateExternalResidence,
} from '../../../api/externalResidences'

const EMPTY = {
  name: '',
  address: '',
  contact_name: '',
  phone_number: '',
  email: '',
  number_of_rooms: 0,
  characteristics: '',
  tariffs_notes: '',
  conditions: '',
  is_available: true,
  is_active: true,
}

export default function ExternalResidenceForm() {
  const { id } = useParams()
  const isNew = id === 'nouvelle'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isNew) return
    getExternalResidence(id).then((r) => {
      const d = r.data
      setForm({
        name: d.name || '',
        address: d.address || '',
        contact_name: d.contact_name || '',
        phone_number: d.phone_number || '',
        email: d.email || '',
        number_of_rooms: d.number_of_rooms ?? 0,
        characteristics: d.characteristics || '',
        tariffs_notes: d.tariffs_notes || '',
        conditions: d.conditions || '',
        is_available: d.is_available,
        is_active: d.is_active,
      })
    }).finally(() => setLoading(false))
  }, [id, isNew])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isNew) {
        await createExternalResidence(form)
        toast.success('Résidence externe créée.')
      } else {
        await updateExternalResidence(id, form)
        toast.success('Résidence externe mise à jour.')
      }
      navigate('/admin/residences-externes')
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
      <Link to="/admin/residences-externes" className="text-sm text-brand-600 hover:underline">
        ← Retour aux résidences externes
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {isNew ? 'Nouvelle résidence externe' : `Modifier ${form.name}`}
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
            Personne responsable
            <input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Nombre de chambres
            <input
              type="number"
              min="0"
              value={form.number_of_rooms}
              onChange={(e) => setForm({ ...form, number_of_rooms: e.target.value })}
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
          Caractéristiques
          <textarea
            rows={2}
            value={form.characteristics}
            onChange={(e) => setForm({ ...form, characteristics: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Tarifs (notes libres)
          <textarea
            rows={2}
            value={form.tariffs_notes}
            onChange={(e) => setForm({ ...form, tariffs_notes: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Conditions
          <textarea
            rows={2}
            value={form.conditions}
            onChange={(e) => setForm({ ...form, conditions: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
          />
          Disponible actuellement
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Actif (proposable en alternative)
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
