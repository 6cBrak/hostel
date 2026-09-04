import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getDashboardStats, downloadReport } from '../../api/dashboard'
import { formatFCFA, formatBalance } from '../../lib/billingLabels'
import { ROOM_STATUS_LABELS } from '../../lib/roomLabels'
import HorizontalBarChart from '../../components/admin/charts/HorizontalBarChart'

const REPORTS = [
  { key: 'rooms', label: 'Liste des chambres', hint: 'Toutes les chambres, statut et tarif' },
  { key: 'reservations', label: 'Liste des réservations', hint: 'Toutes les demandes, tous statuts' },
  { key: 'tenants', label: 'Liste des locataires', hint: 'Étudiants avec une réservation acceptée' },
  { key: 'revenue', label: 'Revenus par hostel', hint: 'Facturé / encaissé / impayés' },
  { key: 'transfers', label: 'Historique des transferts', hint: 'Chambre/hostel d’origine et de destination' },
]

// Palette catégorielle validée (voir skill dataviz) — ordre fixe, jamais réassigné par valeur.
// États administratifs uniquement (l'occupation par lit est affichée séparément).
const ROOM_STATUS_COLORS = {
  available: '#2a78d6', // slot 1 — blue
  maintenance: '#e87ba4', // slot 2 — magenta
  out_of_service: '#008300', // slot 3 — green
  blocked: '#4a3aa7', // slot 4 — violet
}
const OCCUPANCY_HUE = '#2a78d6' // sequential — 1 hue
const INVOICED_COLOR = '#2a78d6' // categorical slot 1
const COLLECTED_COLOR = '#eb6834' // categorical slot 2 (validated all-pairs with slot 1)

function KpiCard({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-gray-900',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (key) => {
    setDownloading(key)
    try {
      await downloadReport(key)
    } catch {
      toast.error('Erreur lors du téléchargement du rapport.')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (!stats) return <p className="text-gray-500">Impossible de charger le tableau de bord.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <p className="mt-1 text-gray-500">Vue d'ensemble de l'activité de SMART HOSTEL ATOMA.</p>

      {/* Parc de chambres — l'occupation se compte désormais par lit, pas par chambre entière */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Parc de chambres</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Hostels" value={stats.total_hostels} />
        <KpiCard label="Chambres" value={stats.total_rooms} />
        <KpiCard label="Lits au total" value={stats.total_beds} />
        <KpiCard label="Lits occupés" value={stats.beds_taken} tone="amber" />
        <KpiCard label="Lits libres" value={stats.beds_available} tone="emerald" />
        <KpiCard label="Taux d'occupation" value={`${stats.occupancy_rate}%`} />
      </div>

      {/* Réservations */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Réservations</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="En attente" value={stats.pending_reservations} tone="amber" />
        <KpiCard label="Confirmées" value={stats.confirmed_reservations} tone="emerald" />
        <KpiCard label="Rejetées" value={stats.rejected_reservations} tone="red" />
        <KpiCard label="Locataires actifs" value={stats.total_tenants} />
      </div>

      {/* Finances */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Finances</h2>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Montant facturé" value={formatFCFA(stats.invoiced_amount)} />
        <KpiCard label="Montant encaissé" value={formatFCFA(stats.collected_amount)} tone="emerald" />
        <KpiCard label="Restant à recouvrer" value={formatBalance(stats.outstanding_amount)} tone="amber" />
      </div>

      {/* Graphiques */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Graphiques</h2>
      <div className="mt-2">
        <HorizontalBarChart
          title="Répartition des chambres par statut"
          hint={`${stats.total_rooms} chambres au total`}
          data={Object.entries(stats.rooms_by_status)
            .map(([key, value]) => ({ label: ROOM_STATUS_LABELS[key] || key, value, statusKey: key }))
            .sort((a, b) => b.value - a.value)}
          series={[{ key: 'value', label: 'Chambres' }]}
          getColor={(row) => ROOM_STATUS_COLORS[row.statusKey]}
          valueFormatter={(v) => `${v}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HorizontalBarChart
          title="Taux d'occupation par hostel"
          data={stats.by_hostel.map((h) => ({ label: h.hostel_name, value: h.occupancy_rate }))}
          series={[{ key: 'value', label: "Taux d'occupation", color: OCCUPANCY_HUE }]}
          valueFormatter={(v) => `${v}%`}
        />
        <HorizontalBarChart
          title="Facturé vs encaissé par hostel"
          data={stats.by_hostel.map((h) => ({ label: h.hostel_name, invoiced: h.invoiced, collected: h.revenue }))}
          series={[
            { key: 'invoiced', label: 'Facturé', color: INVOICED_COLOR },
            { key: 'collected', label: 'Encaissé', color: COLLECTED_COLOR },
          ]}
          valueFormatter={(v) => formatFCFA(v)}
        />
      </div>

      {/* Par hostel */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Par hostel</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2">Hostel</th>
              <th className="px-4 py-2 text-right">Chambres</th>
              <th className="px-4 py-2 text-right">Lits</th>
              <th className="px-4 py-2 text-right">Lits occupés</th>
              <th className="px-4 py-2 text-right">Taux d'occupation</th>
              <th className="px-4 py-2 text-right">Revenus encaissés</th>
            </tr>
          </thead>
          <tbody>
            {stats.by_hostel.map((h) => (
              <tr key={h.hostel_id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 font-medium text-gray-900">{h.hostel_name}</td>
                <td className="px-4 py-2 text-right">{h.total_rooms}</td>
                <td className="px-4 py-2 text-right">{h.total_beds}</td>
                <td className="px-4 py-2 text-right">{h.beds_taken}</td>
                <td className="px-4 py-2 text-right">{h.occupancy_rate}%</td>
                <td className="px-4 py-2 text-right">{formatFCFA(h.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rapports */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Rapports (Excel)</h2>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <div key={r.key} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <p className="font-medium text-gray-900">{r.label}</p>
              <p className="text-xs text-gray-500">{r.hint}</p>
            </div>
            <button
              onClick={() => handleDownload(r.key)}
              disabled={downloading === r.key}
              className="rounded-md bg-brand-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {downloading === r.key ? '…' : 'Exporter'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
