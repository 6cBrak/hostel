import { Link } from 'react-router-dom'
import { listTransfers } from '../../api/reservations'
import { useAdminList } from '../../hooks/useAdminList'
import SearchInput from '../../components/admin/SearchInput'
import Pagination from '../../components/admin/Pagination'

export default function TransfersHistory() {
  const {
    items: transfers, count, loading, page, setPage, search, setSearch, pageSize, totalPages,
  } = useAdminList(listTransfers)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Transferts</h1>
      <p className="mt-1 text-gray-500">
        Historique des locataires transférés vers une autre chambre ou un autre hostel.
      </p>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un locataire ou une référence…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Étudiant</th>
              <th className="px-4 py-3">Depuis</th>
              <th className="px-4 py-3">Vers</th>
              <th className="px-4 py-3">Effectué par</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucun transfert pour le moment.</td></tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.student_name}</td>
                  <td className="px-4 py-3">
                    {t.previous_hostel_name} — Chambre {t.previous_room_number || '—'}
                    <div className="text-xs text-gray-400">{t.previous_reservation_number}</div>
                  </td>
                  <td className="px-4 py-3">
                    {t.hostel_name} — Chambre {t.room_number || '—'}
                    <div className="text-xs text-gray-400">{t.reservation_number}</div>
                  </td>
                  <td className="px-4 py-3">{t.handled_by_name || '—'}</td>
                  <td className="px-4 py-3">
                    {t.decided_at ? new Date(t.decided_at).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/reservations/${t.id}`} className="font-medium text-brand-600 hover:underline">
                      Voir →
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
