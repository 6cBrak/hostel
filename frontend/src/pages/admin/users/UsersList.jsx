import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listUsers, deactivateUser } from '../../../api/users'
import { useAuth } from '../../../context/AuthContext'
import { ALL_ROLE_LABELS } from '../../../lib/userRoles'
import { useAdminList } from '../../../hooks/useAdminList'
import SearchInput from '../../../components/admin/SearchInput'
import Pagination from '../../../components/admin/Pagination'

export default function UsersList() {
  const { user: currentUser } = useAuth()
  const {
    items: users, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listUsers)

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Désactiver le compte de "${u.full_name}" ?`)) return
    try {
      await deactivateUser(u.id)
      toast.success('Compte désactivé.')
      reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action impossible.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="mt-1 text-gray-500">Comptes du personnel interne.</p>
        </div>
        <Link
          to="/admin/utilisateurs/nouveau"
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nouvel utilisateur
        </Link>
      </div>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucun utilisateur.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">{ALL_ROLE_LABELS[u.role] || u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/utilisateurs/${u.id}`} className="font-medium text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    {u.id !== currentUser?.id && u.is_active && (
                      <button
                        onClick={() => handleDeactivate(u)}
                        className="ml-3 font-medium text-red-600 hover:underline"
                      >
                        Désactiver
                      </button>
                    )}
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
