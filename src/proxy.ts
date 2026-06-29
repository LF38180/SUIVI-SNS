import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/session'

const CHEMINS_PUBLICS = ['/connexion', '/public']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ressources publiques + api auth toujours accessibles
  if (
    CHEMINS_PUBLICS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const cookie = req.cookies.get('sns_session')
  // proxy tourne en runtime nodejs (Next 16) → on peut vérifier la signature
  if (!cookie || !verifierToken(cookie.value)) {
    const url = req.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
