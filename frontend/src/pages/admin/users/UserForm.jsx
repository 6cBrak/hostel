import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getUser, createUser, updateUser } from '../../../api/users'
import { listHostels } from '../../../api/hostels'
import { STAFF_ROLE_LABELS } from '../../../lib/userRoles'

const EMPTY = {
  email: '',
  full_name: '',
  phone_number: '',
  role: 'front_desk',
  password: '',
  is_active: true,
}

export default function UserForm() {
  const { id } = useParams()
  const isNew = id === 'nouveau'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [hostelIds, setHostelIds] = useState([])
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    if (isNew) return
    getUser(id).then((r) => {
      const u = r.data
      setForm({
        email: u.email,
        full_name: u.full_name,
        phone_number: u.phone_number || '',
        role: u.role,
        password: '',
        is_active: u.is_active,
      })
      setHostelIds(u.hostels || [])
    }).finally(() => setLoading(false))
  }, [id, isNew])

  const toggleHostel = (hostelId) => {
    setHostelIds((prev) =>
      prev.includes(hostelId) ? prev.filter((h) => h !== hostelId) : [...prev, hostelId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isNew) {
        await createUser({ ...form, hostels: hostelIds })
        toast.success('Utilisateur créé.')
      } else {
        const { password, email, ...updatable } = form
        await updateUser(id, { ...updatable, hostels: hostelIds })
        toast.success('Utilisateur mis à jour.')
      }
      navigate('/admin/utilisateurs')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div className="max-w-lg">
      <Link to="/admin/utilisateurs" className="text-sm text-brand-600 hover:underline">
        ← Retour aux utilisateurs
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {isNew ? 'Nouvel utilisateur' : `Modifier ${form.full_name}`}
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nom complet
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            disabled={!isNew}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Téléphone
          <input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Rôle
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        {form.role === 'manager' && (
          <div>
            <p className="text-sm font-medium text-gray-700">Hostels gérés</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {hostels.map((h) => (
                <label key={h.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={hostelIds.includes(h.id)}
                    onChange={() => toggleHostel(h.id)}
                  />
                  {h.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {isNew && (
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Mot de passe (8 caractères min.)
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        )}

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
