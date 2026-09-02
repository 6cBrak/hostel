import { useEffect, useState } from 'react'
import ReferenceCrudSection from '../../../components/admin/ReferenceCrudSection'
import {
  listRoomTypes, createRoomType, updateRoomType, deleteRoomType,
  listComfortOptions, createComfortOption, updateComfortOption, deleteComfortOption,
  listAmenities, createAmenity, updateAmenity, deleteAmenity,
  listZones, createZone, updateZone, deleteZone,
  listHostels,
} from '../../../api/hostels'
import {
  listExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
} from '../../../api/cashbox'

const TABS = [
  { key: 'room_types', label: 'Types de chambre' },
  { key: 'comfort', label: 'Confort' },
  { key: 'amenities', label: 'Équipements' },
  { key: 'zones', label: 'Zones / Blocs' },
  { key: 'expense_categories', label: 'Catégories de dépense' },
]

export default function References() {
  const [tab, setTab] = useState('room_types')
  const [hostelOptions, setHostelOptions] = useState([])

  useEffect(() => {
    listHostels().then((r) =>
      setHostelOptions((r.data.results ?? r.data).map((h) => ({ value: h.id, label: h.name })))
    )
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Référentiels</h1>
      <p className="mt-1 text-gray-500">
        Données de configuration utilisées par les chambres et les tarifs.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'room_types' && (
          <ReferenceCrudSection
            title="Types de chambre"
            hint="Ex. Individuelle, Double, Triple, Quadruple."
            fields={[
              { key: 'name', label: 'Nom', type: 'text' },
              { key: 'capacity', label: 'Capacité (personnes)', type: 'number' },
            ]}
            listFn={listRoomTypes}
            createFn={createRoomType}
            updateFn={updateRoomType}
            deleteFn={deleteRoomType}
          />
        )}
        {tab === 'comfort' && (
          <ReferenceCrudSection
            title="Options de confort"
            hint="Ex. Ventilée, Climatisée."
            fields={[{ key: 'name', label: 'Nom', type: 'text' }]}
            listFn={listComfortOptions}
            createFn={createComfortOption}
            updateFn={updateComfortOption}
            deleteFn={deleteComfortOption}
          />
        )}
        {tab === 'amenities' && (
          <ReferenceCrudSection
            title="Équipements"
            hint="Équipements pouvant être associés à une chambre."
            fields={[{ key: 'name', label: 'Nom', type: 'text' }]}
            listFn={listAmenities}
            createFn={createAmenity}
            updateFn={updateAmenity}
            deleteFn={deleteAmenity}
          />
        )}
        {tab === 'zones' && hostelOptions.length > 0 && (
          <ReferenceCrudSection
            title="Zones / Blocs"
            hint="Regroupement interne à un hostel (zone, bloc, bâtiment...)."
            fields={[
              { key: 'hostel', label: 'Hostel', type: 'select', options: hostelOptions },
              { key: 'name', label: 'Nom', type: 'text' },
              { key: 'floor', label: 'Étage', type: 'text' },
            ]}
            listFn={listZones}
            createFn={createZone}
            updateFn={updateZone}
            deleteFn={deleteZone}
          />
        )}
        {tab === 'expense_categories' && (
          <ReferenceCrudSection
            title="Catégories de dépense"
            hint="Ex. Plomberie, Électricité, Ménage, Fournitures, Réparation."
            fields={[{ key: 'name', label: 'Nom', type: 'text' }]}
            listFn={listExpenseCategories}
            createFn={createExpenseCategory}
            updateFn={updateExpenseCategory}
            deleteFn={deleteExpenseCategory}
          />
        )}
      </div>
    </div>
  )
}
