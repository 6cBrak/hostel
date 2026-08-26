import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await register(form)
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
        <input
          placeholder="Téléphone"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-brand-500"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        />
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
