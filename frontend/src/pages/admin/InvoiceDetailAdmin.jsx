import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getInvoice, createPayment } from '../../api/billing'
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES,
  PAYMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS, formatFCFA, formatBalance,
} from '../../lib/billingLabels'

export default function InvoiceDetailAdmin() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getInvoice(id)
      .then((r) => setInvoice(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (!invoice) return <p className="text-gray-500">Facture introuvable.</p>

  return (
    <div>
      <Link to="/admin/factures" className="text-sm text-brand-600 hover:underline">
        ← Retour aux factures
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Facture {invoice.invoice_number}</h1>
        <div className="flex items-center gap-3">
          {invoice.pdf_file && (
            <a
              href={invoice.pdf_file}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Télécharger (PDF)
            </a>
          )}
          <span className={`rounded px-2.5 py-1 text-sm font-medium ${INVOICE_STATUS_TONES[invoice.status]}`}>
            {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {invoice.student_name} · {invoice.hostel_name} — Chambre {invoice.room_number} · {invoice.reservation_number}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Montants + historique */}
        <div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Montant du séjour</dt>
                <dd className="font-medium text-gray-900">{formatFCFA(invoice.stay_amount)}</dd>
              </div>
              {Number(invoice.additional_fees) > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Frais supplémentaires</dt>
                  <dd className="font-medium text-gray-900">{formatFCFA(invoice.additional_fees)}</dd>
                </div>
              )}
              {invoice.deposit_amount != null && Number(invoice.deposit_amount) > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Caution</dt>
                  <dd className="font-medium text-gray-900">{formatFCFA(invoice.deposit_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-gray-200 pt-2">
                <dt className="font-semibold text-gray-900">Montant total</dt>
                <dd className="font-semibold text-gray-900">{formatFCFA(invoice.total_amount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Montant payé</dt>
                <dd className="font-medium text-emerald-600">{formatFCFA(invoice.amount_paid)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Solde restant</dt>
                <dd className={`font-semibold ${Number(invoice.balance_due) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatBalance(invoice.balance_due)}
                </dd>
              </div>
            </dl>
          </div>

          <h2 className="mt-6 text-base font-semibold text-gray-900">Paiements enregistrés</h2>
          {invoice.payments.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Aucun paiement enregistré pour le moment.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">{p.date}</td>
                      <td className="px-3 py-2">{PAYMENT_TYPE_LABELS[p.payment_type] || p.payment_type}</td>
                      <td className="px-3 py-2">{PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatFCFA(p.amount)}</td>
                      <td className="px-3 py-2 text-right">
                        {p.receipt?.pdf_file && (
                          <a
                            href={p.receipt.pdf_file}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-brand-600 hover:underline"
                          >
                            Reçu
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulaire d'enregistrement de paiement */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          {invoice.status === 'paid' || Number(invoice.balance_due) <= 0 ? (
            <p className="text-sm text-gray-500">Cette facture est intégralement soldée.</p>
          ) : (
            <PaymentForm invoiceId={invoice.id} balanceDue={invoice.balance_due} onDone={load} />
          )}
        </div>
      </div>
    </div>
  )
}

function PaymentForm({ invoiceId, balanceDue, onDone }) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_type: 'deposit',
    payment_method: 'cash',
    reference: '',
    observation: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createPayment({ ...form, invoice: invoiceId })
      toast.success('Paiement enregistré.')
      setForm({ ...form, amount: '', reference: '', observation: '' })
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
      <h2 className="font-semibold text-gray-900">Enregistrer un paiement</h2>
      <p className="text-xs text-gray-500">Solde restant : {formatFCFA(balanceDue)}</p>

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
        Montant (FCFA)
        <input
          type="number"
          min="1"
          step="1"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Type de paiement
        <select
          value={form.payment_type}
          onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Mode de paiement
        <select
          value={form.payment_method}
          onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Référence (optionnel)
        <input
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        Observation (optionnel)
        <textarea
          rows={2}
          value={form.observation}
          onChange={(e) => setForm({ ...form, observation: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Enregistrer le paiement
      </button>
    </form>
  )
}
