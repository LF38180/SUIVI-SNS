'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type LienNav = { href: string; label: string; badge?: number; accent?: boolean }

export function NavLiens({ liens }: { liens: LienNav[] }) {
  const pathname = usePathname()

  return (
    <>
      {liens.map((l) => {
        const actif = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: actif ? '#EE6B3E' : l.accent ? '#EE6B3E' : '#232326',
              fontWeight: actif || l.accent ? 700 : 400,
              borderBottom: actif ? '2px solid #EE6B3E' : '2px solid transparent',
              paddingBottom: 4,
              position: 'relative',
            }}
          >
            {l.label}
            {l.badge != null && l.badge > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: '#EE6B3E',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '1px 8px',
                  fontSize: 12,
                }}
              >
                {l.badge}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}
