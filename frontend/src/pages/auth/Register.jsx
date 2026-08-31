import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL } from '../../lib/countryCodes'

export default function Register() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    nationality: '',
    date_of_birth: '',
    dial_code: DEFAULT_COUNTRY_DIAL,
    phone_local: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { dial_code, phone_local, ...rest } = form
      const payload = {
        ...rest,
        phone_number: phone_local.trim() ? `${dial_code} ${phone_local.trim()}` : '',
        date_of_birth: form.date_of_birth || null,
      }
      const { data } = await register(payload)
      signIn(data.user, data.access, data.refresh)
      toast.success('Compte créé avec succès')
      navigate('/')
    } catch (err) {
      const errors = err.response?.data
      const message = errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de la création du compte.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Créer un compte étudiant</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          required
          placeholder="Nom complet"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nationalité
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
            value={form.nationality}
            onChange={(e) => {
              const name = e.target.value
              const country = COUNTRY_CODES.find((c) => c.name === name)
              setForm({
                ...form,
                nationality: name,
                dial_code: country?.dial || form.dial_code,
              })
            }}
          >
            <option value="">— Sélectionner —</option>
            {COUNTRY_CODES.map((c) =>
              c.dial ? (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ) : (
                <option key="sep" disabled>
                  ──────────
                </option>
              )
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Date de naissance
          <input
            type="date"
            className="rounded-md border border-gray-300 px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Téléphone WhatsApp
          <div className="flex gap-2">
            <select
              className="w-24 min-w-0 shrink-0 rounded-md border border-gray-300 px-1 py-2 text-sm font-normal outline-none focus:border-brand-500 sm:w-36 sm:px-2"
              value={form.dial_code}
              onChange={(e) => setForm({ ...form, dial_code: e.target.value })}
            >
              {COUNTRY_CODES.map((c) =>
                c.dial ? (
                  <option key={c.name} value={c.dial}>
                    {c.name} ({c.dial})
                  </option>
                ) : (
                  <option key="sep" disabled>
                    ──────────
                  </option>
                )
              )}
            </select>
            <input
              placeholder="70 00 00 00"
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
              value={form.phone_local}
              onChange={(e) => setForm({ ...form, phone_local: e.target.value })}
            />
          </div>
        </label>
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mot de passe (8 caractères min.)"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-900 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="font-medium text-brand-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
