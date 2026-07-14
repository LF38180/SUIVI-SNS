'use client'
import { useState } from 'react'

// Boutons de communication pour une mesure :
//  - Télécharger l'image chartée (carré 1080×1080, générée par l'API)
//  - Partager (feuille de partage native mobile si dispo, sinon liens réseaux)
// Aucune publication automatique : l'utilisateur poste lui-même (impossible et
// non souhaitable de publier sans les API officielles des réseaux).
export function BoutonsPartage({
  mesureId,
  intitule,
  avancement,
  urlPublique,
}: {
  mesureId: number
  intitule: string
  avancement: number
  urlPublique: string
}) {
  const [menu, setMenu] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const imageUrl = `/api/mesures/${mesureId}/image-partage`
  const texte = `${intitule} — ${avancement}% · Suivi du programme Seyssins Nature & Solidaire`

  async function telecharger() {
    setEnCours(true)
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sns-mesure-${mesureId}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      /* si échec, l'utilisateur peut ouvrir l'image directement */
      window.open(imageUrl, '_blank')
    } finally {
      setEnCours(false)
    }
  }

  async function partager() {
    // 1) Partage natif mobile avec l'image, si le navigateur le permet.
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const fichier = new File([blob], `sns-mesure-${mesureId}.png`, { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
      if (nav.share && nav.canShare && nav.canShare({ files: [fichier] })) {
        await nav.share({ title: 'Seyssins Nature & Solidaire', text: texte, url: urlPublique, files: [fichier] })
        return
      }
      // 2) Partage natif sans l'image (texte + lien)
      if (nav.share) {
        await nav.share({ title: 'Seyssins Nature & Solidaire', text: texte, url: urlPublique })
        return
      }
    } catch {
      // l'utilisateur a annulé, ou pas de partage natif → on ouvre le menu réseaux
    }
    setMenu((v) => !v)
  }

  const lien = encodeURIComponent(urlPublique)
  const txt = encodeURIComponent(texte)
  const reseaux = [
    { nom: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${lien}` },
    { nom: 'X (Twitter)', url: `https://twitter.com/intent/tweet?text=${txt}&url=${lien}` },
    { nom: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${lien}` },
    { nom: 'WhatsApp', url: `https://wa.me/?text=${txt}%20${lien}` },
  ]

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={telecharger} disabled={enCours} className="btn" style={{ minHeight: 44 }}>
          {enCours ? '…' : '📥 Télécharger l’image'}
        </button>
        <button onClick={partager} className="btn primary" style={{ minHeight: 44 }}>
          ↗ Partager
        </button>
      </div>

      {menu && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {reseaux.map((r) => (
            <a key={r.nom} href={r.url} target="_blank" rel="noopener noreferrer" className="btn" style={{ minHeight: 40, textDecoration: 'none' }}>
              {r.nom}
            </a>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#9A9AA0', marginTop: 6 }}>
        L’image et le texte sont préparés ; vous validez la publication vous-même.
      </div>
    </div>
  )
}
