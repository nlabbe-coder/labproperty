// Ejecutar con: npx tsx scripts/crear-admin.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'admin@labproperty.cl'
  const password = 'admin123'
  const nombre = 'Admin'

  const hash = await bcrypt.hash(password, 12)

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password: hash },
    create: { email, password: hash, nombre },
  })

  console.log('Admin creado:', admin.email)
  console.log('Contraseña:', password)
  console.log('CAMBIA LA CONTRASEÑA DESPUÉS DE ENTRAR')
}

main().catch(console.error).finally(() => prisma.$disconnect())
