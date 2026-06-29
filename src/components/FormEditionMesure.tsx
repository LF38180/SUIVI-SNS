'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserOpt = { id: number; nom: string }

type MesureEdit = {
  id: number
  intitule: string
  rubrique: string
  besoins: string
  limites: string
  natureCout: string
  ordreGrandeur: string
  echeanceCible: string // yyyy-mm-dd ou ''
  eluReferentId: number | null
  adjointRattachementId: number | null
  coReferentIds: number[]
  coutPublic: boolean
  limitesPublic: boolean
  situation: string
  situationMotif: string
}

export function FormEditionMesure({ mesure, users }: { mesure: MesureEdit; users: UserOpt[] }) {
  const router = useRouter()
  const [m, setM] = useState(mesure)
  const [msg, setMsg] = useState('')
  const [enCours, setEnCours] = useState(false)

  function set<K extends keyof MesureEdit>(k: K, v: MesureEdit[K]) {
    setM((prev) => ({ ...prev, [k]: v }))
  }

  function toggleCoRef(uid: number) {
    setM((prev) => ({
      ...prev,
      coReferentIds: prev.coReferentIds.includes(uid)
        ? prev.coReferentIds.filter((x) => x !== uid)
        : [...prev.coReferentIds, uid],
    }))
  }

  async function enregistrer() {
    setEnCours(true)
    setMsg('')
    const res = await fetch(`/api/mesures/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intitule: m.intitule,
        rubrique: m.rubrique,
        besoins: m.besoins,
        limites: m.limites,
        natureCout: m.natureCout,
        ordreGrandeur: m.ordreGrandeur,
        echeanceCible: m.echeanceCible || null,
        eluReferentId: m.eluReferentId,
        adjointRattachementId: m.adjointRattachementId,
        coReferentIds: m.coReferentIds,
        coutPublic: m.coutPublic,
        limitesPublic: m.limitesPublic,
        situation: m.situation,
        situationMotif: m.situationMotif,
      }),
    })
    setEnCours(false)
    if (res.ok) {
      setMsg('Enregistré.')
      router.refresh()
    } else {
      setMsg((await res.json()).erreur ?? 'Erreur')
    }
  }

  const input = { width: '100%', padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit' as const, marginTop: 4 }
  const label = { fontSize: 12, fontWeight: 600, color: '#6E6E73', display: 'block', marginTop: 14 }

  return (
    <div className="panel">
      <label style={label}>Intitulé</label>
      <input style={input} value={m.intitule} onChange={(e) => set('intitule', e.target.value)} />

      <label style={label}>Rubrique</label>
      <input style={input} value={m.rubrique} onChange={(e) => set('rubrique', e.target.value)} />

      <label style={label}>Référent principal</label>
      <select style={input} value={m.eluReferentId ?? ''} onChange={(e) => set('eluReferentId', e.target.value ? Number(e.target.value) : null)}>
        <option value="">— aucun —</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.nom}</option>
        ))}
      </select>

      <label style={label}>Adjoint de rattachement</label>
      <select style={input} value={m.adjointRattachementId ?? ''} onChange={(e) => set('adjointRattachementId', e.target.value ? Number(e.target.value) : null)}>
        <option value="">— aucun —</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.nom}</option>
        ))}
      </select>

      <label style={label}>Co-référents (sujets transversaux)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {users.map((u) => {
          const on = m.coReferentIds.includes(u.id)
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggleCoRef(u.id)}
              className={'chip' + (on ? ' on' : '')}
            >
              {u.nom}
            </button>
          )
        })}
      </div>

      <label style={label}>Échéance cible</label>
      <input type="date" style={input} value={m.echeanceCible} onChange={(e) => set('echeanceCible', e.target.value)} />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={label}>Nature du coût</label>
          <input style={input} value={m.natureCout} onChange={(e) => set('natureCout', e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={label}>Ordre de grandeur</label>
          <input style={input} value={m.ordreGrandeur} onChange={(e) => set('ordreGrandeur', e.target.value)} />
        </div>
      </div>

      <label style={label}>Besoins</label>
      <textarea style={{ ...input, minHeight: 70 }} value={m.besoins} onChange={(e) => set('besoins', e.target.value)} />

      <label style={label}>Points de vigilance / limites</label>
      <textarea style={{ ...input, minHeight: 70 }} value={m.limites} onChange={(e) => set('limites', e.target.value)} />

      <label style={label}>Situation (transparence du bilan)</label>
      <select style={input} value={m.situation} onChange={(e) => set('situation', e.target.value)}>
        <option value="NORMALE">Suit son cours</option>
        <option value="REPORTEE">Reportée (échéance révisée)</option>
        <option value="ADAPTEE">Adaptée (mise en œuvre différemment)</option>
        <option value="ABANDONNEE">Abandonnée (avec motif)</option>
      </select>
      {m.situation !== 'NORMALE' && (
        <input
          style={input}
          placeholder="Motif (affiché publiquement, soyez transparent)"
          value={m.situationMotif}
          onChange={(e) => set('situationMotif', e.target.value)}
        />
      )}

      <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 13 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={m.coutPublic} onChange={(e) => set('coutPublic', e.target.checked)} />
          Coût visible en public
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={m.limitesPublic} onChange={(e) => set('limitesPublic', e.target.checked)} />
          Limites visibles en public
        </label>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={enregistrer} disabled={enCours} className="btn primary">
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg === 'Enregistré.' ? '#3A8540' : '#CD5026' }}>{msg}</span>}
      </div>
    </div>
  )
}
