export const INVOICE_STATUS_LABELS = {
  issued: 'Émise',
  paid: 'Soldée',
  cancelled: 'Annulée',
}

export const INVOICE_STATUS_TONES = {
  issued: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export const PAYMENT_TYPE_LABELS = {
  deposit: 'Acompte',
  second_installment: 'Deuxième tranche',
  balance: 'Solde',
  other: 'Autre',
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Espèces',
  bank_transfer: 'Virement bancaire',
  mobile_money: 'Mobile money',
  online: 'Paiement en ligne',
  other: 'Autre',
}

export const formatFCFA = (value) =>
  value == null ? '—' : `${Number(value).toLocaleString('fr-FR')} FCFA`

export const formatBalance = (value) => {
  const n = Number(value)
  if (n < 0) return `Trop-perçu : ${formatFCFA(Math.abs(n))}`
  if (n === 0) return 'Soldé'
  return formatFCFA(n)
}
