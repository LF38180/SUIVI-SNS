'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Échéances proposées : fin de chaque trimestre, de l'année en cours jusqu'à la fin
// du mandat (2032). Valeur = date ISO (dernier jour du trimestre), libellé = "T1 2027".
function optionsEcheance(): { valeur: string; libelle: string }[] {
  const opts: { valeur: string; libelle: string }[] = []
  const finsTrimestre = [
    { mois: 3, jour: 31, t: 'T1' },
    { mois: 6, jour: 30, t: 'T2' },
    { mois: 9, jour: 30, t: 'T3' },
    { mois: 12, jour: 31, t: 'T4' },
  ]
  for (let annee = 2026; annee <= 2032; annee++) {
    for (const f of finsTrimestre) {
      const mm = String(f.mois).padStart(2, '0')
      const dd = String(f.jour).padStart(2, '0')
      opts.push({ valeur: `${annee}-${mm}-${dd}`, libelle: `${f.t} ${annee}` })
    }
  }
  return opts
}

type Props = {
  mesureId: number
  echeanceInitiale: string | null // yyyy-mm-dd ou null
  besoinsInitial: string | null
  natureCoutInitial: string | null
  ordreGrandeurInitial: string | null
}

const NATURES = ['Temps agent', '€ fonctionnement', '€ investissement', '€ invest. + fonct.', 'À chiffrer', 'Sans coût']
const ORDRES = ['Interne', 'Faible', 'Moyen', 'Élevé', 'À chiffrer']

export function BlocChampsElu({ mesureId, echeanceInitiale, besoinsInitial, natureCoutInitial, ordreGrandeurInitial }: Props) {
  const router = useRouter()
  const [echeance, setEcheance] = useState(echeanceInitiale ?? '')
  const [besoins, setBesoins] = useState(besoinsInitial ?? '')
  const [natureCout, setNatureCout] = useState(natureCoutInitial ?? '')
  const [ordreGrandeur, setOrdreGrandeur] = useState(ordreGrandeurInitial ?? '')
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  const opts = optionsEcheance()
  // si l'échéance actuelle ne tombe pas sur un trimestre, on l'ajoute en tête
  if (echeanceInitiale && !opts.some((o) => o.valeur === echeanceInitiale)) {
    opts.unshift({ valeur: echeanceInitiale, libelle: new Date(echeanceInitiale).toLocaleDateString('fr-FR') })
  }

  async function enregistrer() {
    if (enCours) return
    setEnCours(true)
    setMsg('')
    setOk(false)
    try {
      const res = await fetch(`/api/mesures/${mesureId}/champs-elu`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          echeanceCible: echeance || null,
          besoins,
          natureCout,
          ordreGrandeur,
        }),
      })
      if (res.ok) {
        setOk(true)
        setMsg('Enregistré ✓')
        router.refresh()
      } else {
        setMsg((await res.json().catch(() => ({}))).erreur ?? 'Erreur')
      }
    } catch {
      setMsg('Pas de connexion — réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  const champ = { width: '100%', padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit' as const, fontSize: 16, marginTop: 4 }
  const label = { fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '.4px', color: '#6E6E73', fontWeight: 600 }

  return (
    <div>
      <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 12 }}>
        Vous êtes en charge de cette mesure : vous pouvez ajuster son cadre. Ces
        changements sont appliqués directement et notés dans le journal de bord.
      </div>

      <label style={label} htmlFor="ech">Échéance cible</label>
      <select id="ech" value={echeance} onChange={(e) => setEcheance(e.target.value)} style={champ}>
        <option value="">Non définie</option>
        {opts.map((o) => (
          <option key={o.valeur} value={o.valeur}>{o.libelle}</option>
        ))}
      </select>

      <div style={{ marginTop: 14 }}>
        <label style={label} htmlFor="bes">Besoins (ce qu’il faut pour avancer)</label>
        <textarea id="bes" value={besoins} onChange={(e) => setBesoins(e.target.value)} rows={2} placeholder="Moyens, arbitrage, partenaire…" style={champ} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={label} htmlFor="nat">Nature du coût</label>
          <select id="nat" value={natureCout} onChange={(e) => setNatureCout(e.target.value)} style={champ}>
            <option value="">—</option>
            {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={label} htmlFor="ord">Ordre de grandeur</label>
          <select id="ord" value={ordreGrandeur} onChange={(e) => setOrdreGrandeur(e.target.value)} style={champ}>
            <option value="">—</option>
            {ORDRES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <button onClick={enregistrer} disabled={enCours} className="btn primary" style={{ marginTop: 16, minHeight: 48, opacity: enCours ? 0.6 : 1 }}>
        {enCours ? 'Enregistrement…' : 'Enregistrer le cadre'}
      </button>
      {msg && <div role="status" style={{ marginTop: 10, fontSize: 14, color: ok ? '#2E6B33' : '#C0461F' }}>{msg}</div>}
    </div>
  )
}
