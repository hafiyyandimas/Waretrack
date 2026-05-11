import { createRootRoute, Outlet, Link, HeadContent, Scripts } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import wmsStyles from '../wms-styles.css?url'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } },
})

const NAV = [
  { to: '/',         icon: <IconDashboard />, label: 'Dashboard' },
  { to: '/products', icon: <IconBox />,       label: 'Produk' },
  { to: '/inbound',  icon: <IconInbound />,   label: 'Stok Masuk' },
  { to: '/outbound', icon: <IconOutbound />,  label: 'Stok Keluar' },
  { to: '/alerts',   icon: <IconAlert />,     label: 'Alert Stok' },
  { to: '/reports',  icon: <IconChart />,     label: 'Laporan & Analitik' },
  { to: '/users',    icon: <IconUsers />,     label: 'User & Role' },
]

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconDashboard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function IconBox() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function IconInbound() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function IconOutbound() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 3 9 21 6 12 2 12"/></svg>
}
function IconAlert() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function IconChart() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
function IconUsers() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function IconBell() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function IconLogout() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

const CRITICAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif; background: #F5F6FA; color: #1A2E22; -webkit-font-smoothing: antialiased; }
  .wt-shell { display: flex; height: 100vh; overflow: hidden; }
  .wt-sidebar { width: 224px; flex-shrink: 0; background: #fff; border-right: 1px solid #EAECF0; display: flex; flex-direction: column; padding: 20px 0 0; overflow-y: auto; }
  .wt-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  .wt-topbar { height: 64px; flex-shrink: 0; background: #fff; border-bottom: 1px solid #EAECF0; display: flex; align-items: center; padding: 0 24px; gap: 16px; }
  .wt-content { flex: 1; overflow-y: auto; padding: 28px; }
  .wt-brand { display: flex; align-items: center; gap: 10px; padding: 0 20px 24px; }
  .wt-brand-logo { width: 36px; height: 36px; background: linear-gradient(135deg, #34A868, #2E7D52); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
  .wt-brand-name { font-size: 17px; font-weight: 700; color: #1A2E22; }
  .wt-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 0 12px; }
  .wt-nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; font-size: 13.5px; font-weight: 500; color: #6B7C74; text-decoration: none; }
  .wt-nav-link--active { background: #EBF5EE; color: #2E7D52; font-weight: 600; }
  .wt-sidebar-footer { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-top: 1px solid #EAECF0; margin-top: auto; }
  .wt-page-title { font-size: 22px; font-weight: 700; color: #1A2E22; letter-spacing: -0.02em; }
  .wt-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
  .wt-card { background: #fff; border-radius: 14px; border: 1px solid #EAECF0; overflow: hidden; }
  .wt-card-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 20px 14px; }
  .wt-card-title { font-size: 15px; font-weight: 700; color: #1A2E22; }
  .wt-card-body { padding: 0 20px 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  th { padding: 10px 16px; text-align: left; font-size: 11.5px; font-weight: 600; color: #9CA3AF; border-bottom: 1px solid #EAECF0; background: #FAFAFA; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 13px 16px; color: #374151; border-bottom: 1px solid #F5F6FA; vertical-align: middle; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; }
  .btn-primary { background: linear-gradient(135deg, #34A868, #2E7D52); color: #fff; }
  .btn-secondary { background: #fff; color: #374151; border: 1px solid #EAECF0; }
  .btn-sm { padding: 6px 12px; font-size: 12.5px; border-radius: 8px; }
`

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell() {
  const router   = useRouter()
  const pathname = router.state.location.pathname

  const [user, setUser] = useState<{ nama_lengkap: string; role: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (stored) {
      setUser(JSON.parse(stored))
    } else if (pathname !== '/login' && pathname !== '/contact') {
      window.location.href = '/login'
    }
  }, [pathname])

  function handleLogout() {
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_user')
    window.location.href = '/login'
  }

  const noSidebar = pathname === '/login' || pathname === '/contact'
  const userRole  = user?.role ?? ''

  const HEAD = (
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>WareTrack</title>
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      <link rel="stylesheet" href={wmsStyles} />
      <HeadContent />
    </head>
  )

  // ── Halaman tanpa sidebar ──
  if (noSidebar) return (
    <html lang="id">
      {HEAD}
      <body>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )

  const initials = user?.nama_lengkap
    ?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() ?? '?'

  // Filter nav berdasarkan role
  const visibleNav = NAV.filter(item => {
    if (item.to === '/users' && userRole !== 'Super Admin') return false
    return true
  })

  return (
    <html lang="id">
      {HEAD}
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="wt-shell">

            {/* ── Sidebar ── */}
            <aside className="wt-sidebar">
              <div className="wt-brand">
                <div className="wt-brand-logo"><IconBox /></div>
                <span className="wt-brand-name">WareTrack</span>
              </div>
              <nav className="wt-nav">
                {visibleNav.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="wt-nav-link"
                    activeProps={{ className: 'wt-nav-link wt-nav-link--active' }}
                    activeOptions={{ exact: item.to === '/' }}
                  >
                    <span className="wt-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="wt-sidebar-footer">
                <div className="wt-user-avatar">{initials}</div>
                <div className="wt-user-info">
                  <div className="wt-user-name">{user?.nama_lengkap ?? '—'}</div>
                  <div className="wt-user-role">{user?.role ?? '—'}</div>
                </div>
                <button className="wt-logout-btn" title="Keluar" onClick={handleLogout}>
                  <IconLogout />
                </button>
              </div>
            </aside>

            {/* ── Main area ── */}
            <div className="wt-main">
              <header className="wt-topbar">
                <div className="wt-search-wrap">
                  <span className="wt-search-icon"><IconSearch /></span>
                  <input className="wt-search-input" type="text" placeholder="Cari produk, SKU, atau transaksi..." />
                </div>
                <div className="wt-topbar-right">
                  <button className="wt-notif-btn">
                    <IconBell />
                    <span className="wt-notif-dot" />
                  </button>
                  <div className="wt-topbar-user">
                    <div className="wt-topbar-avatar">{initials}</div>
                    <div className="wt-topbar-user-info">
                      <div className="wt-topbar-user-name">{user?.nama_lengkap ?? '—'}</div>
                      <div className="wt-topbar-user-role">{user?.role ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </header>
              <main className="wt-content">
                <Outlet />
              </main>
            </div>
          </div>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  component: Shell,
  notFoundComponent: () => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
      <div style={{ fontSize:48, fontWeight:700, color:'#E5E7EB' }}>404</div>
      <div style={{ fontSize:16, fontWeight:500 }}>Halaman tidak ditemukan</div>
      <Link to="/" style={{ color:'#2E7D52', fontWeight:600, textDecoration:'none' }}>Kembali ke Dashboard</Link>
    </div>
  ),
})