import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ remateId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })

  const { remateId } = await params
  const { notas } = await req.json().catch(() => ({ notas: '' }))

  try {
    const seguimiento = await prisma.seguimiento.upsert({
      where: { remateId_usuarioId: { remateId, usuarioId: session.id } },
      update: { notas },
      create: { remateId, usuarioId: session.id, notas },
    })
    return NextResponse.json({ ok: true, id: seguimiento.id })
  } catch {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ remateId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { remateId } = await params

  try {
    await prisma.seguimiento.delete({
      where: { remateId_usuarioId: { remateId, usuarioId: session.id } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
}
