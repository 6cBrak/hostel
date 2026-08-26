import { useSiteSettings } from '../context/SiteSettingsContext'

export default function Footer() {
  const { settings } = useSiteSettings()
  const hasContact = settings?.contact_email || settings?.contact_phone || settings?.address
  const hasSocial = settings?.facebook_url || settings?.instagram_url || settings?.whatsapp_number

  return (
    <footer className="mt-auto border-t border-gray-200 bg-brand-900 text-brand-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-lg font-bold text-white">{settings?.site_name || 'SMART HOSTEL ATOMA'}</p>
            {settings?.tagline && <p className="mt-1 text-sm">{settings.tagline}</p>}
          </div>

          {hasContact && (
            <div className="text-sm">
              <p className="font-semibold text-white">Contact</p>
              {settings.address && <p className="mt-1">{settings.address}</p>}
              {settings.contact_phone && <p>{settings.contact_phone}</p>}
              {settings.contact_email && <p>{settings.contact_email}</p>}
            </div>
          )}

          {hasSocial && (
            <div className="flex gap-3 text-sm">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="hover:text-white">
                  Facebook
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
              {settings.whatsapp_number && (
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 border-t border-white/10 pt-4 text-xs text-brand-100/70">
          {settings?.footer_text || `© ${new Date().getFullYear()} ${settings?.site_name || 'SMART HOSTEL ATOMA'}`}
        </p>
      </div>
    </footer>
  )
}
