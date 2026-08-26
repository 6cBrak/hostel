import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MapPanel from './MapPanel'
import BookingBadges from './BookingBadges'

const HISTOGRAM_BUCKETS = 10

const SORTS = {
  relevance: { label: 'Nos préférés', fn: () => 0 },
  price_asc: { label: 'Prix (croissant)', fn: (a, b) => (a.monthly_rate ?? 0) - (b.monthly_rate ?? 0) },
  price_desc: { label: 'Prix (décroissant)', fn: (a, b) => (b.monthly_rate ?? 0) - (a.monthly_rate ?? 0) },
  capacity: { label: 'Capacité', fn: (a, b) => a.capacity - b.capacity },
}

/**
 * Bloc filtres + tri + liste de résultats, partagé entre la page de résultats
 * de recherche et la fiche hostel (même comportement, cf. Booking.com).
 */
export default function RoomFilterResults({ rooms, roomTypes, comforts, loading, resultLabel, mapHostel }) {
  const [sortBy, setSortBy] = useState('relevance')
  const [view, setView] = useState('list')
  const [priceMax, setPriceMax] = useState(null)
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedComforts, setSelectedComforts] = useState([])

  const maxPossiblePrice = useMemo(
    () => Math.max(0, ...rooms.map((r) => Number(r.monthly_rate) || 0), 1),
    [rooms]
  )

  const filteredRooms = useMemo(() => {
    let list = rooms.filter((room) => {
      const price = Number(room.monthly_rate) || 0
      if (priceMax != null && price > priceMax) return false
      if (selectedTypes.length && !selectedTypes.includes(room.room_type)) return false
      if (selectedComforts.length && !selectedComforts.includes(room.comfort)) return false
      return true
    })
    list = [...list].sort(SORTS[sortBy].fn)
    return list
  }, [rooms, priceMax, selectedTypes, selectedComforts, sortBy])

  const toggleFilter = (setFn, value) => {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  // Compte de résultats par filtre — calculé sur les chambres déjà filtrées par budget,
  // à l'exclusion de la propre catégorie du filtre (comme sur Booking).
  const roomsWithinBudget = useMemo(
    () => rooms.filter((r) => (Number(r.monthly_rate) || 0) <= (priceMax ?? maxPossiblePrice)),
    [rooms, priceMax, maxPossiblePrice]
  )
  const typeCounts = useMemo(() => {
    const counts = {}
    roomsWithinBudget.forEach((r) => {
      if (selectedComforts.length && !selectedComforts.includes(r.comfort)) return
      counts[r.room_type] = (counts[r.room_type] || 0) + 1
    })
    return counts
  }, [roomsWithinBudget, selectedComforts])
  const comfortCounts = useMemo(() => {
    const counts = {}
    roomsWithinBudget.forEach((r) => {
      if (selectedTypes.length && !selectedTypes.includes(r.room_type)) return
      counts[r.comfort] = (counts[r.comfort] || 0) + 1
    })
    return counts
  }, [roomsWithinBudget, selectedTypes])

  // Histogramme de la répartition des tarifs
  const histogram = useMemo(() => {
    const bucketSize = maxPossiblePrice / HISTOGRAM_BUCKETS || 1
    const buckets = Array(HISTOGRAM_BUCKETS).fill(0)
    rooms.forEach((r) => {
      const price = Number(r.monthly_rate) || 0
      const idx = Math.min(HISTOGRAM_BUCKETS - 1, Math.floor(price / bucketSize))
      buckets[idx] += 1
    })
    return buckets
  }, [rooms, maxPossiblePrice])
  const histogramMax = Math.max(1, ...histogram)

  return (
    <div>
      {/* Heading + sort + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {resultLabel} : {loading ? '…' : filteredRooms.length} chambre{filteredRooms.length > 1 ? 's' : ''} trouvée
          {filteredRooms.length > 1 ? 's' : ''}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-w-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                Trier par : {label}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-gray-300 text-sm">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-l-md ${
                view === 'list' ? 'bg-brand-900 text-white' : 'bg-white text-gray-600'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 rounded-r-md ${
                view === 'grid' ? 'bg-brand-900 text-white' : 'bg-white text-gray-600'
              }`}
            >
              Mosaïque
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:sticky lg:top-[130px] lg:w-64">
          {mapHostel ? (
            <MapPanel hostel={mapHostel} height={160} />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
              Choisissez un hostel pour voir sa localisation sur la carte.
            </div>
          )}

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">Votre budget (par mois)</h3>
            <p className="mt-1 text-xs text-gray-500">
              De 0 à {Number(priceMax ?? maxPossiblePrice).toLocaleString('fr-FR')}+ FCFA
            </p>

            <div className="mt-3 flex h-10 items-end gap-0.5">
              {histogram.map((count, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-brand-200"
                  style={{ height: `${Math.max(6, (count / histogramMax) * 100)}%` }}
                />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max={maxPossiblePrice}
              value={priceMax ?? maxPossiblePrice}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">Type de chambre</h3>
            <div className="mt-2 flex flex-col gap-2">
              {roomTypes.map((rt) => (
                <label key={rt.id} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(rt.id)}
                      onChange={() => toggleFilter(setSelectedTypes, rt.id)}
                    />
                    {rt.name} ({rt.capacity} pers.)
                  </span>
                  <span className="text-xs text-gray-400">({typeCounts[rt.id] || 0})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">Confort</h3>
            <div className="mt-2 flex flex-col gap-2">
              {comforts.map((c) => (
                <label key={c.id} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedComforts.includes(c.id)}
                      onChange={() => toggleFilter(setSelectedComforts, c.id)}
                    />
                    {c.name}
                  </span>
                  <span className="text-xs text-gray-400">({comfortCounts[c.id] || 0})</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="text-gray-500">Chargement…</p>
          ) : filteredRooms.length === 0 ? (
            <p className="text-gray-500">Aucune chambre ne correspond à ces critères.</p>
          ) : view === 'list' ? (
            <div className="flex flex-col gap-4">
              {filteredRooms.map((room) => (
                <RoomListCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredRooms.map((room) => (
                <RoomGridCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RoomListCard({ room }) {
  return (
    <Link
      to={`/chambres/${room.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md sm:flex-row"
    >
      {room.photos?.[0] ? (
        <img
          src={room.photos[0].url}
          alt={`Chambre ${room.number}`}
          className="h-40 w-full object-cover sm:h-auto sm:w-64 sm:shrink-0"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-4xl sm:h-auto sm:w-64 sm:shrink-0">
          🛏️
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:flex-row">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{room.hostel_name}</p>
          <h3 className="mt-0.5 text-lg font-semibold text-gray-900">Chambre {room.number}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {room.room_type_name} · {room.comfort_name} · {room.capacity} pers.
          </p>
          <span className="mt-2 inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Disponible
          </span>
          <BookingBadges room={room} className="mt-2" />
        </div>
        <div className="flex shrink-0 flex-col items-start justify-between gap-2 sm:items-end sm:text-right">
          {room.monthly_rate != null && (
            <p className="text-lg font-bold text-brand-600">
              {Number(room.monthly_rate).toLocaleString('fr-FR')} FCFA
              <span className="block text-xs font-normal text-gray-400">par mois</span>
            </p>
          )}
          <span className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
            Voir la chambre
          </span>
        </div>
      </div>
    </Link>
  )
}

function RoomGridCard({ room }) {
  return (
    <Link
      to={`/chambres/${room.id}`}
      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {room.photos?.[0] ? (
        <img src={room.photos[0].url} alt={`Chambre ${room.number}`} className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-3xl">
          🛏️
        </div>
      )}
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{room.hostel_name}</p>
        <p className="mt-1 font-semibold text-gray-900">Chambre {room.number}</p>
        <p className="mt-1 text-sm text-gray-500">
          {room.room_type_name} · {room.comfort_name} · {room.capacity} pers.
        </p>
        {room.monthly_rate != null && (
          <p className="mt-2 font-semibold text-brand-600">
            {Number(room.monthly_rate).toLocaleString('fr-FR')} FCFA / mois
          </p>
        )}
        <BookingBadges room={room} className="mt-2" />
      </div>
    </Link>
  )
}
