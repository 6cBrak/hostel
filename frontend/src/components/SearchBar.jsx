import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ hostels = [], initial = {}, compact = false }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState({
    hostel: initial.hostel || '',
    start_date: initial.start_date || '',
    end_date: initial.end_date || '',
    people: initial.people || 1,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.hostel) params.set('hostel', search.hostel)
    if (search.start_date) params.set('start_date', search.start_date)
    if (search.end_date) params.set('end_date', search.end_date)
    if (search.people) params.set('people', search.people)
    navigate(`/chambres?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className={
        compact
          ? 'mx-auto flex w-full max-w-6xl flex-col gap-2 rounded-lg bg-white p-2 text-gray-800 shadow-md sm:flex-row sm:items-stretch'
          : 'mx-auto flex max-w-5xl flex-col gap-3 rounded-xl bg-white p-3 text-gray-800 shadow-xl sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full sm:p-2'
      }
    >
      <div className={`flex flex-1 items-center gap-2 rounded-md px-3 ${compact ? 'py-1.5' : 'px-4 py-2'}`}>
        <span className="text-lg">🏠</span>
        <select
          className="w-full bg-transparent text-sm font-medium outline-none"
          value={search.hostel}
          onChange={(e) => setSearch({ ...search, hostel: e.target.value })}
        >
          <option value="">Tous les hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden w-px bg-gray-200 sm:block" />
      <div className={`flex flex-1 items-center gap-2 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
        <span className="text-lg">📅</span>
        <input
          type="date"
          className="w-full bg-transparent text-sm font-medium outline-none"
          value={search.start_date}
          onChange={(e) => setSearch({ ...search, start_date: e.target.value })}
        />
      </div>
      <div className="hidden w-px bg-gray-200 sm:block" />
      <div className={`flex flex-1 items-center gap-2 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
        <span className="text-lg">👥</span>
        <input
          type="number"
          min="1"
          className="w-full bg-transparent text-sm font-medium outline-none"
          value={search.people}
          onChange={(e) => setSearch({ ...search, people: e.target.value })}
        />
        <span className="whitespace-nowrap text-sm text-gray-400">personne(s)</span>
      </div>
      <button
        type="submit"
        className={`rounded-md bg-brand-900 font-bold text-white transition hover:bg-brand-700 ${
          compact ? 'px-6 py-2 text-sm sm:ml-1' : 'rounded-full px-8 py-3 text-sm sm:ml-2'
        }`}
      >
        Rechercher
      </button>
    </form>
  )
}
