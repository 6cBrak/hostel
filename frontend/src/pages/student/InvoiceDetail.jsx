import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { listInvoices, getInvoice } from '../../api/billing'
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES,
  PAYMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS, formatFCFA, formatBalance,
} from '../../lib/billingLabels'

export default function InvoiceDetail() {
  const { reservationId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    listInvoices({ reservation: reservationId })
      .then((r) => {
        const results = r.data.results ?? r.data
        if (results.length === 0) {
          setNotFound(true)
          return null
        }
        return getInvoice(results[0].id)
      })
      .then((r) => {
        if (r) setInvoice(r.data)
      })
      .finally(() => setLoading(false))
  }, [reservationId])

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-12 text-gray-500">Chargement…</p>
  if (notFound || !invoice) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-gray-500">Aucune facture disponible pour cette réservation pour le moment.</p>
        <Link to="/espace/reservations" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          ← Retour à mes réservations
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/espace/reservations" className="text-sm text-brand-600 hover:underline">
        ← Retour à mes réservations
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
              Télécharger la facture (PDF)
            </a>
          )}
          <span className={`rounded px-2.5 py-1 text-sm font-medium ${INVOICE_STATUS_TONES[invoice.status]}`}>
            {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {invoice.hostel_name} — Chambre {invoice.room_number} · Réservation {invoice.reservation_number}
      </p>

      {/* Montants */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
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

      {/* Historique des paiements */}
      <h2 className="mt-8 text-lg font-semibold text-gray-900">Paiements enregistrés</h2>
      {invoice.payments.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Aucun paiement enregistré pour le moment.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Mode</th>
                <th className="px-4 py-2 text-right">Montant</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2">{p.date}</td>
                  <td className="px-4 py-2">{PAYMENT_TYPE_LABELS[p.payment_type] || p.payment_type}</td>
                  <td className="px-4 py-2">{PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatFCFA(p.amount)}</td>
                  <td className="px-4 py-2 text-right">
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

      {invoice.notes && (
        <p className="mt-4 text-sm text-gray-500">
          <strong>Note :</strong> {invoice.notes}
        </p>
      )}
    </div>
  )
}
