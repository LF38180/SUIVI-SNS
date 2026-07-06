'use client'
import { useState } from 'react'
import { Barre } from './Barre'

const PALIERS = [0, 25, 50, 75, 100]

// Version DÉMO du bloc de mise à jour : entièrement fonctionnelle visuellement
// (on peut cliquer les paliers, saisir un mot, « envoyer »), mais n'écrit RIEN.
// Sert uniquement à montrer le geste de mise à jour en réunion.
export function BlocMiseAJourDemo({ avancementActuel }: { avancementActuel: number }) {
  const [av, setAv] = useState(avancementActuel)
  const [commentaire, setCommentaire] = useState('')
  const [msg, setMsg] = useState('')

  function borne(v: number) {
    return Math.max(0, Math.min(100, v))
  }

  function envoyer() {
    setMsg('Envoyé ✓ (démonstration — rien n’est enregistré). Dans la vraie application, un administrateur validerait cette mise à jour.')
  }

  const boutonPalier = (actif: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: 56,
    minHeight: 48,
    borderRadius: 10,
    border: actif ? '2px solid #EE6B3E' : '1px solid #ECE5DF',
    background: actif ? '#FCE9E1' : '#fff',
    color: actif ? '#C0461F' : '#232326',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  })
  const btnRond = { minWidth: 48, minHeight: 48, borderRadius: 10, border: '1px solid #ECE5DF', background: '#fff', fontSize: 18, cursor: 'pointer' }

  return (
    <div className="panel" style={{ marginTop: 18, border: '2px solid #FCE9E1' }}>
      <h2 style={{ color: '#C0461F', fontSize: 15 }}>Mettre à jour cette mesure</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span>Où en est-elle ?</span>
        <b style={{ fontSize: 18, color: '#C0461F' }}>{av}%</b>
      </div>
      <Barre pourcent={av} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {PALIERS.map((p) => (
          <button key={p} type="button" onClick={() => setAv(p)} style={boutonPalier(av === p)}>
            {p}%
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}>
        <button type="button" onClick={() => setAv(borne(av - 5))} style={btnRond} aria-label="Diminuer de 5">−5</button>
        <span style={{ minWidth: 60, textAlign: 'center', fontWeight: 700 }}>{av}%</span>
        <button type="button" onClick={() => setAv(borne(av + 5))} style={btnRond} aria-label="Augmenter de 5">+5</button>
      </div>

      <label htmlFor="motelu" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6E6E73', marginTop: 16 }}>
        Le mot de l’élu (facultatif)
      </label>
      <textarea
        id="motelu"
        placeholder="Ce qui a avancé, la prochaine étape…"
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        rows={2}
        style={{ width: '100%', marginTop: 4, padding: 12, border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit', fontSize: 16 }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" className="btn" style={{ minHeight: 48, flex: 1, minWidth: 140, fontSize: 14 }}>📷 Prendre une photo</button>
        <button type="button" className="btn" style={{ minHeight: 48, flex: 1, minWidth: 140, fontSize: 14 }}>🖼️ Choisir des photos</button>
      </div>

      <button onClick={envoyer} className="btn primary" style={{ marginTop: 16, minHeight: 50, fontSize: 16, width: '100%' }}>
        Envoyer ma mise à jour
      </button>
      {msg && <div role="status" style={{ marginTop: 10, fontSize: 14, color: '#2E6B33' }}>{msg}</div>}
    </div>
  )
}
