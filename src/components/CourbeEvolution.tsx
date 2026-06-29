export type PointEvolution = { date: string; pourcent: number }

export function CourbeEvolution({ points }: { points: PointEvolution[] }) {
  if (points.length < 2) {
    return (
      <div style={{ color: '#6E6E73', fontSize: 13 }}>
        Pas encore assez d’historique pour tracer une courbe. Les validations d’avancement alimenteront ce graphique.
      </div>
    )
  }
  const w = 600
  const h = 160
  const pad = 24
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1))
  const ys = points.map((p) => h - pad - (Math.max(0, Math.min(100, p.pourcent)) / 100) * (h - 2 * pad))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Évolution de l’avancement">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ECE5DF" />
      <path d={d} fill="none" stroke="#EE6B3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3" fill="#EE6B3E" />
      ))}
    </svg>
  )
}
