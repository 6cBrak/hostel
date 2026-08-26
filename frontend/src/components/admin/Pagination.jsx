export default function Pagination({ page, totalPages, count, pageSize, onChange }) {
  if (count === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
      <p>
        {from}–{to} sur {count}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:opacity-40"
        >
          ← Précédent
        </button>
        <span className="px-2">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:opacity-40"
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}
