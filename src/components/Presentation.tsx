'use client'
import { useState, useEffect } from 'react'
import { Jauge } from './Jauge'
import { Barre } from './Barre'

export type AxeSlide = { axe: string; nom: string; pourcent: number; nb: number; realisees: number }

export function Presentation({ global, total, axes }: { global: number; total: number; axes: AxeSlide[] }) {
  const slides = [{ type: 'global' as const }, ...axes.map((a) => ({ type: 'axe' as const, a }))]
  const [i, setI] = useState(0)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') setI((x) => Math.min(slides.length - 1, x + 1))
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  const s = slides[i]

  return (
    <div
      style={{ minHeight: '100dvh', background: '#FAF7F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}
      onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))}
    >
      <div style={{ position: 'fixed', top: 20, left: 24, fontWeight: 800, fontSize: 22, color: '#EE6B3E' }}>
        Seyssins<span style={{ color: '#6E6E73', fontWeight: 400 }}> Nature&amp;Solidaire</span>
      </div>

      {s.type === 'global' ? (
        <>
          <Jauge pourcent={global} taille={260} />
          <div style={{ fontSize: 40, fontWeight: 800, marginTop: 24, color: '#232326' }}>Avancement du programme</div>
          <div style={{ fontSize: 22, color: '#6E6E73', marginTop: 8 }}>{total} engagements suivis</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#C0461F', letterSpacing: 1 }}>{s.a.axe.replace('_', ' ')}</div>
          <div style={{ fontSize: 38, fontWeight: 800, margin: '12px 0 24px', color: '#232326', maxWidth: 900 }}>{s.a.nom}</div>
          <div style={{ fontSize: 80, fontWeight: 800, color: '#EE6B3E' }}>{s.a.pourcent}%</div>
          <div style={{ width: 'min(700px, 80vw)', marginTop: 20 }}>
            <Barre pourcent={s.a.pourcent} />
          </div>
          <div style={{ fontSize: 20, color: '#6E6E73', marginTop: 16 }}>
            {s.a.nb} engagements · {s.a.realisees} réalisé{s.a.realisees > 1 ? 's' : ''}
          </div>
        </>
      )}

      <div style={{ position: 'fixed', bottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        {slides.map((_, k) => (
          <span key={k} style={{ width: 10, height: 10, borderRadius: '50%', background: k === i ? '#EE6B3E' : '#DCD3CC' }} />
        ))}
      </div>
      <div style={{ position: 'fixed', bottom: 24, right: 24, fontSize: 12, color: '#9A9AA0' }}>← → ou clic pour naviguer</div>
    </div>
  )
}
