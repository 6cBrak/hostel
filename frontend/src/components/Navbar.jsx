import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSiteSettings } from '../context/SiteSettingsContext'

export default function Navbar() {
  const { user, isAuthenticated, isStudent, isStaff, signOut } = useAuth()
  const navigate = useNavigate()
  const { settings } = useSiteSettings()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = () => {
    setMenuOpen(false)
    signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-brand-900 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          {settings?.logo ? (
            <img src={settings.logo} alt={settings.site_name} className="h-9 w-auto" />
          ) : (
            <span>
              SMART HOSTEL <span className="text-brand-100">ATOMA</span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          <Link to="/" className="hover:text-brand-100">
            Hostels
          </Link>
          {isAuthenticated ? (
            <>
              {isStudent && (
                <Link to="/espace/reservations" className="hover:text-brand-100">
                  Mes réservations
                </Link>
              )}
              {isStaff && (
                <Link to="/admin/dashboard" className="hover:text-brand-100">
                  Administration
                </Link>
              )}
              <Link to="/espace/profil" className="text-brand-100 hover:text-white hover:underline">
                {user.full_name}
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="hover:text-brand-100">
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="rounded-md bg-white px-3 py-1.5 font-semibold text-brand-600 hover:bg-brand-50"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 md:hidden"
        >
          <span className="sr-only">Menu</span>
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 text-sm font-medium md:hidden">
          <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-white/10">
            Hostels
          </Link>
          {isAuthenticated ? (
            <>
              {isStudent && (
                <Link
                  to="/espace/reservations"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2 hover:bg-white/10"
                >
                  Mes réservations
                </Link>
              )}
              {isStaff && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2 hover:bg-white/10"
                >
                  Administration
                </Link>
              )}
              <Link
                to="/espace/profil"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 text-brand-100 hover:bg-white/10"
              >
                {user.full_name}
              </Link>
              <button
                onClick={handleSignOut}
                className="mt-1 rounded-md bg-white/10 px-2 py-2 text-left hover:bg-white/20"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/connexion"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2 hover:bg-white/10"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-md bg-white px-2 py-2 text-center font-semibold text-brand-600 hover:bg-brand-50"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
