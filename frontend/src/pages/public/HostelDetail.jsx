import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getHostel, listRooms, listRoomTypes, listComfortOptions } from '../../api/hostels'
import RoomFilterResults from '../../components/RoomFilterResults'

export default function HostelDetail() {
  const { id } = useParams()
  const [hostel, setHostel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [comforts, setComforts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listRoomTypes().then((r) => setRoomTypes(r.data.results ?? r.data))
    listComfortOptions().then((r) => setComforts(r.data.results ?? r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([getHostel(id), listRooms({ hostel: id, status: 'available', page_size: 100 })])
      .then(([hostelRes, roomsRes]) => {
        setHostel(hostelRes.data)
        const allRooms = roomsRes.data.results ?? roomsRes.data
        // Une chambre "disponible" administrativement peut n'avoir aucun lit
        // libre (déjà occupée par d'autres locataires) — on ne la propose pas.
        setRooms(allRooms.filter((r) => r.beds_available > 0))
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="mx-auto max-w-6xl px-4 py-12 text-gray-500">Chargement…</p>
  if (!hostel) return <p className="mx-auto max-w-6xl px-4 py-12 text-gray-500">Hostel introuvable.</p>

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← Retour aux hostels
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">{hostel.name}</h1>
      <p className="mt-1 text-gray-500">{hostel.address || `${hostel.name}, Ghana`}</p>
      {hostel.has_external_kitchen && (
        <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          Cuisine externe
        </span>
      )}
      <p className="mt-4 max-w-2xl text-gray-600">{hostel.description}</p>

      <div className="mt-8">
        <RoomFilterResults
          rooms={rooms}
          roomTypes={roomTypes}
          comforts={comforts}
          loading={loading}
          resultLabel={hostel.name}
          mapHostel={hostel}
        />
      </div>
    </div>
  )
}
