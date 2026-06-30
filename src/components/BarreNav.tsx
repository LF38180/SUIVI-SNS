'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cloche } from '@/components/Cloche'

export type LienNav = { href: string; label: string; badge?: number; accent?: boolean }

export function BarreNav({ liens }: { liens: LienNav[] }) {
  const pathname = usePathname()
  const [ouvert, setOuvert] = useState(false)
  const [mobile, setMobile] = useState(false)

  // Détecte la largeur réelle (ne dépend pas que du CSS → menu fiable)
  useEffect(() => {
    function check() {
      setMobile(window.innerWidth <= 760)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Ferme le menu après navigation
  useEffect(() => {
    setOuvert(false)
  }, [pathname])

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

  const tousLiens = [...liens, { href: '/compte', label: 'Mon compte' }]

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
      <div style={{ display: 'flex', gap: 18, padding: '12px 22px', alignItems: 'center', fontSize: 14 }}>
        {mobile ? (
          <>
            {/* Bouton menu (mobile) */}
            <button
              onClick={() => setOuvert((o) => !o)}
              aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={ouvert}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1, minWidth: 44, minHeight: 44 }}
            >
              {ouvert ? '✕' : '☰'}
            </button>
            <Link href="/" style={{ fontWeight: 800, color: '#EE6B3E', fontSize: 16, textDecoration: 'none' }}>
              SNS
            </Link>
            <div style={{ marginLeft: 'auto' }}>
              <Cloche />
            </div>
          </>
        ) : (
          <>
            {/* Liens en ligne (bureau) */}
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              {liens.map((l) => (
                <Link key={l.href} href={l.href} style={styleLien(l)}>
                  {l.label}
                  <Badge n={l.badge} />
                </Link>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Cloche />
              <Link href="/compte" style={styleLien({ href: '/compte', label: 'Mon compte' })}>
                Mon compte
              </Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit' }}>
                  Déconnexion
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Menu déroulant mobile */}
      {mobile && ouvert && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 22px 12px', borderTop: '1px solid #ECE5DF' }}>
          {tousLiens.map((l) => (
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
                color: estActif(l.href) || (l as LienNav).accent ? '#C0461F' : '#232326',
                fontWeight: estActif(l.href) || (l as LienNav).accent ? 700 : 400,
              }}
            >
              {l.label}
              <Badge n={(l as LienNav).badge} />
            </Link>
          ))}
          <form action="/api/auth/logout" method="post" style={{ marginTop: 8 }}>
            <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', font: 'inherit', padding: '12px 4px', minHeight: 44, fontSize: 15 }}>
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </nav>
  )
}
