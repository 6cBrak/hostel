import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyReservations, respondAlternative } from '../../api/reservations'
import toast from 'react-hot-toast'
import { STATUS_LABELS } from '../../lib/reservationStatus'

const HAS_INVOICE_STATUSES = ['accepted', 'confirmed']

export default function MyReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listMyReservations()
      .then((r) => setReservations(r.data.results ?? r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleRespond = async (id, decision) => {
    try {
      await respondAlternative(id, decision)
      toast.success('Réponse envoyée')
      load()
    } catch {
      toast.error("Erreur lors de l'envoi de la réponse.")
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>

      {loading ? (
        <p className="mt-6 text-gray-500">Chargement…</p>
      ) : reservations.length === 0 ? (
        <p className="mt-6 text-gray-500">Vous n'avez pas encore de réservation.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {reservations.map((res) => (
            <div key={res.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{res.reservation_number}</span>
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {STATUS_LABELS[res.status] || res.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {res.hostel_name} · à partir du {res.desired_start_date}
              </p>
              {HAS_INVOICE_STATUSES.includes(res.status) && (
                <Link
                  to={`/espace/factures/${res.id}`}
                  className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
                >
                  Voir ma facture →
                </Link>
              )}
              {res.status === 'alternative_proposed' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleRespond(res.id, 'accept')}
                    className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleRespond(res.id, 'request_other')}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Demander une autre proposition
                  </button>
                  <button
                    onClick={() => handleRespond(res.id, 'refuse')}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
