import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { listRooms, listHostels, listRoomTypes, listComfortOptions } from '../../api/hostels'
import SearchBar from '../../components/SearchBar'
import RoomFilterResults from '../../components/RoomFilterResults'

export default function RoomsCatalog() {
  const [searchParams] = useSearchParams()
  const hostelFilter = searchParams.get('hostel') || ''
  const startDate = searchParams.get('start_date') || ''
  const people = searchParams.get('people') || ''

  const [rooms, setRooms] = useState([])
  const [hostels, setHostels] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [comforts, setComforts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listHostels().then((r) => setHostels(r.data.results ?? r.data))
    listRoomTypes().then((r) => setRoomTypes(r.data.results ?? r.data))
    listComfortOptions().then((r) => setComforts(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { status: 'available', page_size: 100 }
    if (hostelFilter) params.hostel = hostelFilter
    listRooms(params)
      .then((r) => setRooms(r.data.results ?? r.data))
      .finally(() => setLoading(false))
  }, [hostelFilter])

  const currentHostel = hostels.find((h) => String(h.id) === hostelFilter)

  const peopleCount = Number(people) || 0
  const visibleRooms = useMemo(() => {
    // Une chambre "disponible" administrativement peut n'avoir aucun lit
    // libre (déjà occupée par d'autres locataires) — on ne la propose pas.
    const withFreeBeds = rooms.filter((r) => r.beds_available > 0)
    if (!peopleCount || peopleCount <= 1) return withFreeBeds
    return withFreeBeds.filter((r) => r.beds_available >= peopleCount)
  }, [rooms, peopleCount])

  return (
    <div>
      {/* Sticky compact search bar */}
      <div className="sticky top-[52px] z-30 border-b border-gray-200 bg-brand-900 py-3 shadow-sm">
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar
            compact
            hostels={hostels}
            initial={{ hostel: hostelFilter, start_date: startDate, people: people || 1 }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
          <Link to="/" className="hover:underline">
            Accueil
          </Link>
          <span>›</span>
          {currentHostel ? (
            <>
              <Link to={`/hostels/${currentHostel.id}`} className="hover:underline">
                {currentHostel.name}
              </Link>
              <span>›</span>
              <span className="text-gray-700">Résultats de recherche</span>
            </>
          ) : (
            <span className="text-gray-700">Résultats de recherche</span>
          )}
        </nav>

        {peopleCount > 1 && (
          <p className="mt-2 text-sm text-gray-500">
            Chambres pouvant accueillir au moins {peopleCount} personne{peopleCount > 1 ? 's' : ''}.
          </p>
        )}

        <div className="mt-2">
          <RoomFilterResults
            rooms={visibleRooms}
            roomTypes={roomTypes}
            comforts={comforts}
            loading={loading}
            resultLabel={currentHostel ? currentHostel.name : 'Tous les hostels'}
            mapHostel={currentHostel}
          />
        </div>
      </div>
    </div>
  )
}
