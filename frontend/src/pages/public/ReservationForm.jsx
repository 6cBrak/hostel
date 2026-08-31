import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getRoom } from '../../api/hostels'
import { createReservation } from '../../api/reservations'
import { useAuth } from '../../context/AuthContext'

const EMPTY_MEMBER = { full_name: '', sex: '', phone_number: '', email: '' }

export default function ReservationForm() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room')
  const navigate = useNavigate()
  const { isAuthenticated, isStudent, loading: authLoading } = useAuth()

  const [room, setRoom] = useState(null)
  const [form, setForm] = useState({
    is_group: false,
    number_of_people: 1,
    desired_start_date: '',
    duration_months: 1,
  })
  const [members, setMembers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (roomId) getRoom(roomId).then((r) => setRoom(r.data))
  }, [roomId])

  if (authLoading) return null

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-gray-700">Connectez-vous pour soumettre une demande de réservation.</p>
        <Link
          to="/connexion"
          className="mt-4 inline-block rounded-md bg-brand-900 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  if (!isStudent) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-gray-700">
        Seul un compte étudiant peut soumettre une demande de réservation.
      </div>
    )
  }

  const toggleGroup = (checked) => {
    const nextMembers = checked && members.length === 0 ? [{ ...EMPTY_MEMBER }] : members
    setForm({ ...form, is_group: checked, number_of_people: checked ? 1 + nextMembers.length : 1 })
    if (nextMembers !== members) setMembers(nextMembers)
  }

  const addMember = () => {
    const next = [...members, { ...EMPTY_MEMBER }]
    setMembers(next)
    setForm({ ...form, number_of_people: 1 + next.length })
  }

  const removeMember = (index) => {
    const next = members.filter((_, i) => i !== index)
    setMembers(next)
    setForm({ ...form, number_of_people: 1 + next.length })
  }

  const updateMember = (index, field, value) => {
    const next = members.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    setMembers(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!room) return

    if (form.is_group) {
      const incomplete = members.some((m) => !m.full_name.trim())
      if (incomplete) {
        toast.error('Indiquez au moins le nom complet de chaque membre du groupe.')
        return
      }
    }

    setSubmitting(true)
    try {
      const { data } = await createReservation({
        hostel: room.hostel,
        room: room.id,
        requested_room_type: room.room_type,
        requested_comfort: room.comfort,
        ...form,
        members: form.is_group ? members : [],
      })
      toast.success(`Demande ${data.reservation_number} envoyée !`)
      navigate('/espace/reservations')
    } catch (err) {
      const errors = err.response?.data
      const message = errors ? Object.values(errors).flat().join(' ') : "Erreur lors de l'envoi."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Demande de réservation</h1>
      {room && (
        <p className="mt-1 text-gray-500">
          {room.hostel_name} — Chambre {room.number} ({room.room_type_detail?.name},{' '}
          {room.comfort_detail?.name})
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Date d'entrée souhaitée
          <input
            type="date"
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
            value={form.desired_start_date}
            onChange={(e) => setForm({ ...form, desired_start_date: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Durée souhaitée (en mois)
          <input
            type="number"
            min="1"
            max="36"
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
            value={form.duration_months}
            onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) })}
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.is_group}
            onChange={(e) => toggleGroup(e.target.checked)}
          />
          Réservation de groupe
        </label>

        {form.is_group ? (
          <div>
            <p className="text-sm font-medium text-gray-700">
              Membres du groupe — {form.number_of_people} personne{form.number_of_people > 1 ? 's' : ''} au total (vous inclus)
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {members.map((member, index) => (
                <div key={index} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Membre {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Nom complet"
                      value={member.full_name}
                      onChange={(e) => updateMember(index, 'full_name', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 sm:col-span-2"
                    />
                    <select
                      value={member.sex}
                      onChange={(e) => updateMember(index, 'sex', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    >
                      <option value="">Sexe —</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                    <input
                      placeholder="Téléphone"
                      value={member.phone_number}
                      onChange={(e) => updateMember(index, 'phone_number', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optionnel)"
                      value={member.email}
                      onChange={(e) => updateMember(index, 'email', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMember}
              className="mt-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              + Ajouter un membre
            </button>
          </div>
        ) : (
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Nombre de personnes
            <input
              type="number"
              min="1"
              required
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
              value={form.number_of_people}
              onChange={(e) => setForm({ ...form, number_of_people: Number(e.target.value) })}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-brand-900 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Envoi…' : 'Soumettre la demande'}
        </button>
      </form>
    </div>
  )
}
