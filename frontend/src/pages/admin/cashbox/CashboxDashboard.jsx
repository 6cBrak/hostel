import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getCashboxSummary, listCashMovements, createCashMovement, listExpenses,
} from '../../../api/cashbox'
import { formatFCFA } from '../../../lib/billingLabels'
import { CASH_MOVEMENT_TYPE_LABELS, CASH_MOVEMENT_TYPE_TONES } from '../../../lib/cashboxLabels'
import HorizontalBarChart from '../../../components/admin/charts/HorizontalBarChart'

export default function CashboxDashboard() {
  const [summary, setSummary] = useState(null)
  const [movements, setMovements] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      getCashboxSummary(),
      listCashMovements({ page_size: 20, ordering: '-date' }),
      listExpenses({ page_size: 500 }),
    ])
      .then(([summaryRes, movementsRes, expensesRes]) => {
        setSummary(summaryRes.data)
        setMovements(movementsRes.data.results ?? movementsRes.data)

        const byCategory = {}
        for (const expense of (expensesRes.data.results ?? expensesRes.data)) {
          const label = expense.category_name || 'Autre'
          byCategory[label] = (byCategory[label] || 0) + Number(expense.amount)
        }
        setExpensesByCategory(
          Object.entries(byCategory)
            .map(([label, amount]) => ({ label, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8)
        )
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const stats = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Solde de la caisse', value: formatFCFA(summary.balance), tone: 'text-brand-600' },
      { label: 'Total encaissé', value: formatFCFA(summary.total_in), tone: 'text-emerald-600' },
      { label: 'Total dépensé', value: formatFCFA(summary.total_out), tone: 'text-red-600' },
      { label: 'Mouvements enregistrés', value: summary.movements_count, tone: 'text-gray-900' },
    ]
  }, [summary])

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Caisse</h1>
      <p className="mt-1 text-gray-500">
        Solde global, alimenté automatiquement par les paiements encaissés et débité par les dépenses.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Historique des mouvements</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">Aucun mouvement.</td></tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">{m.date}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${CASH_MOVEMENT_TYPE_TONES[m.movement_type]}`}>
                          {CASH_MOVEMENT_TYPE_LABELS[m.movement_type] || m.movement_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{m.description || '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatFCFA(m.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {expensesByCategory.length > 0 && (
            <div className="mt-6">
              <HorizontalBarChart
                title="Dépenses par catégorie"
                data={expensesByCategory}
                series={[{ key: 'amount', label: 'Montant', color: '#dc2626' }]}
                valueFormatter={formatFCFA}
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <MovementForm onDone={load} />
        </div>
      </div>
    </div>
  )
}

function MovementForm({ onDone }) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    movement_type: 'deposit',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createCashMovement(form)
      toast.success('Mouvement enregistré.')
      setForm({ ...form, amount: '', description: '' })
      onDone()
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : "Erreur lors de l'enregistrement.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-900">Approvisionnement / Ajustement</h2>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Type
        <select
          value={form.movement_type}
          onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="deposit">Approvisionnement</option>
          <option value="adjustment">Ajustement manuel</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Montant (FCFA)
        <input
          type="number"
          step="1"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        {form.movement_type === 'adjustment' && (
          <span className="text-xs font-normal text-gray-400">
            Un ajustement peut être négatif (ex. -5000) pour corriger une erreur de saisie.
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Date
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Description (optionnel)
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-md bg-brand-900 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        Enregistrer le mouvement
      </button>
    </form>
  )
}
