export function Barre({ pourcent }: { pourcent: number }) {
  const v = Math.max(0, Math.min(100, pourcent))
  return (
    <div className="bar">
      <i style={{ width: `${v}%` }} />
    </div>
  )
}
