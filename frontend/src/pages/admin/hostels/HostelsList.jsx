import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listHostels, deleteHostel } from '../../../api/hostels'
import { useAdminList } from '../../../hooks/useAdminList'
import SearchInput from '../../../components/admin/SearchInput'
import Pagination from '../../../components/admin/Pagination'

export default function HostelsList() {
  const {
    items: hostels, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listHostels)

  const handleDelete = async (hostel) => {
    if (!window.confirm(`Supprimer "${hostel.name}" ? Cette action est irréversible.`)) return
    try {
      await deleteHostel(hostel.id)
      toast.success('Hostel supprimé.')
      reload()
    } catch {
      toast.error('Suppression impossible (des chambres ou réservations y sont peut-être liées).')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostels</h1>
          <p className="mt-1 text-gray-500">Gestion des résidences.</p>
        </div>
        <Link
          to="/admin/hostels/nouveau"
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nouveau hostel
        </Link>
      </div>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un hostel…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3 text-right">Chambres</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : hostels.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucun hostel.</td></tr>
            ) : (
              hostels.map((h) => (
                <tr key={h.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                  <td className="px-4 py-3 text-gray-500">{h.address || '—'}</td>
                  <td className="px-4 py-3 text-right">{h.total_rooms}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        h.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {h.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/hostels/${h.id}`} className="font-medium text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(h)}
                      className="ml-3 font-medium text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
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
