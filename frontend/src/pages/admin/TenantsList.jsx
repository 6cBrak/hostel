import { useSearchParams } from 'react-router-dom'
import { listTenants } from '../../api/reservations'
import { useAdminList } from '../../hooks/useAdminList'
import SearchInput from '../../components/admin/SearchInput'
import Pagination from '../../components/admin/Pagination'

function daysRemainingTone(days) {
  if (days == null) return 'bg-gray-100 text-gray-500'
  if (days <= 7) return 'bg-red-50 text-red-700'
  if (days <= 30) return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

function daysRemainingLabel(days) {
  if (days == null) return 'Durée non renseignée'
  if (days < 0) return `Terminé depuis ${Math.abs(days)} j`
  if (days === 0) return "Se termine aujourd'hui"
  return `${days} j restant${days > 1 ? 's' : ''}`
}

function whatsappHref(phone) {
  const digits = (phone || '').replace(/[^\d]/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

export default function TenantsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const ended = searchParams.get('ended') === 'true'

  const extraParams = { ended: ended ? 'true' : 'false' }
  const {
    items: tenants, count, loading, page, setPage, search, setSearch, pageSize, totalPages,
  } = useAdminList(listTenants, extraParams, [ended])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Locataires</h1>
      <p className="mt-1 text-gray-500">
        {ended
          ? 'Historique des séjours dont la date de fin est déjà passée.'
          : 'Étudiants actuellement logés — durée, fin de séjour et relance pour prolongation ou changement de chambre.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSearchParams({})}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !ended ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          En cours
        </button>
        <button
          onClick={() => setSearchParams({ ended: 'true' })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            ended ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Terminés
        </button>
      </div>

      <div className="mt-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un locataire…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Étudiant</th>
              <th className="px-4 py-3">Hostel</th>
              <th className="px-4 py-3">Chambre</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Fin de séjour</th>
              <th className="px-4 py-3">Jours restants</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {ended ? 'Aucun séjour terminé pour le moment.' : 'Aucun locataire actif pour le moment.'}
                </td>
              </tr>
            ) : (
              tenants.map((t) => {
                const wa = whatsappHref(t.requester_phone)
                return (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.requester_name}</td>
                    <td className="px-4 py-3">{t.hostel_name}</td>
                    <td className="px-4 py-3">{t.room_number || '—'}</td>
                    <td className="px-4 py-3">
                      {t.duration_months ? `${t.duration_months} mois` : '—'}
                    </td>
                    <td className="px-4 py-3">{t.desired_end_date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${daysRemainingTone(t.days_remaining)}`}>
                        {daysRemainingLabel(t.days_remaining)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand-600 hover:underline"
                        >
                          Relancer sur WhatsApp →
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Pas de téléphone</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onChange={setPage} />
    </div>
  )
}
