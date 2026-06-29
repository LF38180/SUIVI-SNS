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

  function styleLien(l: LienNav): React.CSSProperties {
    const actif = estActif(l.href)
    return {
      color: actif || l.accent ? '#C0461F' : '#232326',
      fontWeight: actif || l.accent ? 700 : 400,
      borderBottom: actif ? '2px solid #EE6B3E' : '2px solid transparent',
      paddingBottom: 4,
      display: 'inline-flex',
      alignItems: 'center',
    }
  }

  const Badge = ({ n }: { n?: number }) =>
    n != null && n > 0 ? (
      <span style={{ marginLeft: 6, background: '#EE6B3E', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 12 }}>{n}</span>
    ) : null

  return (
    <nav
      style={{
        borderBottom: '1px solid #ECE5DF',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Barre haute */}
      <div style={{ display: 'flex', gap: 18, padding: '12px 22px', alignItems: 'center', fontSize: 14 }}>
        {/* Bouton hamburger (mobile uniquement) */}
        <button
          onClick={() => setOuvert((o) => !o)}
          aria-label="Menu"
          aria-expanded={ouvert}
          className="nav-burger"
          style={{ display: 'none', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}
        >
          ☰
        </button>

        {/* Liens en ligne (desktop) */}
        <div className="nav-liens-desktop" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          {liens.map((l) => (
            <Link key={l.href} href={l.href} style={styleLien(l)}>
              {l.label}
              <Badge n={l.badge} />
            </Link>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Cloche />
          <Link href="/compte" style={styleLien({ href: '/compte', label: 'Mon compte' })} className="nav-compte">
            Mon compte
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit' }}>
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      {/* Menu déroulant (mobile, quand ouvert) */}
      {ouvert && (
        <div className="nav-menu-mobile" style={{ display: 'none', flexDirection: 'column', padding: '0 22px 12px' }}>
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOuvert(false)}
              style={{
                padding: '12px 4px',
                borderTop: '1px solid #F3EEE9',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                color: estActif(l.href) || l.accent ? '#C0461F' : '#232326',
                fontWeight: estActif(l.href) || l.accent ? 700 : 400,
              }}
            >
              {l.label}
              <Badge n={l.badge} />
            </Link>
          ))}
          <Link
            href="/compte"
            onClick={() => setOuvert(false)}
            style={{ padding: '12px 4px', borderTop: '1px solid #F3EEE9', minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            Mon compte
          </Link>
        </div>
      )}
    </nav>
  )
}
