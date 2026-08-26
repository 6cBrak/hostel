import { Link, useSearchParams } from 'react-router-dom'
import { listInvoices } from '../../api/billing'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES, formatFCFA, formatBalance } from '../../lib/billingLabels'
import { useAdminList } from '../../hooks/useAdminList'
import SearchInput from '../../components/admin/SearchInput'
import Pagination from '../../components/admin/Pagination'

const TABS = [
  { value: '', label: 'Toutes' },
  { value: 'issued', label: 'Émises' },
  { value: 'paid', label: 'Soldées' },
]

export default function InvoicesQueue() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''

  const extraParams = {}
  if (status) extraParams.status = status

  const {
    items: invoices, count, loading, page, setPage, search, setSearch, pageSize, totalPages,
  } = useAdminList(listInvoices, extraParams, [status])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
      <p className="mt-1 text-gray-500">Suivi des factures pro-forma et des paiements.</p>

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
        <SearchInput value={search} onChange={setSearch} placeholder="N° facture, réservation, étudiant…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Facture</th>
              <th className="px-4 py-3">Étudiant</th>
              <th className="px-4 py-3">Réservation</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Payé</th>
              <th className="px-4 py-3 text-right">Solde</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Chargement…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Aucune facture.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.student_name}</td>
                  <td className="px-4 py-3">{inv.reservation_number}</td>
                  <td className="px-4 py-3 text-right">{formatFCFA(inv.total_amount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatFCFA(inv.amount_paid)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{formatBalance(inv.balance_due)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_TONES[inv.status]}`}>
                      {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/factures/${inv.id}`} className="font-medium text-brand-600 hover:underline">
                      Ouvrir →
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
