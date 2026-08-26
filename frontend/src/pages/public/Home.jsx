import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listHostels } from '../../api/hostels'
import SearchBar from '../../components/SearchBar'
import MapPanel from '../../components/MapPanel'

export default function Home() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listHostels()
      .then((r) => setHostels(r.data.results ?? r.data))
      .catch(() => setError("Impossible de charger les hostels pour l'instant."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 pb-24 pt-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Trouvez votre chambre dans l'un de nos 4 hostels
          </h1>
          <p className="mt-3 max-w-xl text-brand-50">
            Réservation en ligne simple et rapide pour les étudiants — consultez les
            disponibilités, choisissez votre confort et soumettez votre demande en quelques minutes.
          </p>
        </div>

        {/* Search bar */}
        <div className="mx-auto mt-8 max-w-5xl">
          <SearchBar hostels={hostels} />
        </div>
      </section>

      {/* HOSTELS GRID */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Nos hostels</h2>
        <p className="mt-1 text-gray-500">
          Quatre résidences, chacune avec ses propres chambres et niveaux de confort.
        </p>

        {loading && <p className="mt-8 text-gray-500">Chargement des hostels…</p>}
        {error && <p className="mt-8 text-red-600">{error}</p>}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hostels.map((hostel) => (
            <Link
              key={hostel.id}
              to={`/hostels/${hostel.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-4xl">
                🏨
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">
                  {hostel.name}
                </h3>
                {hostel.has_external_kitchen && (
                  <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Cuisine externe
                  </span>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{hostel.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{hostel.total_rooms} chambres</span>
                  <span className="font-medium text-emerald-600">
                    {hostel.available_rooms} disponibles
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MAP */}
      {hostels.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="text-2xl font-bold text-gray-900">Nos hostels sur la carte</h2>
          <p className="mt-1 text-gray-500">Localisation indicative des quatre résidences.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {hostels.map((hostel) => (
              <div key={hostel.id}>
                <p className="mb-1.5 text-sm font-semibold text-gray-800">{hostel.name}</p>
                <MapPanel hostel={hostel} height={160} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
