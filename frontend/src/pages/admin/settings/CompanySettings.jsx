import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { updateSiteSettings, downloadTenantsResetBackup, resetTenantsData } from '../../../api/settings'
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

  const [downloadingBackup, setDownloadingBackup] = useState(false)
  const [backupDownloaded, setBackupDownloaded] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetSummary, setResetSummary] = useState(null)

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

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true)
    try {
      const response = await downloadTenantsResetBackup()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `sauvegarde_locataires_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setBackupDownloaded(true)
      toast.success('Sauvegarde téléchargée.')
    } catch {
      toast.error('Échec du téléchargement de la sauvegarde.')
    } finally {
      setDownloadingBackup(false)
    }
  }

  const handleConfirmReset = async () => {
    if (confirmText !== 'SUPPRIMER') return
    setResetting(true)
    try {
      const { data } = await resetTenantsData(confirmText)
      setResetSummary(data)
      setShowResetModal(false)
      setConfirmText('')
      setBackupDownloaded(false)
      toast.success('Données locataires réinitialisées.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Échec de la réinitialisation.')
    } finally {
      setResetting(false)
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

      <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">Zone de danger</h2>
        <p className="mt-1 text-sm text-red-700">
          Supprime définitivement toutes les réservations, factures, paiements, reçus et comptes
          étudiants (locataires), et remet les chambres concernées à "Disponible". Les hostels,
          chambres, tarifs, référentiels et comptes non-étudiants (admin, gestionnaire, comptable,
          agent d'accueil) ne sont pas touchés. <strong>Action irréversible.</strong>
        </p>

        {resetSummary && (
          <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-gray-700">
            {resetSummary.reservations_supprimees} réservation(s), {resetSummary.etudiants_supprimes}{' '}
            étudiant(s) supprimé(s) — {resetSummary.chambres_reinitialisees} chambre(s) remise(s) à
            Disponible.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {downloadingBackup ? 'Préparation…' : '1. Télécharger une sauvegarde'}
          </button>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={!backupDownloaded}
            title={!backupDownloaded ? 'Téléchargez d\'abord une sauvegarde' : ''}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            2. Réinitialiser les données locataires
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Confirmer la réinitialisation</h3>
            <p className="mt-2 text-sm text-gray-600">
              Cette action supprime définitivement toutes les réservations, factures, paiements,
              reçus et comptes étudiants. Elle est irréversible. Pour continuer, tapez{' '}
              <strong>SUPPRIMER</strong> ci-dessous.
            </p>
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false)
                  setConfirmText('')
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={confirmText !== 'SUPPRIMER' || resetting}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resetting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
