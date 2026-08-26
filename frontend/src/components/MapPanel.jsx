import { mapEmbedSrc } from '../lib/maps'

export default function MapPanel({ hostel, className = '', height = 220 }) {
  if (!hostel) return null
  const src = mapEmbedSrc({
    latitude: hostel.latitude,
    longitude: hostel.longitude,
    address: hostel.address,
    name: hostel.name,
  })

  const approximate = hostel.latitude == null || hostel.longitude == null

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 ${className}`}>
      <iframe
        title={`Carte — ${hostel.name}`}
        src={src}
        width="100%"
        height={height}
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {approximate && (
        <p className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
          Position approximative — adresse exacte à confirmer par SMART HOSTEL ATOMA.
        </p>
      )}
    </div>
  )
}
