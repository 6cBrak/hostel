import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listPrices, listHostels, deletePrice } from '../../../api/hostels'
import { formatFCFA } from '../../../lib/billingLabels'
import { useAdminList } from '../../../hooks/useAdminList'
import SearchInput from '../../../components/admin/SearchInput'
import Pagination from '../../../components/admin/Pagination'

export default function PricesList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hostelFilter = searchParams.get('hostel') || ''
  const [hostels, setHostels] = useState([])

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
  }, [])

  const extraParams = {}
  if (hostelFilter) extraParams.hostel = hostelFilter

  const {
    items: prices, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listPrices, extraParams, [hostelFilter])

  const handleDelete = async (price) => {
    if (!window.confirm('Supprimer ce tarif ?')) return
    try {
      await deletePrice(price.id)
      toast.success('Tarif supprimé.')
      reload()
    } catch {
      toast.error('Suppression impossible.')
    }
  }

  const hostelName = (id) => hostels.find((h) => h.id === Number(id))?.name

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifs</h1>
          <p className="mt-1 text-gray-500">Grille tarifaire par hostel, type de chambre et confort.</p>
        </div>
        <Link
          to="/admin/tarifs/nouveau"
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nouveau tarif
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSearchParams({})}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !hostelFilter ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Tous les hostels
        </button>
        {hostels.map((h) => (
          <button
            key={h.id}
            onClick={() => setSearchParams({ hostel: h.id })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              hostelFilter === String(h.id) ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {h.name}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher (hostel, type, confort)…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Hostel</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Confort</th>
              <th className="px-4 py-3 text-right">Tarif mensuel</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : prices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucun tarif.</td></tr>
            ) : (
              prices.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{hostelName(p.hostel) || p.hostel}</td>
                  <td className="px-4 py-3">{p.room_type_name}</td>
                  <td className="px-4 py-3">{p.comfort_name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatFCFA(p.monthly_rate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/tarifs/${p.id}`} className="font-medium text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
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
