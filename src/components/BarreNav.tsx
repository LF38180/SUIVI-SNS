'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cloche } from '@/components/Cloche'

export type LienNav = { href: string; label: string; badge?: number; accent?: boolean }

export function BarreNav({ liens }: { liens: LienNav[] }) {
  const pathname = usePathname()
  const [ouvert, setOuvert] = useState(false)

  function estActif(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  const Badge = ({ n }: { n?: number }) =>
    n != null && n > 0 ? (
      <span style={{ marginLeft: 6, background: '#EE6B3E', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 12 }}>{n}</span>
    ) : null

  function lienStyle(l: LienNav): React.CSSProperties {
    const actif = estActif(l.href)
    return {
      color: actif || l.accent ? '#C0461F' : '#232326',
      fontWeight: actif || l.accent ? 700 : 400,
      borderBottom: actif ? '2px solid #EE6B3E' : '2px solid transparent',
      paddingBottom: 4,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    }
  }

  const tous = [...liens, { href: '/compte', label: 'Mon compte' }]

  return (
    <nav className="barre-nav">
      <div className="barre-nav-haut">
        {/* Bouton menu — visible en mobile uniquement (CSS) */}
        <button
          className="nav-toggle"
          onClick={() => setOuvert((o) => !o)}
          aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={ouvert}
        >
          {ouvert ? '✕ Fermer' : '☰ Menu'}
        </button>

        {/* Liens — visibles en bureau (CSS) */}
        <div className="nav-liens">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} style={lienStyle(l)}>
              {l.label}
              <Badge n={l.badge} />
            </Link>
          ))}
        </div>

        <div className="nav-droite">
          <Cloche />
          <Link href="/compte" style={lienStyle({ href: '/compte', label: 'Mon compte' })} className="nav-compte-desktop">
            Mon compte
          </Link>
          <form action="/api/auth/logout" method="post" className="nav-deco-desktop">
            <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit' }}>
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      {/* Menu déroulant mobile (affiché par CSS quand .ouvert) */}
      <div className={'nav-menu-deroulant' + (ouvert ? ' ouvert' : '')}>
        {tous.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOuvert(false)}
            style={{
              padding: '14px 4px',
              borderBottom: '1px solid #F3EEE9',
              minHeight: 48,
              display: 'flex',
              alignItems: 'center',
              fontSize: 16,
              textDecoration: 'none',
              color: estActif(l.href) || (l as LienNav).accent ? '#C0461F' : '#232326',
              fontWeight: estActif(l.href) || (l as LienNav).accent ? 700 : 400,
            }}
          >
            {l.label}
            <Badge n={(l as LienNav).badge} />
          </Link>
        ))}
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit', padding: '14px 4px', minHeight: 48, fontSize: 16 }}>
            Déconnexion
          </button>
        </form>
      </div>
    </nav>
  )
}
