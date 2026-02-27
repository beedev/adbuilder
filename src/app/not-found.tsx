export default function NotFound() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#888' }}>
      <div style={{ fontSize: 48 }}>404</div>
      <div style={{ fontSize: 18 }}>Page not found</div>
      <a href="/" style={{ color: '#C8102E', fontSize: 14 }}>Go home</a>
    </div>
  )
}
