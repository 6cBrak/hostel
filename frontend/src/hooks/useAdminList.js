import { useEffect, useState } from 'react'

const PAGE_SIZE = 10

/**
 * Recherche + pagination côté serveur pour les tableaux du back-office.
 * `listFn` doit accepter { page, page_size, search, ...extraParams } et renvoyer
 * une réponse paginée DRF ({ count, results }).
 */
export function useAdminList(listFn, extraParams = {}, deps = []) {
  const [search, setSearchRaw] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const setSearch = (value) => {
    setSearchRaw(value)
    setPage(1)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const load = () => {
    setLoading(true)
    const params = { page, page_size: PAGE_SIZE, ...extraParams }
    if (debouncedSearch) params.search = debouncedSearch
    return listFn(params)
      .then((r) => {
        setItems(r.data.results ?? r.data)
        setCount(r.data.count ?? (r.data.results ?? r.data).length)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, ...deps])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return {
    items, count, loading, page, setPage, search, setSearch, pageSize: PAGE_SIZE, totalPages, reload: load,
  }
}
