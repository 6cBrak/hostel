import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getExpense, createExpense, updateExpense, listExpenseCategories } from '../../../api/cashbox'
import { listHostels } from '../../../api/hostels'

const EMPTY = {
  hostel: '',
  category: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

export default function ExpenseForm() {
  const { id } = useParams()
  const isNew = id === 'nouvelle'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [receiptFile, setReceiptFile] = useState(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null)
  const [hostels, setHostels] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
    listExpenseCategories().then((r) => setCategories(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    if (isNew) return
    getExpense(id).then((r) => {
      const expense = r.data
      setForm({
        hostel: expense.hostel,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        description: expense.description || '',
      })
      setExistingReceiptUrl(expense.receipt_file || null)
    }).finally(() => setLoading(false))
  }, [id, isNew])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let payload
      if (receiptFile) {
        payload = new FormData()
        Object.entries(form).forEach(([key, value]) => payload.append(key, value))
        payload.append('receipt_file', receiptFile)
      } else {
        payload = { ...form }
      }
      if (isNew) {
        await createExpense(payload)
        toast.success('Dépense enregistrée.')
      } else {
        await updateExpense(id, payload)
        toast.success('Dépense mise à jour.')
      }
      navigate('/admin/depenses')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div className="max-w-xl">
      <Link to="/admin/depenses" className="text-sm text-brand-600 hover:underline">
        ← Retour aux dépenses
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        {isNew ? 'Nouvelle dépense' : 'Modifier la dépense'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Hostel
            <select
              required
              value={form.hostel}
              onChange={(e) => setForm({ ...form, hostel: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sélectionner —</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Catégorie
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Sélectionner —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
        {categories.length === 0 && (
          <p className="text-xs text-gray-400">
            Aucune catégorie définie — ajoutez-en dans « Référentiels ».
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Montant (FCFA)
            <input
              type="number"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
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
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Description (optionnel)
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <div>
          <p className="text-sm font-medium text-gray-700">Justificatif (optionnel)</p>
          {existingReceiptUrl && !receiptFile && (
            <a
              href={existingReceiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-brand-600 hover:underline"
            >
              Voir le justificatif actuel
            </a>
          )}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="mt-2 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-md bg-brand-900 px-5 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
