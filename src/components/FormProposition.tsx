'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Barre } from './Barre'

const PALIERS = [0, 25, 50, 75, 100]

export function FormProposition({ mesureId, avancementActuel }: { mesureId: number; avancementActuel: number }) {
  const cleBrouillon = `sns-draft-${mesureId}`
  const [av, setAv] = useState(avancementActuel)
  const [commentaire, setCommentaire] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [brouillonRestaure, setBrouillonRestaure] = useState(false)
  const router = useRouter()

  // Restaure un brouillon non envoyé (réseau coupé sur le terrain, page rechargée…)
  useEffect(() => {
    try {
      const brut = localStorage.getItem(cleBrouillon)
      if (brut) {
        const d = JSON.parse(brut)
        if (typeof d.av === 'number') setAv(d.av)
        if (typeof d.commentaire === 'string') setCommentaire(d.commentaire)
        setBrouillonRestaure(true)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sauvegarde le brouillon à chaque changement (sauf valeur initiale vide)
  useEffect(() => {
    try {
      if (commentaire || av !== avancementActuel) {
        localStorage.setItem(cleBrouillon, JSON.stringify({ av, commentaire }))
      }
    } catch {
      /* ignore */
    }
  }, [av, commentaire, avancementActuel, cleBrouillon])

  function borne(v: number) {
    return Math.max(0, Math.min(100, v))
  }

  async function envoyer() {
    if (enCours) return
    setEnCours(true)
    setMsg('')
    setOk(false)
    try {
      const res = await fetch('/api/propositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesureId, avancementPropose: av, commentaire }),
      })
      if (res.ok) {
        setOk(true)
        setMsg('Proposition envoyée ✓ Elle est en attente de validation par un administrateur.')
        setCommentaire('')
        setBrouillonRestaure(false)
        try {
          localStorage.removeItem(cleBrouillon)
        } catch {
          /* ignore */
        }
        router.refresh()
      } else {
        setMsg((await res.json()).erreur ?? 'Erreur')
      }
    } catch {
      setMsg('Pas de réseau — votre saisie est gardée sur cet appareil. Réessayez quand vous aurez du signal.')
    } finally {
      setEnCours(false)
    }
  }

  const boutonPalier = (actif: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: 56,
    minHeight: 44,
    borderRadius: 10,
    border: actif ? '2px solid #EE6B3E' : '1px solid #ECE5DF',
    background: actif ? '#FCE9E1' : '#fff',
    color: actif ? '#C0461F' : '#232326',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  })

  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h2>Où en est cette mesure ?</h2>
      {brouillonRestaure && (
        <div style={{ fontSize: 12, color: '#8A5E0F', background: '#FAF7F4', borderRadius: 8, padding: '6px 10px', marginTop: 6 }}>
          Brouillon restauré (saisie non envoyée).
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span>Avancement proposé</span>
        <b style={{ fontSize: 18, color: '#C0461F' }}>{av}%</b>
      </div>
      <Barre pourcent={av} />

      {/* Gros boutons paliers (faciles au doigt) */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {PALIERS.map((p) => (
          <button key={p} type="button" onClick={() => setAv(p)} style={boutonPalier(av === p)}>
            {p}%
          </button>
        ))}
      </div>

      {/* Réglage fin -5 / +5 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => setAv(borne(av - 5))} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, border: '1px solid #ECE5DF', background: '#fff', fontSize: 18, cursor: 'pointer' }} aria-label="Diminuer de 5">
          −5
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={av}
          onChange={(e) => setAv(borne(parseInt(e.target.value || '0', 10)))}
          style={{ flex: 1, minHeight: 44, padding: '0 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit', fontSize: 16, textAlign: 'center' }}
          aria-label="Avancement en pourcentage"
        />
        <button type="button" onClick={() => setAv(borne(av + 5))} style={{ minWidth: 44, minHeight: 44, borderRadius: 10, border: '1px solid #ECE5DF', background: '#fff', fontSize: 18, cursor: 'pointer' }} aria-label="Augmenter de 5">
          +5
        </button>
      </div>

      <textarea
        placeholder="Un mot sur ce qui a avancé (facultatif)"
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        rows={3}
        style={{ width: '100%', marginTop: 12, padding: 12, border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit', fontSize: 16 }}
      />
      <button onClick={envoyer} disabled={enCours} className="btn primary" style={{ marginTop: 10, minHeight: 48, fontSize: 15, opacity: enCours ? 0.6 : 1 }}>
        {enCours ? 'Envoi en cours…' : 'Envoyer ma proposition'}
      </button>
      {msg && (
        <div role="status" style={{ marginTop: 10, fontSize: 14, color: ok ? '#2E6B33' : '#C0461F' }}>
          {msg}
        </div>
      )}
    </div>
  )
}
