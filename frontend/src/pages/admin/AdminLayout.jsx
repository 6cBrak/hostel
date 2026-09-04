import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Tableau de bord' },
  { to: '/admin/reservations', label: 'Demandes de réservation' },
  { to: '/admin/locataires', label: 'Locataires' },
  { to: '/admin/transferts', label: 'Transferts' },
  { to: '/admin/factures', label: 'Factures' },
  { to: '/admin/hostels', label: 'Hostels' },
  { to: '/admin/chambres', label: 'Chambres' },
  { to: '/admin/tarifs', label: 'Tarifs' },
  { to: '/admin/referentiels', label: 'Référentiels' },
  { to: '/admin/residences-externes', label: 'Résidences externes' },
]

const FINANCE_ITEMS = [
  { to: '/admin/depenses', label: 'Dépenses' },
  { to: '/admin/caisse', label: 'Caisse' },
]

const ADMIN_ONLY_ITEMS = [
  { to: '/admin/parametres', label: "Informations de l'entreprise" },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
]

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium lg:whitespace-normal ${
          isActive ? 'bg-brand-900 text-white' : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function AdminLayout() {
  const { isAdmin, canManageFinance } = useAuth()

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 px-4 py-6 lg:flex-row lg:gap-6">
      <aside className="w-full min-w-0 lg:w-56 lg:shrink-0">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Administration
        </p>
        <nav className="mt-2 flex min-w-0 gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {canManageFinance && (
          <>
            <p className="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 lg:mt-5">
              Dépenses &amp; Caisse
            </p>
            <nav className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {FINANCE_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>
          </>
        )}

        {isAdmin && (
          <>
            <p className="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 lg:mt-5">
              Paramètres
            </p>
            <nav className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {ADMIN_ONLY_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>
          </>
        )}
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
