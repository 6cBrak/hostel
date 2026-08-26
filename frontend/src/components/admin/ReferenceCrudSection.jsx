import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAdminList } from '../../hooks/useAdminList'
import SearchInput from './SearchInput'
import Pagination from './Pagination'

/**
 * Table CRUD générique pour des données de référence simples (nom, capacité...).
 * Édition en ligne — pas besoin d'une page/route dédiée par table.
 */
export default function ReferenceCrudSection({ title, hint, fields, listFn, createFn, updateFn, deleteFn }) {
  const {
    items, count, loading, page, setPage, search, setSearch, pageSize, totalPages, reload,
  } = useAdminList(listFn)

  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [newValues, setNewValues] = useState(() => emptyValues(fields))
  const [submitting, setSubmitting] = useState(false)

  function emptyValues(fs) {
    const v = {}
    fs.forEach((f) => { v[f.key] = f.type === 'checkbox' ? false : '' })
    return v
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    const v = {}
    fields.forEach((f) => { v[f.key] = item[f.key] })
    setEditValues(v)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createFn(newValues)
      toast.success('Ajouté.')
      setNewValues(emptyValues(fields))
      reload()
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : "Erreur lors de l'ajout.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id) => {
    setSubmitting(true)
    try {
      await updateFn(id, editValues)
      toast.success('Mis à jour.')
      setEditingId(null)
      reload()
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de la mise à jour.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm('Supprimer cet élément ?')) return
    try {
      await deleteFn(item.id)
      toast.success('Supprimé.')
      reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Suppression impossible (probablement utilisé ailleurs).')
    }
  }

  const renderInput = (field, values, setValues) => {
    if (field.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={!!values[field.key]}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.checked })}
        />
      )
    }
    if (field.type === 'select') {
      return (
        <select
          value={values[field.key] ?? ''}
          onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
        >
          <option value="">—</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }
    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={values[field.key] ?? ''}
        onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
      />
    )
  }

  const displayValue = (field, item) => {
    if (field.type === 'checkbox') return item[field.key] ? 'Oui' : 'Non'
    if (field.type === 'select') return field.options.find((o) => String(o.value) === String(item[field.key]))?.label || '—'
    return item[field.key] ?? '—'
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}

      <div className="mt-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher…" />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {fields.map((f) => (
                <th key={f.key} className="px-3 py-2">{f.label}</th>
              ))}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={fields.length + 1} className="px-3 py-4 text-center text-gray-500">Chargement…</td></tr>
            ) : (
              <>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    {fields.map((f) => (
                      <td key={f.key} className="px-3 py-2">
                        {editingId === item.id ? renderInput(f, editValues, setEditValues) : displayValue(f, item)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(item.id)}
                            disabled={submitting}
                            className="font-medium text-emerald-600 hover:underline"
                          >
                            Sauver
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="ml-3 font-medium text-gray-500 hover:underline"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="font-medium text-brand-600 hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="ml-3 font-medium text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  {fields.map((f) => (
                    <td key={f.key} className="px-3 py-2">{renderInput(f, newValues, setNewValues)}</td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={handleCreate}
                      disabled={submitting}
                      className="rounded-md bg-brand-900 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      + Ajouter
                    </button>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onChange={setPage} />
    </div>
  )
}
