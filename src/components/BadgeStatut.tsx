import { statutDe } from '@/lib/statut'

export function BadgeStatut({ avancement }: { avancement: number }) {
  const s = statutDe(avancement)
  // Fond = version foncée (couleurTexte) pour un contraste ≥ 4.5:1 avec le texte blanc.
  return (
    <span className="badge" style={{ background: s.couleurTexte }} aria-label={`Statut : ${s.nom}`}>
      <span aria-hidden="true" style={{ marginRight: 4 }}>
        {s.icone}
      </span>
      {s.nom}
    </span>
  )
}
