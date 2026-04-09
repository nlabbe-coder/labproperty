'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  remateId: string
  guardado: boolean
  logueado: boolean
}

export default function GuardarRemateBtn({ remateId, guardado: initialGuardado, logueado }: Props) {
  const router = useRouter()
  const [guardado, setGuardado] = useState(initialGuardado)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!logueado) {
      router.push('/login')
      return
    }

    setLoading(true)

    if (guardado) {
      await fetch(`/api/seguimientos/${remateId}`, { method: 'DELETE' })
      setGuardado(false)
    } else {
      await fetch(`/api/seguimientos/${remateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: '' }),
      })
      setGuardado(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn w-full text-sm transition-all ${
        guardado
          ? 'bg-verde text-white hover:bg-red-500'
          : 'btn-secondary'
      }`}
    >
      {loading ? '...' : guardado ? '✓ Guardado' : '+ Guardar remate'}
    </button>
  )
}
