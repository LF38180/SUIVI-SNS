export function Jauge({ pourcent, taille = 138 }: { pourcent: number; taille?: number }) {
  const r = 60
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, pourcent)) / 100)
  return (
    <div style={{ position: 'relative', width: taille, height: taille, flex: 'none' }}>
      <svg width={taille} height={taille} viewBox="0 0 138 138" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="69" cy="69" r={r} fill="none" stroke="#FCE9E1" strokeWidth="14" />
        <circle
          cx="69"
          cy="69"
          r={r}
          fill="none"
          stroke="#EE6B3E"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <b style={{ fontSize: 32, fontWeight: 800, color: '#EE6B3E', lineHeight: 1 }}>{Math.round(pourcent)}%</b>
      </div>
    </div>
  )
}
