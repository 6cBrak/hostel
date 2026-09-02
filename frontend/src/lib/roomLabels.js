// États administratifs de la chambre — posés à la main par le staff.
// L'occupation (lits pris/libres) est une donnée séparée, voir
// OCCUPANCY_STATUS_LABELS/_TONES ci-dessous.
export const ROOM_STATUS_LABELS = {
  available: 'Disponible',
  maintenance: 'En maintenance',
  out_of_service: 'Hors service',
  blocked: 'Bloquée temporairement',
}

export const ROOM_STATUS_TONES = {
  available: 'bg-emerald-50 text-emerald-700',
  maintenance: 'bg-orange-50 text-orange-700',
  out_of_service: 'bg-gray-100 text-gray-500',
  blocked: 'bg-red-50 text-red-700',
}

// Occupation dérivée des lits pris/libres (Room.occupancy_status côté backend).
export const OCCUPANCY_STATUS_LABELS = {
  available: 'Libre',
  partially_occupied: 'Partiellement occupée',
  fully_occupied: 'Complète',
}

export const OCCUPANCY_STATUS_TONES = {
  available: 'bg-emerald-50 text-emerald-700',
  partially_occupied: 'bg-amber-50 text-amber-700',
  fully_occupied: 'bg-red-50 text-red-700',
}

export const ELECTRICITY_POLICY_LABELS = {
  included: 'Incluse dans le tarif',
  excluded: 'Exclue du tarif',
  additional: 'Tarification complémentaire',
}
