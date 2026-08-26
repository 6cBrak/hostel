import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { loginWithCredentials } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await loginWithCredentials(form.email, form.password)
      toast.success('Connexion réussie')
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.non_field_errors?.[0] || 'Identifiants invalides.'
      toast.error(detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-900 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-medium text-brand-600 hover:underline">
          Créer un compte étudiant
        </Link>
      </p>
    </div>
  )
}
