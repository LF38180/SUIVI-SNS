'use client'
import { useState } from 'react'

// Section repliable (accordéon). Permet de masquer par défaut les détails
// consultatifs (journal, historique, coûts) pour ne pas noyer l'essentiel.
export function Section({ titre, children, ouvertParDefaut = false }: { titre: string; children: React.ReactNode; ouvertParDefaut?: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        style={{ width: '100%', minHeight: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 0', font: 'inherit' }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#5a5a5f' }}>{titre}</span>
        <span style={{ color: '#C0461F', fontSize: 24, lineHeight: 1 }}>{ouvert ? '−' : '+'}</span>
      </button>
      {ouvert && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  )
}
