import { Link, useSearchParams } from 'react-router-dom'
import { listReservations } from '../../api/reservations'
import { STATUS_LABELS, STATUS_TONES } from '../../lib/reservationStatus'
import { useAdminList } from '../../hooks/useAdminList'
import SearchInput from '../../components/admin/SearchInput'
import Pagination from '../../components/admin/Pagination'

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'alternative_proposed', label: 'Alternative proposée' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'rejected', label: 'Rejetées' },
]

export default function ReservationsQueue() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? 'pending'

  const extraParams = {}
  if (status) extraParams.status = status

  const {
    items: reservations, count, loading, page, setPage, search, setSearch, pageSize, totalPages,
  } = useAdminList(listReservations, extraParams, [status])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Demandes de réservation</h1>
      <p className="mt-1 text-gray-500">
        Traitez les demandes des étudiants : acceptation, rejet ou proposition d'une alternative.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSearchParams(tab.value ? { status: tab.value } : {})}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === tab.value ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Référence, étudiant, email…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Étudiant</th>
              <th className="px-4 py-3">Hostel</th>
              <th className="px-4 py-3">Arrivée souhaitée</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Aucune demande dans cette catégorie.
                </td>
              </tr>
            ) : (
              reservations.map((res) => (
                <tr key={res.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{res.reservation_number}</td>
                  <td className="px-4 py-3">{res.requester_name}</td>
                  <td className="px-4 py-3">{res.hostel_name}</td>
                  <td className="px-4 py-3">{res.desired_start_date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_TONES[res.status]}`}>
                      {STATUS_LABELS[res.status] || res.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/reservations/${res.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      Traiter →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onChange={setPage} />
    </div>
  )
}
