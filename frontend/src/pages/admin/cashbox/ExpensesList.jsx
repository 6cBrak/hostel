import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listExpenses, listExpenseCategories, deleteExpense } from '../../../api/cashbox'
import { listHostels } from '../../../api/hostels'
import { formatFCFA } from '../../../lib/billingLabels'
import { useAdminList } from '../../../hooks/useAdminList'
import SearchInput from '../../../components/admin/SearchInput'
import Pagination from '../../../components/admin/Pagination'

export default function ExpensesList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hostelFilter = searchParams.get('hostel') || ''
  const [categoryFilter, setCategoryFilter] = useState('')
  const [hostels, setHostels] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
    listExpenseCategories().then((r) => setCategories(r.data.results ?? r.data))
  }, [])

  const extraParams = { ordering: '-date' }
  if (hostelFilter) extraParams.hostel = hostelFilter
  if (categoryFilter) extraParams.category = categoryFilter

  const {
    items: expenses, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listExpenses, extraParams, [hostelFilter, categoryFilter])

  const handleDelete = async (expense) => {
    if (!window.confirm('Supprimer cette dépense ?')) return
    try {
      await deleteExpense(expense.id)
      toast.success('Dépense supprimée.')
      reload()
    } catch {
      toast.error('Suppression impossible.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="mt-1 text-gray-500">Dépenses par hostel, débitées de la caisse à l'enregistrement.</p>
        </div>
        <Link
          to="/admin/depenses/nouvelle"
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nouvelle dépense
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
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une dépense…" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Hostel</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucune dépense.</td></tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{expense.date}</td>
                  <td className="px-4 py-3">{expense.hostel_name}</td>
                  <td className="px-4 py-3">{expense.category_name}</td>
                  <td className="px-4 py-3 text-gray-600">{expense.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatFCFA(expense.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/depenses/${expense.id}`} className="font-medium text-brand-600 hover:underline">
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(expense)}
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
