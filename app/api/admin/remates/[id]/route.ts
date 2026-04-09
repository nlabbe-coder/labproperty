import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const remate = await prisma.remate.update({
      where: { id },
      data: {
        estado: body.estado,
        destacado: body.destacado,
        direccion: body.direccion,
        comuna: body.comuna,
        tipoInmueble: body.tipoInmueble,
        precioMinimo: body.precioMinimo ? Number(body.precioMinimo) : undefined,
        fechaRemate: body.fechaRemate ? new Date(body.fechaRemate) : undefined,
        modalidad: body.modalidad,
      },
    })
    return NextResponse.json({ ok: true, id: remate.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.remate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
