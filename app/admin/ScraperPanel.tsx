'use client'

import { useState } from 'react'

export default function ScraperPanel() {
  const [paginas, setPaginas] = useState(2)
  const [region, setRegion] = useState('todo_chile')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ nuevos: number; omitidos: number; errores: number } | null>(null)
  const [error, setError] = useState('')

  async function correrScraper() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/admin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paginas, region }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al correr el scraper')
      } else {
        setResult(data)
      }
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-bold text-azul-900 mb-4">Correr scraper</h2>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Páginas a leer</label>
            <select
              value={paginas}
              onChange={e => setPaginas(Number(e.target.value))}
              className="input text-sm"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'página' : 'páginas'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Región</label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="input text-sm"
            >
              <option value="todo_chile">Todo Chile</option>
              <option value="region-metropolitana">Metropolitana</option>
              <option value="region-de-valparaiso">Valparaíso</option>
              <option value="region-del-biobio">Biobío</option>
              <option value="region-de-la-araucania">La Araucanía</option>
              <option value="region-de-los-lagos">Los Lagos</option>
              <option value="region-de-antofagasta">Antofagasta</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-azul-500">
          Extrae remates de economicos.cl con delay de 1.5s entre peticiones. Máximo 5 páginas (~100 remates).
        </p>
      </div>

      <button
        onClick={correrScraper}
        disabled={loading}
        className="btn btn-verde w-full"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Scrapendo... puede tardar varios minutos
          </span>
        ) : 'Iniciar scraping'}
      </button>

      {error && (
        <p className="text-sm text-rojo mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="font-bold text-green-800 mb-2">Scraping completado</p>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-2xl font-black text-verde">{result.nuevos}</p>
              <p className="text-green-700">Nuevos</p>
            </div>
            <div>
              <p className="text-2xl font-black text-azul-600">{result.omitidos}</p>
              <p className="text-azul-500">Ya existían</p>
            </div>
            <div>
              <p className="text-2xl font-black text-rojo">{result.errores}</p>
              <p className="text-red-500">Errores</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
