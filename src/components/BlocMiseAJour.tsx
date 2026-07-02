'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Barre } from './Barre'

const PALIERS = [0, 25, 50, 75, 100]

// Compression image (canvas, compatible HEIC iPhone) vers ~600 Ko.
function lireFichier(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader()
    r.onload = () => ok(r.result as string)
    r.onerror = ko
    r.readAsDataURL(f)
  })
}
function chargerImage(d: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = ko
    i.src = d
  })
}
async function compresser(file: File): Promise<string> {
  const brut = await lireFichier(file)
  if (!file.type.startsWith('image/')) return brut
  try {
    const img = await chargerImage(brut)
    for (const [maxL, q] of [[1280, 0.7], [1024, 0.6], [800, 0.55]] as const) {
      const ratio = img.naturalWidth > maxL ? maxL / img.naturalWidth : 1
      const w = Math.round(img.naturalWidth * ratio)
      const h = Math.round(img.naturalHeight * ratio)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const out = c.toDataURL('image/jpeg', q)
      if (out.length <= 800_000) return out
    }
    return brut
  } catch {
    return brut
  }
}

type PhotoEnAttente = { contenu: string; nom: string; mime: string }

export function BlocMiseAJour({ mesureId, avancementActuel }: { mesureId: number; avancementActuel: number }) {
  const cleBrouillon = `sns-draft-${mesureId}`
  const [av, setAv] = useState(avancementActuel)
  const [commentaire, setCommentaire] = useState('')
  const [photos, setPhotos] = useState<PhotoEnAttente[]>([])
  const [brouillonRestaure, setBrouillonRestaure] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const router = useRouter()
  const refCamera = useRef<HTMLInputElement>(null)
  const refGalerie = useRef<HTMLInputElement>(null)
  // valeur d'avancement déjà envoyée avec succès : évite de « ressusciter » un
  // brouillon juste après un envoi (l'avancement publié ne change qu'à la validation admin).
  const refEnvoye = useRef<number | null>(null)

  // Restaure un brouillon (% + commentaire ; les photos ne sont pas persistées)
  useEffect(() => {
    try {
      const brut = localStorage.getItem(cleBrouillon)
      if (brut) {
        const d = JSON.parse(brut)
        if (typeof d.av === 'number') setAv(d.av)
        if (typeof d.commentaire === 'string') setCommentaire(d.commentaire)
        if (d.av !== avancementActuel || d.commentaire) setBrouillonRestaure(true)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      // On ne sauvegarde un brouillon que s'il y a réellement une saisie NON envoyée.
      // La condition `av !== refEnvoye.current` empêche de réécrire le brouillon juste
      // après un envoi réussi (sinon un faux « brouillon restauré » réapparaîtrait).
      const aSauvegarder = commentaire || (av !== avancementActuel && av !== refEnvoye.current)
      if (aSauvegarder) {
        localStorage.setItem(cleBrouillon, JSON.stringify({ av, commentaire }))
      } else {
        localStorage.removeItem(cleBrouillon)
      }
    } catch {
      /* ignore */
    }
  }, [av, commentaire, avancementActuel, cleBrouillon])

  function borne(v: number) {
    return Math.max(0, Math.min(100, v))
  }

  // Toute nouvelle saisie annule le « déjà envoyé » : le brouillon redevient légitime.
  function majAv(v: number) {
    refEnvoye.current = null
    setAv(v)
  }
  function majCommentaire(v: string) {
    refEnvoye.current = null
    setCommentaire(v)
  }

  const [prepaPhotos, setPrepaPhotos] = useState(false)
  async function ajouterPhotos(files: FileList | null) {
    if (!files || prepaPhotos) return
    setPrepaPhotos(true)
    try {
      const nouvelles: PhotoEnAttente[] = []
      for (const f of Array.from(files)) {
        const contenu = await compresser(f)
        // Garde-fou : si la compression a échoué (fichier brut trop lourd), on refuse
        // proprement côté client au lieu d'envoyer un fichier voué au rejet serveur (413).
        if (contenu.length > 3_000_000) {
          setMsg(`« ${f.name} » est trop lourde même après compression. Reprenez-la depuis l’appareil photo ou choisissez-en une plus légère.`)
          continue
        }
        const estImage = contenu.startsWith('data:image/')
        nouvelles.push({ contenu, nom: f.name, mime: estImage ? 'image/jpeg' : f.type })
      }
      if (nouvelles.length) setPhotos((p) => [...p, ...nouvelles])
    } finally {
      setPrepaPhotos(false)
    }
  }

  const avChange = av !== avancementActuel
  const rienAEnvoyer = !avChange && !commentaire.trim() && photos.length === 0

  // mémorise ce qui a déjà réussi pour qu'un retry (après échec partiel) ne recrée pas
  // de doublons : la proposition n'est postée qu'une fois, les photos envoyées sont retirées.
  const refPropEnvoyee = useRef(false)

  async function envoyer() {
    if (enCours || rienAEnvoyer) return
    setEnCours(true)
    setMsg('')
    setOk(false)
    try {
      // 1) avancement + commentaire (une seule fois, même en cas de retry)
      if ((avChange || commentaire.trim()) && !refPropEnvoyee.current) {
        const res = await fetch('/api/propositions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mesureId, avancementPropose: av, commentaire }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).erreur ?? 'ERREUR_SERVEUR')
        refPropEnvoyee.current = true
      }
      // 2) photos : on retire chaque photo du state dès qu'elle est acceptée,
      //    ainsi un retry (après échec réseau en cours de boucle) ne renvoie que
      //    celles qui restent — pas de doublon.
      const restantes = [...photos]
      while (restantes.length > 0) {
        const ph = restantes[0]
        const res = await fetch('/api/pieces-jointes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mesureId, type: 'PHOTO', contenu: ph.contenu, nomFichier: ph.nom, mimeType: ph.mime }),
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).erreur ?? 'ERREUR_SERVEUR')
        restantes.shift()
        setPhotos([...restantes])
      }
      // succès total
      refEnvoye.current = av
      refPropEnvoyee.current = false
      setOk(true)
      setMsg('Envoyé ✓ Votre mise à jour (avancement et/ou photo) est en attente de validation par un administrateur.')
      setCommentaire('')
      setPhotos([])
      setBrouillonRestaure(false)
      try {
        localStorage.removeItem(cleBrouillon)
      } catch {
        /* ignore */
      }
      router.refresh()
    } catch (e) {
      // Vraie coupure réseau = TypeError (fetch rejette). Sinon message serveur.
      if (e instanceof TypeError) {
        setMsg('Pas de connexion — votre % et votre commentaire sont gardés sur cet appareil (pas les photos). Réessayez avec du signal, sans risque de doublon.')
      } else if (e instanceof Error && e.message && e.message !== 'ERREUR_SERVEUR') {
        setMsg(e.message)
      } else {
        setMsg('Une erreur est survenue. Réessayez ; ce qui a déjà été envoyé ne sera pas dupliqué.')
      }
    } finally {
      setEnCours(false)
    }
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
    <div className="panel" id="mise-a-jour" style={{ marginTop: 18, scrollMarginTop: 80, border: '2px solid #FCE9E1' }}>
      <h2 style={{ color: '#C0461F', fontSize: 15 }}>Mettre à jour cette mesure</h2>
      {brouillonRestaure && (
        <div style={{ fontSize: 12, color: '#8A5E0F', background: '#FAF7F4', borderRadius: 8, padding: '6px 10px', marginTop: 6 }}>
          Brouillon non envoyé restauré — pensez à cliquer « Envoyer ».
        </div>
      )}

      {/* Avancement */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span>Où en est-elle ?</span>
        <b style={{ fontSize: 18, color: '#C0461F' }}>{av}%</b>
      </div>
      <Barre pourcent={av} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {PALIERS.map((p) => (
          <button key={p} type="button" onClick={() => majAv(p)} style={boutonPalier(av === p)}>
            {p}%
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}>
        <button type="button" onClick={() => majAv(borne(av - 5))} style={btnRond} aria-label="Diminuer de 5">−5</button>
        <span style={{ minWidth: 60, textAlign: 'center', fontWeight: 700 }}>{av}%</span>
        <button type="button" onClick={() => majAv(borne(av + 5))} style={btnRond} aria-label="Augmenter de 5">+5</button>
      </div>

      {/* Mot de l'élu */}
      <label htmlFor="motelu" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6E6E73', marginTop: 16 }}>
        Le mot de l’élu (facultatif)
      </label>
      <textarea
        id="motelu"
        placeholder="Ce qui a avancé, la prochaine étape…"
        value={commentaire}
        onChange={(e) => majCommentaire(e.target.value)}
        rows={2}
        style={{ width: '100%', marginTop: 4, padding: 12, border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit', fontSize: 16 }}
      />

      {/* Photos */}
      <input
        ref={refCamera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          ajouterPhotos(e.target.files)
          e.target.value = '' // permet de re-sélectionner le même fichier
        }}
      />
      <input
        ref={refGalerie}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          ajouterPhotos(e.target.files)
          e.target.value = ''
        }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" onClick={() => refCamera.current?.click()} disabled={prepaPhotos} className="btn" style={{ minHeight: 48, flex: 1, minWidth: 140, fontSize: 14 }}>
          📷 Prendre une photo
        </button>
        <button type="button" onClick={() => refGalerie.current?.click()} disabled={prepaPhotos} className="btn" style={{ minHeight: 48, flex: 1, minWidth: 140, fontSize: 14 }}>
          🖼️ Choisir des photos
        </button>
      </div>
      {prepaPhotos && (
        <div role="status" style={{ marginTop: 8, fontSize: 13, color: '#6E6E73' }}>
          Préparation des photos…
        </div>
      )}
      {photos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {photos.map((ph, i) => (
            <div key={i} style={{ position: 'relative', width: 80 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.contenu} alt="à envoyer" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ECE5DF' }} />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                aria-label="Retirer cette photo"
                style={{ position: 'absolute', top: -10, right: -10, width: 32, height: 32, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ background: '#C0461F', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Envoi unique */}
      <button
        onClick={envoyer}
        disabled={enCours || rienAEnvoyer}
        className="btn primary"
        style={{ marginTop: 16, minHeight: 50, fontSize: 16, width: '100%', opacity: enCours || rienAEnvoyer ? 0.6 : 1 }}
      >
        {enCours ? 'Envoi en cours…' : 'Envoyer ma mise à jour'}
      </button>
      {msg && (
        <div role="status" style={{ marginTop: 10, fontSize: 14, color: ok ? '#2E6B33' : '#C0461F' }}>
          {msg}
        </div>
      )}
    </div>
  )
}
