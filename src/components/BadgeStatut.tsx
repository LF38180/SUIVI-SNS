import { statutDe } from '@/lib/statut'

export function BadgeStatut({ avancement }: { avancement: number }) {
  const s = statutDe(avancement)
  return (
    <span className="badge" style={{ background: s.couleur }} aria-label={`Statut : ${s.nom}`}>
      <span aria-hidden="true" style={{ marginRight: 4 }}>
        {s.icone}
      </span>
      {s.nom}
    </span>
  )
}
