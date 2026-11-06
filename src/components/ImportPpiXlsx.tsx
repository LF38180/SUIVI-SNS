'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Bouton d'import du PPI au format Excel (.xlsx), réservé à l'admin. Convertit
// côté serveur et met à jour la référence ppi-donnees. Le simulateur lira la
// nouvelle version sans manipulation supplémentaire.
export function ImportPpiXlsx() {
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function envoyer(file: File) {
    setEnCours(true); setMsg(''); setOk(false)
    try {
      const fd = new FormData()
      fd.append('fichier', file)
      const res = await fetch('/api/moyens-generaux/simulateur/import-xlsx', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setOk(true)
        const alerte = d.anomalies > 0 ? ` ⚠ ${d.anomalies} montant(s) non lisible(s) (cellule texte ou erreur Excel) comptés à 0, à vérifier.` : ''
        setMsg(`PPI mis à jour (${d.lignes} dépenses · ${d.ajoutees} nouvelle(s) · ${d.disparues} disparue(s)).${alerte} Rouvrez le simulateur pour voir les changements.`)
        router.refresh()
      } else {
        setMsg(d.erreur ?? 'Import impossible.')
      }
    } catch {
      setMsg('Pas de connexion — réessayez.')
    } finally {
      setEnCours(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div style={{ marginTop: 18, padding: '14px 16px', background: '#fff', border: '1px solid #ECE5DF', borderRadius: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>Mettre à jour le PPI (fichier Excel)</div>
      <div style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 4 }}>
        Chargez le classeur de la DRF (.xlsx). L’app lit la feuille « PPI COMMUNE » et met à jour la donnée de référence. Réservé à l’administrateur.
      </div>
      <input
        ref={ref}
        type="file"
        accept=".xlsx"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) envoyer(f) }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={enCours}
        className="btn primary"
        style={{ marginTop: 12, minHeight: 44, opacity: enCours ? 0.6 : 1 }}
      >
        {enCours ? 'Import en cours…' : '📄 Importer un .xlsx'}
      </button>
      {msg && <div role="status" style={{ marginTop: 10, fontSize: 13, color: ok ? '#2E6B33' : '#C0461F' }}>{msg}</div>}
    </div>
  )
}
