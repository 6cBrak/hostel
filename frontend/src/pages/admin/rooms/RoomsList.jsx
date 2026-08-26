import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listRooms, listHostels, deleteRoom } from '../../../api/hostels'
import { ROOM_STATUS_LABELS, ROOM_STATUS_TONES } from '../../../lib/roomLabels'
import { useAdminList } from '../../../hooks/useAdminList'
import SearchInput from '../../../components/admin/SearchInput'
import Pagination from '../../../components/admin/Pagination'

export default function RoomsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hostelFilter = searchParams.get('hostel') || ''
  const [statusFilter, setStatusFilter] = useState('')
  const [hostels, setHostels] = useState([])

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
  }, [])

  const extraParams = {}
  if (hostelFilter) extraParams.hostel = hostelFilter
  if (statusFilter) extraParams.status = statusFilter

  const {
    items: rooms, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listRooms, extraParams, [hostelFilter, statusFilter])

  const handleDelete = async (room) => {
    if (!window.confirm(`Supprimer la chambre ${room.number} ?`)) return
    try {
      await deleteRoom(room.id)
      toast.success('Chambre supprimée.')
      reload()
    } catch {
      toast.error('Suppression impossible (réservations liées).')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chambres</h1>
          <p className="mt-1 text-gray-500">Gestion du parc de chambres.</p>
        </div>
        <Link
          to="/admin/chambres/nouvelle"
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nouvelle chambre
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un numéro de chambre…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Hostel</th>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Confort</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : rooms.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucune chambre.</td></tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{room.hostel_name}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{room.number}</td>
                  <td className="px-4 py-3">{room.room_type_name}</td>
                  <td className="px-4 py-3">{room.comfort_name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROOM_STATUS_TONES[room.status]}`}>
                      {ROOM_STATUS_LABELS[room.status] || room.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/chambres/${room.id}`} className="font-medium text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(room)}
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
