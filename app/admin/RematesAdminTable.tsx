'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RemateRow {
  id: string
  direccion: string | null
  comuna: string | null
  tipoInmueble: string | null
  precioMinimo: number | null
  fechaRemate: Date | null
  modalidad: string | null
  estado: string
  destacado: boolean
  creadoEn: Date
  fuenteUrl: string | null
}

function formatPrecio(n: number | null) {
  if (!n) return '—'
  return '$' + n.toLocaleString('es-CL')
}

function formatFecha(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(d))
}

export default function RematesAdminTable({ remates }: { remates: RemateRow[] }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtrados = remates.filter(r =>
    [r.direccion, r.comuna, r.modalidad, r.tipoInmueble]
      .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
  )

  async function toggleEstado(r: RemateRow) {
    const nuevoEstado = r.estado === 'activo' ? 'inactivo' : 'activo'
    await fetch(`/api/admin/remates/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    router.refresh()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este remate permanentemente?')) return
    setDeleting(id)
    await fetch(`/api/admin/remates/${id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por dirección, comuna, tipo..."
          className="input text-sm max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-azul-100">
        <table className="w-full text-sm">
          <thead className="bg-azul-50 border-b border-azul-100">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Dirección</th>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Comuna</th>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Tipo</th>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Precio mín.</th>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Fecha remate</th>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Estado</th>
              <th className="text-left px-3 py-2.5 font-semibold text-azul-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-azul-50">
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-azul-400">Sin resultados</td>
              </tr>
            )}
            {filtrados.map(r => (
              <tr key={r.id} className="hover:bg-azul-50/50 transition-colors">
                <td className="px-3 py-2.5 max-w-[200px]">
                  <p className="truncate font-medium text-azul-900">{r.direccion ?? '—'}</p>
                  {r.fuenteUrl && (
                    <a href={r.fuenteUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-verde hover:underline">fuente</a>
                  )}
                </td>
                <td className="px-3 py-2.5 text-azul-700">{r.comuna ?? '—'}</td>
                <td className="px-3 py-2.5 text-azul-600">{r.tipoInmueble ?? '—'}</td>
                <td className="px-3 py-2.5 font-bold text-azul-900">{formatPrecio(r.precioMinimo)}</td>
                <td className="px-3 py-2.5 text-azul-600">{formatFecha(r.fechaRemate)}</td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => toggleEstado(r)}
                    className={`badge cursor-pointer transition-colors ${
                      r.estado === 'activo'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {r.estado}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/remates/${r.id}`}
                      target="_blank"
                      className="text-xs text-azul-600 hover:text-azul-900 font-medium"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => eliminar(r.id)}
                      disabled={deleting === r.id}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      {deleting === r.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-azul-400 mt-3">{filtrados.length} de {remates.length} remates</p>
    </div>
  )
}
