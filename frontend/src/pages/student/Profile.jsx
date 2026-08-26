import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { updateMe, changePassword } from '../../api/auth'
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  uploadMyDocument,
  deleteMyDocument,
} from '../../api/reservations'
import { useAuth } from '../../context/AuthContext'

export default function Profile() {
  const { user, setUser, isStudent, loading } = useAuth()

  if (loading) return <p className="mx-auto max-w-2xl px-4 py-10 text-gray-500">Chargement…</p>

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
      <p className="mt-1 text-gray-500">
        {isStudent
          ? 'Modifiez vos informations personnelles et académiques.'
          : 'Modifiez vos informations personnelles.'}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <AccountSection user={user} onSaved={setUser} />
        {isStudent && <AcademicSection />}
        {isStudent && <DocumentsSection />}
        <PasswordSection />
      </div>
    </div>
  )
}

function AccountSection({ user, onSaved }) {
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone_number: user?.phone_number || '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await updateMe(form)
      onSaved(data)
      toast.success('Informations mises à jour.')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Mon compte</h2>
      <div className="mt-3 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nom complet
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Téléphone
          <input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Email
          <input
            disabled
            value={user?.email || ''}
            className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
          />
          <span className="text-xs text-gray-400">L'email ne peut pas être modifié ici.</span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

const EMPTY_ACADEMIC = {
  sex: '',
  date_of_birth: '',
  nationality: '',
  student_number: '',
  program: '',
  academic_year: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
}

function AcademicSection() {
  const [form, setForm] = useState(EMPTY_ACADEMIC)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMyStudentProfile()
      .then((r) => {
        const p = r.data
        setForm({
          sex: p.sex || '',
          date_of_birth: p.date_of_birth || '',
          nationality: p.nationality || '',
          student_number: p.student_number || '',
          program: p.program || '',
          academic_year: p.academic_year || '',
          emergency_contact_name: p.emergency_contact_name || '',
          emergency_contact_phone: p.emergency_contact_phone || '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateMyStudentProfile({ ...form, date_of_birth: form.date_of_birth || null })
      toast.success('Profil académique mis à jour.')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de l’enregistrement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">
        Chargement du profil académique…
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Profil académique</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Sexe
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">—</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Date de naissance
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nationalité
          <input
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Numéro étudiant / matricule
          <input
            value={form.student_number}
            onChange={(e) => setForm({ ...form, student_number: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Programme / formation
          <input
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Année académique
          <input
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            placeholder="ex. 2026-2027"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Contact d'urgence — nom
          <input
            value={form.emergency_contact_name}
            onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Contact d'urgence — téléphone
          <input
            value={form.emergency_contact_phone}
            onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 self-start rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

function DocumentsSection() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getMyStudentProfile()
      .then((r) => setDocuments(r.data.documents || []))
      .finally(() => setLoading(false))
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Format non autorisé. Formats acceptés : ${ALLOWED_EXTENSIONS.join(', ')}.`)
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (5 Mo maximum).')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const { data } = await uploadMyDocument(file)
      setDocuments(data.documents || [])
      toast.success('Document envoyé.')
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors?.detail || "Erreur lors de l'envoi du document.")
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const { data } = await deleteMyDocument(id)
      setDocuments(data.documents || [])
      toast.success('Document supprimé.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">
        Chargement des documents…
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Documents justificatifs</h2>
      <p className="mt-1 text-sm text-gray-500">
        Carte d'étudiant, pièce d'identité, etc. Formats acceptés : PDF, JPG, PNG (5 Mo max.).
      </p>

      {documents.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-sm font-medium text-brand-700 hover:underline"
              >
                {doc.name}
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
              >
                {deletingId === doc.id ? 'Suppression…' : 'Supprimer'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-60"
        />
        {uploading && <p className="mt-2 text-xs text-gray-500">Envoi en cours…</p>}
      </div>
    </div>
  )
}

function PasswordSection() {
  const [form, setForm] = useState({ old_password: '', new_password: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await changePassword(form)
      toast.success('Mot de passe modifié.')
      setForm({ old_password: '', new_password: '' })
    } catch (err) {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(' ') : 'Erreur lors du changement de mot de passe.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Mot de passe</h2>
      <div className="mt-3 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Mot de passe actuel
          <input
            type="password"
            required
            value={form.old_password}
            onChange={(e) => setForm({ ...form, old_password: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nouveau mot de passe (8 caractères min.)
          <input
            type="password"
            required
            minLength={8}
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </div>
    </form>
  )
}
