import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { updateSiteSettings } from '../../../api/settings'
import { useSiteSettings } from '../../../context/SiteSettingsContext'

const EMPTY = {
  site_name: '',
  tagline: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  facebook_url: '',
  instagram_url: '',
  whatsapp_number: '',
  footer_text: '',
}

export default function CompanySettings() {
  const { settings, refresh } = useSiteSettings()
  const [form, setForm] = useState(EMPTY)
  const [logo, setLogo] = useState(null)
  const [favicon, setFavicon] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!settings) return
    setForm({
      site_name: settings.site_name || '',
      tagline: settings.tagline || '',
      contact_email: settings.contact_email || '',
      contact_phone: settings.contact_phone || '',
      address: settings.address || '',
      facebook_url: settings.facebook_url || '',
      instagram_url: settings.instagram_url || '',
      whatsapp_number: settings.whatsapp_number || '',
      footer_text: settings.footer_text || '',
    })
  }, [settings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => data.append(key, value))
      if (logo) data.append('logo', logo)
      if (favicon) data.append('favicon', favicon)

      await updateSiteSettings(data)
      await refresh()
      toast.success('Informations mises à jour.')
      setLogo(null)
      setFavicon(null)
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!settings) return <p className="text-gray-500">Chargement…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Informations de l'entreprise</h1>
      <p className="mt-1 text-gray-500">
        Logo, coordonnées et réseaux sociaux — affichés automatiquement sur le site public.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité</h2>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Nom du site
              <input
                required
                value={form.site_name}
                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Slogan (optionnel)
              <input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Logo</p>
              {settings.logo && !logo && (
                <img src={settings.logo} alt="Logo actuel" className="mt-2 h-12 w-auto rounded border border-gray-200 bg-brand-900 p-1" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="mt-2 text-sm"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Favicon</p>
              {settings.favicon && !favicon && (
                <img src={settings.favicon} alt="Favicon actuel" className="mt-2 h-8 w-8 rounded border border-gray-200" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFavicon(e.target.files?.[0] || null)}
                className="mt-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
          <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-gray-700">
            Adresse
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Téléphone
              <input
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Réseaux sociaux</h2>
          <div className="mt-3 grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Facebook (URL)
              <input
                value={form.facebook_url}
                onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Instagram (URL)
              <input
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              WhatsApp (numéro)
              <input
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Texte de pied de page (optionnel)
          <input
            value={form.footer_text}
            onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
            placeholder={`© ${new Date().getFullYear()} ${form.site_name}`}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-md bg-brand-900 px-5 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
