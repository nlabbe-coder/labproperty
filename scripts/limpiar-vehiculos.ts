// npx tsx scripts/limpiar-vehiculos.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // Eliminar remates de vehículos
  const eliminados = await prisma.remate.deleteMany({
    where: {
      textoOriginal: { contains: 'automóvil', mode: 'insensitive' },
    },
  })
  console.log(`Eliminados (automóvil): ${eliminados.count}`)

  const eliminados2 = await prisma.remate.deleteMany({
    where: {
      textoOriginal: { contains: 'vehículo', mode: 'insensitive' },
    },
  })
  console.log(`Eliminados (vehículo): ${eliminados2.count}`)

  const eliminados3 = await prisma.remate.deleteMany({
    where: {
      textoOriginal: { contains: 'camioneta', mode: 'insensitive' },
    },
  })
  console.log(`Eliminados (camioneta): ${eliminados3.count}`)

  const total = await prisma.remate.count()
  console.log(`\nTotal restante: ${total} remates de propiedades`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
