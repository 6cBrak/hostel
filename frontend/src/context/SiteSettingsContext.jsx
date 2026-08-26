import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getSiteSettings } from '../api/settings'

const SiteSettingsContext = createContext({ settings: null, refresh: () => {} })

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)

  const refresh = useCallback(() => {
    return getSiteSettings()
      .then((r) => setSettings(r.data))
      .catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SiteSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
