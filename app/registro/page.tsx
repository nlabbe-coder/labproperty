'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegistroPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al registrarse')
      return
    }

    router.push('/perfil')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-azul-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black text-azul-900">
              <span className="text-verde">Lab</span>Property
            </h1>
          </Link>
          <p className="text-azul-500 text-sm mt-1">Crea tu cuenta gratis</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="input"
              placeholder="Tu nombre"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Confirmar contraseña</label>
            <input
              type="password"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              className="input"
              placeholder="Repite la contraseña"
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-rojo bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn btn-verde w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>

          <p className="text-center text-sm text-azul-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-verde font-semibold hover:underline">
              Ingresar
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-azul-400 mt-4">
          Al registrarte puedes guardar y seguir remates de tu interés.
        </p>
      </div>
    </div>
  )
}
