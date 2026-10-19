import { EnTete } from '@/components/EnTete'
import { exigerMoyensGenerauxPage } from '@/lib/moyens-generaux'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AccueilMoyensGeneraux() {
  await exigerMoyensGenerauxPage() // notFound() si non autorisé

  const carte = {
    background: '#fff',
    border: '1px solid #ECE5DF',
    borderRadius: 14,
    padding: '20px 22px',
    textDecoration: 'none',
    color: 'inherit' as const,
    display: 'block',
  }
  const sousTexte = { fontSize: 13, color: '#6E6E73', marginTop: 4 }

  return (
    <>
      <EnTete titre="Moyens Généraux" sousTitre="Outils internes du pôle. Accès réservé." />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          <a href="/moyens-generaux/simulateur" style={carte}>
            <b>📊 Simulateur de prospective</b>
            <div style={sousTexte}>Prospective financière 2026-2033 : scénarios, PPI, arbitrages. Tout s’enregistre automatiquement.</div>
          </a>
        </div>
        <p style={{ fontSize: 12, color: '#9A9AA0', marginTop: 20 }}>
          Vos essais sont enregistrés dans votre exemplaire personnel. Seul l’administrateur publie la référence commune.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/" style={{ color: '#C0461F', fontWeight: 600, fontSize: 14 }}>← Retour au tableau de bord</Link>
        </div>
      </div>
    </>
  )
}
