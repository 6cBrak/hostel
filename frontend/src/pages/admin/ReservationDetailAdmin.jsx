import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getReservation, acceptReservation, rejectReservation, proposeAlternative } from '../../api/reservations'
import { listRooms, listHostels } from '../../api/hostels'
import { listExternalResidences } from '../../api/externalResidences'
import { STATUS_LABELS, STATUS_TONES } from '../../lib/reservationStatus'

export default function ReservationDetailAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('accept')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getReservation(id)
      .then((r) => setReservation(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (!reservation) return <p className="text-gray-500">Demande introuvable.</p>

  const canAct = ['pending', 'alternative_rejected'].includes(reservation.status)

  return (
    <div>
      <Link to="/admin/reservations" className="text-sm text-brand-600 hover:underline">
        ← Retour aux demandes
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{reservation.reservation_number}</h1>
        <span className={`rounded px-2.5 py-1 text-sm font-medium ${STATUS_TONES[reservation.status]}`}>
          {STATUS_LABELS[reservation.status] || reservation.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Détails de la demande */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Étudiant demandeur</h2>
          <dl className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Nom</dt><dd className="text-right font-medium text-gray-900">{reservation.requester.user.full_name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Email</dt><dd className="text-right font-medium text-gray-900">{reservation.requester.user.email}</dd></div>
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Téléphone</dt><dd className="text-right font-medium text-gray-900">{reservation.requester.user.phone_number || '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Nationalité</dt><dd className="text-right font-medium text-gray-900">{reservation.requester.nationality || '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Programme</dt><dd className="text-right font-medium text-gray-900">{reservation.requester.program || '—'}</dd></div>
          </dl>

          <h2 className="mt-5 font-semibold text-gray-900">Demande</h2>
          <dl className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Hostel demandé</dt><dd className="text-right font-medium text-gray-900">{reservation.hostel_name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Date d'entrée souhaitée</dt><dd className="text-right font-medium text-gray-900">{reservation.desired_start_date}</dd></div>
            {reservation.desired_end_date && (
              <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Date de sortie</dt><dd className="text-right font-medium text-gray-900">{reservation.desired_end_date}</dd></div>
            )}
            <div className="flex justify-between gap-3"><dt className="shrink-0 text-gray-500">Groupe</dt><dd className="text-right font-medium text-gray-900">{reservation.is_group ? `Oui (${reservation.number_of_people} pers.)` : 'Non'}</dd></div>
            {reservation.room_detail && (
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-gray-500">Chambre souhaitée</dt>
                <dd className="text-right font-medium text-gray-900">
                  {reservation.room_detail.number} — {reservation.room_detail.room_type_name} /{' '}
                  {reservation.room_detail.comfort_name}
                </dd>
              </div>
            )}
          </dl>

          {reservation.members?.length > 0 && (
            <>
              <h2 className="mt-5 font-semibold text-gray-900">Membres du groupe</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
                {reservation.members.map((m) => (
                  <li key={m.id}>
                    {m.full_name} {m.phone_number && `· ${m.phone_number}`}
                  </li>
                ))}
              </ul>
            </>
          )}

          {reservation.status === 'rejected' && reservation.rejection_reason && (
            <div className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <strong>Motif du rejet :</strong> {reservation.rejection_reason}
            </div>
          )}
          {['alternative_proposed', 'alternative_rejected'].includes(reservation.status) && (
            <div className="mt-5 rounded-md bg-sky-50 p-3 text-sm text-sky-800">
              <strong>Alternative proposée :</strong>{' '}
              {reservation.alternative_room_detail
                ? `Chambre ${reservation.alternative_room_detail.number} — ${reservation.alternative_hostel_name}`
                : reservation.alternative_hostel_name || 'Résidence externe'}
              {reservation.alternative_note && <p className="mt-1">{reservation.alternative_note}</p>}
            </div>
          )}
        </div>

        {/* Panneau d'action */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          {!canAct ? (
            <p className="text-sm text-gray-500">
              Cette demande a déjà été traitée
              {reservation.status === 'alternative_proposed' &&
                " — en attente de la réponse de l'étudiant à la proposition."}
            </p>
          ) : (
            <>
              <div className="flex rounded-md border border-gray-300 text-sm">
                {[
                  ['accept', 'Accepter'],
                  ['reject', 'Rejeter'],
                  ['alternative', 'Proposer alternative'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setAction(value)}
                    className={`flex-1 px-3 py-2 font-medium ${
                      action === value ? 'bg-brand-900 text-white' : 'bg-white text-gray-600'
                    } first:rounded-l-md last:rounded-r-md`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {action === 'accept' && (
                  <AcceptForm
                    reservation={reservation}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    onDone={load}
                  />
                )}
                {action === 'reject' && (
                  <RejectForm
                    reservationId={reservation.id}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    onDone={load}
                  />
                )}
                {action === 'alternative' && (
                  <AlternativeForm
                    reservationId={reservation.id}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    onDone={load}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AcceptForm({ reservation, submitting, setSubmitting, onDone }) {
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState(reservation.room || '')
  const [bedsReserved, setBedsReserved] = useState(reservation.beds_reserved || 1)

  useEffect(() => {
    listRooms({ hostel: reservation.hostel, status: 'available', page_size: 100 }).then((r) => {
      const all = r.data.results ?? r.data
      // Ne montre que les chambres avec au moins un lit libre (sauf la chambre
      // déjà présélectionnée sur la réservation, pour ne pas la faire disparaître).
      setRooms(all.filter((room) => room.beds_available > 0 || room.id === reservation.room))
    })
  }, [reservation.hostel, reservation.room])

  const selectedRoom = rooms.find((room) => String(room.id) === String(roomId))
  const maxBeds = selectedRoom?.beds_available || 1

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roomId) {
      toast.error('Sélectionnez une chambre à affecter.')
      return
    }
    setSubmitting(true)
    try {
      await acceptReservation(reservation.id, roomId, bedsReserved)
      toast.success('Réservation acceptée — facture pro-forma générée.')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'acceptation.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Chambre à affecter
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">— Sélectionner —</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              Chambre {room.number} — {room.room_type_name} / {room.comfort_name} ({room.beds_available}/{room.beds_count} lit(s) libre(s))
            </option>
          ))}
        </select>
      </label>
      {selectedRoom && (
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Lits réservés
          <input
            type="number"
            min="1"
            max={maxBeds}
            value={bedsReserved}
            onChange={(e) => setBedsReserved(Math.min(Number(e.target.value) || 1, maxBeds))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 sm:max-w-[160px]"
          />
          <span className="text-xs font-normal text-gray-400">
            1 lit pour ce seul locataire, ou {maxBeds} pour louer toute la chambre.
          </span>
        </label>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Accepter la réservation
      </button>
    </form>
  )
}

function RejectForm({ reservationId, submitting, setSubmitting, onDone }) {
  const [reason, setReason] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await rejectReservation(reservationId, reason)
      toast.success('Réservation rejetée.')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors du rejet.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Motif du rejet
        <textarea
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        Rejeter la réservation
      </button>
    </form>
  )
}

function AlternativeForm({ reservationId, submitting, setSubmitting, onDone }) {
  const [hostels, setHostels] = useState([])
  const [externalResidences, setExternalResidences] = useState([])
  const [rooms, setRooms] = useState([])
  const [altHostel, setAltHostel] = useState('')
  const [altRoom, setAltRoom] = useState('')
  const [altExternal, setAltExternal] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
    listExternalResidences({ is_available: true }).then((r) => setExternalResidences(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    if (!altHostel) {
      setRooms([])
      return
    }
    listRooms({ hostel: altHostel, status: 'available', page_size: 100 }).then((r) =>
      setRooms(r.data.results ?? r.data)
    )
  }, [altHostel])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!altRoom && !altExternal) {
      toast.error('Choisissez une chambre alternative ou une résidence externe.')
      return
    }
    setSubmitting(true)
    try {
      await proposeAlternative(reservationId, {
        alternative_hostel: altRoom ? altHostel : null,
        alternative_room: altRoom || null,
        alternative_external_residence: altExternal || null,
        note,
      })
      toast.success('Alternative proposée à l’étudiant.')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la proposition.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Hostel alternatif
        <select
          value={altHostel}
          onChange={(e) => {
            setAltHostel(e.target.value)
            setAltRoom('')
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">— Aucun (résidence externe) —</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>

      {altHostel && (
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Chambre alternative
          <select
            value={altRoom}
            onChange={(e) => setAltRoom(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">— Sélectionner —</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Chambre {room.number} — {room.room_type_name} / {room.comfort_name}
              </option>
            ))}
          </select>
        </label>
      )}

      {!altHostel && (
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Résidence externe
          <select
            value={altExternal}
            onChange={(e) => setAltExternal(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">— Sélectionner —</option>
            {externalResidences.map((ext) => (
              <option key={ext.id} value={ext.id}>
                {ext.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Message pour l'étudiant (optionnel)
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
      >
        Envoyer la proposition
      </button>
    </form>
  )
}
