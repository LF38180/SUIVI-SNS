import { statutDe } from '@/lib/statut'

export function BadgeStatut({ avancement }: { avancement: number }) {
  const s = statutDe(avancement)
  return (
    <span className="badge" style={{ background: s.couleur }}>
      {s.nom}
    </span>
  )
}
