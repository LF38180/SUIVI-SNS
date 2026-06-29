'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Compression image via <img> + canvas (compatible iOS/HEIC que Safari sait afficher),
// fallback fichier brut. Évite l'échec silencieux de createImageBitmap sur HEIC.
function lireFichier(file: File): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader()
    r.onload = () => ok(r.result as string)
    r.onerror = ko
    r.readAsDataURL(file)
  })
}
function chargerImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = ko
    i.src = dataUrl
  })
}
async function compresser(file: File, maxLargeur = 1280, qualite = 0.7): Promise<string> {
  const brut = await lireFichier(file)
  if (!file.type.startsWith('image/')) return brut // documents : tels quels
  try {
    const img = await chargerImage(brut)
    const ratio = img.naturalWidth > maxLargeur ? maxLargeur / img.naturalWidth : 1
    const w = Math.round(img.naturalWidth * ratio)
    const h = Math.round(img.naturalHeight * ratio)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    c.getContext('2d')!.drawImage(img, 0, 0, w, h)
    return c.toDataURL('image/jpeg', qualite)
  } catch {
    return brut // fallback : l'upload réussit quand même
  }
}

export function FormPieceJointe({ mesureId }: { mesureId: number }) {
  const router = useRouter()
  const [mode, setMode] = useState<'fichier' | 'lien'>('fichier')
  const [legende, setLegende] = useState('')
  const [url, setUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function envoyerFichier(file: File) {
    setEnCours(true)
    setMsg('')
    try {
      const contenu = await compresser(file)
      const type = file.type.startsWith('image/') ? 'PHOTO' : 'DOCUMENT'
      const res = await fetch('/api/pieces-jointes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesureId, type, contenu, nomFichier: file.name, mimeType: file.type, legende }),
      })
      if (res.ok) {
        setMsg('Fichier ajouté.')
        setLegende('')
        router.refresh()
      } else {
        setMsg((await res.json()).erreur ?? 'Erreur')
      }
    } catch {
      setMsg('Échec de la lecture du fichier.')
    } finally {
      setEnCours(false)
    }
  }

  async function envoyerLien() {
    if (!url) {
      setMsg('URL requise.')
      return
    }
    setEnCours(true)
    setMsg('')
    const res = await fetch('/api/pieces-jointes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesureId, type: 'LIEN', url, legende }),
    })
    setEnCours(false)
    if (res.ok) {
      setMsg('Lien ajouté.')
      setUrl('')
      setLegende('')
      router.refresh()
    } else {
      setMsg((await res.json()).erreur ?? 'Erreur')
    }
  }

  const input = { width: '100%', padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit' as const, marginTop: 8 }

  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h2>Ajouter une pièce jointe</h2>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="button" className={'chip' + (mode === 'fichier' ? ' on' : '')} onClick={() => setMode('fichier')}>
          Photo / Document
        </button>
        <button type="button" className={'chip' + (mode === 'lien' ? ' on' : '')} onClick={() => setMode('lien')}>
          Lien
        </button>
      </div>

      <input placeholder="Légende (optionnel)" value={legende} onChange={(e) => setLegende(e.target.value)} style={input} />

      {mode === 'fichier' ? (
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          disabled={enCours}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) envoyerFichier(f)
          }}
          style={{ ...input, padding: 8 }}
        />
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} style={{ ...input, marginTop: 0, flex: 1 }} />
          <button onClick={envoyerLien} disabled={enCours} className="btn primary">
            Ajouter
          </button>
        </div>
      )}

      {enCours && <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 8 }}>Envoi en cours…</div>}
      {msg && <div role="status" style={{ fontSize: 13, color: msg.includes('ajouté') ? '#3A8540' : '#CD5026', marginTop: 8 }}>{msg}</div>}
    </div>
  )
}
