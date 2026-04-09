'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoRemateForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [parseado, setParseado] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOk(false)
    setParseado(null)

    const res = await fetch('/api/admin/remates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textoOriginal: texto }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al guardar')
      return
    }

    setOk(true)
    setParseado(data.parseado)
    setTexto('')
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary w-full text-sm">
        + Agregar remate manualmente
      </button>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-azul-900">Agregar remate manual</h2>
        <button onClick={() => setOpen(false)} className="text-azul-400 hover:text-azul-700 text-sm">Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Texto del aviso de remate</label>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={8}
            className="input font-mono text-xs leading-relaxed"
            placeholder="Pega aquí el texto completo del aviso del diario o clasificado..."
            required
          />
          <p className="text-xs text-azul-400 mt-1">
            El parser extraerá automáticamente tribunal, fecha, precio, comuna y más.
          </p>
        </div>

        {error && (
          <p className="text-sm text-rojo bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        {ok && parseado && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm">
            <p className="font-bold text-green-800 mb-2">Remate guardado. Datos extraídos:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-green-700">
              {Object.entries(parseado).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="truncate">
                  <span className="opacity-60">{k}: </span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-verde">
          {loading ? 'Guardando...' : 'Parsear y guardar'}
        </button>
      </form>
    </div>
  )
}
