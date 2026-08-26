import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getPrice, createPrice, updatePrice, listHostels, listRoomTypes, listComfortOptions,
} from '../../../api/hostels'

const EMPTY = {
  hostel: '',
  room_type: '',
  comfort: '',
  monthly_rate: '',
  period_rate: '',
  electricity_fee: '',
  admin_fee: '',
  deposit: '',
  free_cancellation: false,
  is_active: true,
}

export default function PriceForm() {
  const { id } = useParams()
  const isNew = id === 'nouveau'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [hostels, setHostels] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [comforts, setComforts] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
    listRoomTypes().then((r) => setRoomTypes(r.data.results ?? r.data))
    listComfortOptions().then((r) => setComforts(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    if (isNew) return
    getPrice(id).then((r) => {
      const p = r.data
      setForm({
        hostel: p.hostel,
        room_type: p.room_type,
        comfort: p.comfort,
        monthly_rate: p.monthly_rate,
        period_rate: p.period_rate ?? '',
        electricity_fee: p.electricity_fee ?? '',
        admin_fee: p.admin_fee ?? '',
        deposit: p.deposit ?? '',
        free_cancellation: p.free_cancellation,
        is_active: p.is_active,
      })
    }).finally(() => setLoading(false))
  }, [id, isNew])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        period_rate: form.period_rate || null,
        electricity_fee: form.electricity_fee || null,
        admin_fee: form.admin_fee || null,
        deposit: form.deposit || null,
      }
      if (isNew) {
        await createPrice(payload)
        toast.success('Tarif créé.')
      } else {
        await updatePrice(id, payload)
        toast.success('Tarif mis à jour.')
      }
      navigate('/admin/tarifs')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div className="max-w-xl">
      <Link to="/admin/tarifs" className="text-sm text-brand-600 hover:underline">
        ← Retour aux tarifs
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {isNew ? 'Nouveau tarif' : 'Modifier le tarif'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Hostel
          <select
            required
            value={form.hostel}
            onChange={(e) => setForm({ ...form, hostel: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">— Sélectionner —</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Type de chambre
            <select
              required
              value={form.room_type}
              onChange={(e) => setForm({ ...form, room_type: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sélectionner —</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
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
          Tarif mensuel (FCFA)
          <input
            type="number"
            min="0"
            required
            value={form.monthly_rate}
            onChange={(e) => setForm({ ...form, monthly_rate: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Tarif par période (optionnel)
            <input
              type="number"
              min="0"
              value={form.period_rate}
              onChange={(e) => setForm({ ...form, period_rate: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Frais d'électricité (optionnel)
            <input
              type="number"
              min="0"
              value={form.electricity_fee}
              onChange={(e) => setForm({ ...form, electricity_fee: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Frais administratifs (optionnel)
            <input
              type="number"
              min="0"
              value={form.admin_fee}
              onChange={(e) => setForm({ ...form, admin_fee: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Caution (optionnel)
            <input
              type="number"
              min="0"
              value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.free_cancellation}
            onChange={(e) => setForm({ ...form, free_cancellation: e.target.checked })}
          />
          Annulation gratuite
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Actif
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
