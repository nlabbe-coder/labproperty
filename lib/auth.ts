import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET no configurado')
  return new TextEncoder().encode(s)
}

export async function createToken(payload: { id: string; email: string; nombre: string; rol: 'admin' | 'usuario' }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { id: string; email: string; nombre: string; rol: 'admin' | 'usuario' }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('lp_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getAdminSession() {
  const session = await getSession()
  if (!session || session.rol !== 'admin') return null
  return session
}
