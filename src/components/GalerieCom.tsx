'use client'
import { useState } from 'react'

type Vignette = { cle: string; titre: string; sousTitre: string; url: string; fichier: string }

async function telechargerImage(url: string, fichier: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fichier
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

export function GalerieCom({ vignettes }: { vignettes: Vignette[] }) {
  const [enCours, setEnCours] = useState<string | null>(null)
  const [tout, setTout] = useState(false)

  async function une(v: Vignette) {
    setEnCours(v.cle)
    try {
      await telechargerImage(v.url, v.fichier)
    } finally {
      setEnCours(null)
    }
  }

  async function toutes() {
    setTout(true)
    try {
      // séquentiel : évite que le navigateur bloque une rafale de téléchargements
      for (const v of vignettes) {
        await telechargerImage(v.url, v.fichier)
        await new Promise((r) => setTimeout(r, 400))
      }
    } finally {
      setTout(false)
    }
  }

  return (
    <div>
      <button onClick={toutes} disabled={tout} className="btn primary" style={{ minHeight: 46, marginBottom: 18, opacity: tout ? 0.6 : 1 }}>
        {tout ? 'Téléchargement…' : `📥 Tout télécharger (${vignettes.length} vignettes)`}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 18 }}>
        {vignettes.map((v) => (
          <div key={v.cle} style={{ background: '#fff', border: '1px solid #ECE5DF', borderRadius: 14, overflow: 'hidden' }}>
            {/* aperçu de l'image (carré) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.url} alt={v.titre} loading="lazy" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', background: '#FAF7F4' }} />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, minHeight: 34 }}>{v.titre}</div>
              <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 2 }}>{v.sousTitre}</div>
              <button onClick={() => une(v)} disabled={enCours === v.cle} className="btn" style={{ marginTop: 10, width: '100%', minHeight: 42 }}>
                {enCours === v.cle ? '…' : '📥 Télécharger'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
