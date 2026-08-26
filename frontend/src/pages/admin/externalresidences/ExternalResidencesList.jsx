import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listExternalResidences, deleteExternalResidence } from '../../../api/externalResidences'
import { useAdminList } from '../../../hooks/useAdminList'
import SearchInput from '../../../components/admin/SearchInput'
import Pagination from '../../../components/admin/Pagination'

export default function ExternalResidencesList() {
  const {
    items, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listExternalResidences)

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer "${item.name}" ?`)) return
    try {
      await deleteExternalResidence(item.id)
      toast.success('Résidence externe supprimée.')
      reload()
    } catch {
      toast.error('Suppression impossible.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résidences externes</h1>
          <p className="mt-1 text-gray-500">
            Partenaires proposés en alternative quand aucune chambre interne n'est disponible.
          </p>
        </div>
        <Link
          to="/admin/residences-externes/nouvelle"
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nouvelle résidence
        </Link>
      </div>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une résidence…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">Chambres</th>
              <th className="px-4 py-3">Disponibilité</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucune résidence externe.</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-right">{r.number_of_rooms}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        r.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.is_available ? 'Disponible' : 'Indisponible'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/residences-externes/${r.id}`} className="font-medium text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(r)}
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
