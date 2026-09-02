import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRoom, getHostel } from '../../api/hostels'
import BookingBadges from '../../components/BookingBadges'
import MapPanel from '../../components/MapPanel'

const STATUS_LABELS = {
  available: 'Disponible',
  maintenance: 'En maintenance',
  out_of_service: 'Hors service',
  blocked: 'Bloquée temporairement',
}

export default function RoomDetail() {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [hostel, setHostel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    setLoading(true)
    getRoom(id)
      .then((r) => {
        setRoom(r.data)
        return getHostel(r.data.hostel)
      })
      .then((r) => setHostel(r.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="mx-auto max-w-5xl px-4 py-12 text-gray-500">Chargement…</p>
  if (!room) return <p className="mx-auto max-w-5xl px-4 py-12 text-gray-500">Chambre introuvable.</p>

  // Louable seulement si administrativement disponible ET qu'il reste au moins un lit libre.
  const isAvailable = room.status === 'available' && room.beds_available > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <Link to="/" className="hover:underline">
          Accueil
        </Link>
        <span>›</span>
        <Link to={`/hostels/${room.hostel}`} className="hover:underline">
          {room.hostel_name}
        </Link>
        <span>›</span>
        <span className="text-gray-700">Chambre {room.number}</span>
      </nav>

      <div className="mt-3 flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          {room.photos?.length > 0 ? (
            <div>
              <img
                src={room.photos[activePhoto]?.url}
                alt={`Chambre ${room.number}`}
                className="h-72 w-full rounded-lg border border-gray-200 object-cover"
              />
              {room.photos.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {room.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setActivePhoto(index)}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                        index === activePhoto ? 'border-brand-500' : 'border-transparent'
                      }`}
                    >
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-50 text-7xl">
              🛏️
            </div>
          )}

          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
                {room.hostel_name}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">Chambre {room.number}</h1>
              <p className="mt-1 text-gray-500">
                {room.room_type_detail?.name} · {room.comfort_detail?.name} ·{' '}
                {room.beds_count} lit(s)
                {room.floor && ` · Étage ${room.floor}`}
              </p>
            </div>
            <span
              className={`whitespace-nowrap rounded px-3 py-1 text-sm font-medium ${
                isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {room.status !== 'available'
                ? STATUS_LABELS[room.status] || room.status
                : isAvailable
                  ? `${room.beds_available} lit(s) libre(s)`
                  : 'Complète'}
            </span>
          </div>

          <BookingBadges
            room={{ free_cancellation: room.price?.free_cancellation, deposit: room.price?.deposit }}
            className="mt-3"
          />

          {hostel && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900">Localisation</h2>
              <p className="mt-1 text-sm text-gray-500">{hostel.address || `${hostel.name}, Ghana`}</p>
              <MapPanel hostel={hostel} className="mt-2" />
            </div>
          )}

          {room.amenities?.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900">Équipements</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {room.amenities.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">Électricité</h2>
            <p className="mt-1 text-sm text-gray-600">
              {room.electricity_policy === 'included' && 'Incluse dans le tarif.'}
              {room.electricity_policy === 'excluded' && 'Exclue du tarif.'}
              {room.electricity_policy === 'additional' && 'Tarification complémentaire (voir le détail des frais).'}
            </p>
          </div>
        </div>

        {/* Booking panel */}
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            {room.price ? (
              <>
                <p className="text-2xl font-bold text-brand-600">
                  {Number(room.price.monthly_rate).toLocaleString('fr-FR')} FCFA
                  <span className="text-sm font-normal text-gray-400"> / mois</span>
                </p>
                <dl className="mt-4 flex flex-col gap-1.5 text-sm text-gray-600">
                  {room.price.electricity_fee != null && Number(room.price.electricity_fee) > 0 && (
                    <div className="flex justify-between">
                      <dt>Frais d'électricité</dt>
                      <dd>{Number(room.price.electricity_fee).toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                  )}
                  {room.price.admin_fee != null && Number(room.price.admin_fee) > 0 && (
                    <div className="flex justify-between">
                      <dt>Frais administratifs</dt>
                      <dd>{Number(room.price.admin_fee).toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                  )}
                  {room.price.deposit != null && Number(room.price.deposit) > 0 && (
                    <div className="flex justify-between">
                      <dt>Caution</dt>
                      <dd>{Number(room.price.deposit).toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <p className="text-sm text-gray-500">Tarif à confirmer.</p>
            )}

            {isAvailable ? (
              <Link
                to={`/reserver?room=${room.id}`}
                className="mt-5 block rounded-md bg-brand-900 px-4 py-3 text-center font-semibold text-white hover:bg-brand-700"
              >
                Réserver cette chambre
              </Link>
            ) : (
              <button
                disabled
                className="mt-5 block w-full cursor-not-allowed rounded-md bg-gray-200 px-4 py-3 text-center font-semibold text-gray-500"
              >
                Indisponible
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
