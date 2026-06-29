import { NextResponse } from 'next/server'
import { detruireSession } from '@/lib/session'

export async function POST(req: Request) {
  await detruireSession()
  return NextResponse.redirect(new URL('/connexion', req.url), 303)
}
