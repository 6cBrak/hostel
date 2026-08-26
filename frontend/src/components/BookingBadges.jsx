export default function BookingBadges({ room, className = '' }) {
  const badges = []
  if (room?.free_cancellation) badges.push({ label: 'Annulation gratuite', tone: 'emerald' })
  if (room?.deposit != null && Number(room.deposit) === 0) {
    badges.push({ label: 'Aucun dépôt requis', tone: 'sky' })
  }
  if (badges.length === 0) return null

  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((b) => (
        <span key={b.label} className={`rounded px-2 py-0.5 text-xs font-medium ${tones[b.tone]}`}>
          {b.label}
        </span>
      ))}
    </div>
  )
}
