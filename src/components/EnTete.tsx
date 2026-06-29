export function EnTete({ titre, sousTitre }: { titre: string; sousTitre?: string }) {
  return (
    <header style={{ background: '#EE6B3E', color: '#fff', padding: '30px 0 34px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px' }}>
        <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.5px', lineHeight: 1 }}>
          Seyssins
          <small style={{ display: 'block', fontWeight: 400, fontSize: 15, opacity: 0.92, marginTop: 2 }}>
            Nature<b style={{ fontWeight: 700 }}>&amp;</b>Solidaire
          </small>
        </div>
        <h1 style={{ fontSize: 25, fontWeight: 700, marginTop: 18 }}>{titre}</h1>
        {sousTitre && <div style={{ fontSize: 14, opacity: 0.92, marginTop: 4, maxWidth: 640 }}>{sousTitre}</div>}
      </div>
    </header>
  )
}
