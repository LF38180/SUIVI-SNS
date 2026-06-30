'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Notif = { id: number; message: string; lien: string | null; lue: boolean; creeeLe: string }

export function Cloche() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [nonLues, setNonLues] = useState(0)
  const [ouvert, setOuvert] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  async function charger() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const d = await res.json()
        setNotifs(d.notifs)
        setNonLues(d.nonLues)
      }
    } catch {
      /* silencieux */
    }
  }

  useEffect(() => {
    charger()
    // rafraîchit toutes les 5 min, et seulement si l'onglet est visible
    // (évite des requêtes inutiles en continu → moins de charge serveur/coût)
    const t = setInterval(() => {
      if (!document.hidden) charger()
    }, 300000)
    // recharge aussi quand l'utilisateur revient sur l'onglet
    function onVisible() {
      if (!document.hidden) charger()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // fermer au clic extérieur
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function ouvrir() {
    const v = !ouvert
    setOuvert(v)
    if (v && nonLues > 0) {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNonLues(0)
      setNotifs((prev) => prev.map((n) => ({ ...n, lue: true })))
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={ouvrir}
        aria-label={`Notifications${nonLues > 0 ? ` (${nonLues} non lues)` : ''}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, position: 'relative', padding: 4 }}
      >
        🔔
        {nonLues > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: '#EE6B3E',
              color: '#fff',
              borderRadius: 10,
              padding: '0 5px',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: '16px',
              minWidth: 16,
              textAlign: 'center',
            }}
          >
            {nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          style={{
            position: 'fixed',
            right: 8,
            left: 8,
            top: 56,
            maxWidth: 360,
            marginLeft: 'auto',
            maxHeight: '70vh',
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ECE5DF',
            borderRadius: 12,
            boxShadow: '0 6px 26px rgba(35,35,38,.12)',
            zIndex: 100,
          }}
        >
          <div style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #ECE5DF' }}>
            Notifications
          </div>
          {notifs.length === 0 && (
            <div style={{ padding: 20, color: '#6E6E73', fontSize: 13, textAlign: 'center' }}>Aucune notification.</div>
          )}
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.lien) {
                  setOuvert(false)
                  router.push(n.lien)
                }
              }}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #F3EEE9',
                fontSize: 13,
                cursor: n.lien ? 'pointer' : 'default',
                background: n.lue ? '#fff' : '#FCE9E1',
              }}
            >
              <div>{n.message}</div>
              <div style={{ color: '#9A9AA0', fontSize: 11, marginTop: 2 }}>
                {new Date(n.creeeLe).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
