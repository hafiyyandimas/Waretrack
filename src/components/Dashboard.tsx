import { useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getBarChart, getLowStock } from '../lib/queries'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number) { return n.toLocaleString('id-ID') }

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconBox() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function IconTrendUp() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function IconTrendDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
}
function IconAlert() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function IconInboundSmall() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function IconOutboundSmall() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 3 9 21 6 12 2 12"/></svg>
}
function IconScan() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
}
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function IconBarChart() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}

// ── Line Chart SVG ────────────────────────────────────────────────────────────
function LineChartSVG({ data }: { data: { label: string; in: number; out: number }[] }) {
  if (!data.length) return <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>Belum ada data</div>

  const W = 600, H = 220, PAD = { top: 20, right: 20, bottom: 40, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...data.flatMap(d => [d.in, d.out]), 1)
  const yGrids = [0, 200, 400, 600, 800]

  function xPos(i: number) { return PAD.left + (i / (data.length - 1)) * innerW }
  function yPos(v: number) { return PAD.top + innerH - (v / maxVal) * innerH }

  const inPts  = data.map((d, i) => [xPos(i), yPos(d.in)])
  const outPts = data.map((d, i) => [xPos(i), yPos(d.out)])
  const toPath = (pts: number[][]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Y grid lines */}
      {yGrids.map(v => {
        const y = yPos(Math.min(v, maxVal))
        return (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#F0F0F0" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{v}</text>
          </g>
        )
      })}
      {/* In line */}
      <path d={toPath(inPts)} fill="none" stroke="#2E7D52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {inPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#2E7D52" strokeWidth="2" />)}
      {/* Out line */}
      <path d={toPath(outPts)} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {outPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#F59E0B" strokeWidth="2" />)}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9CA3AF">{d.label}</text>
      ))}
    </svg>
  )
}

const PIE_COLORS = ['#2E7D52', '#4F9EF8', '#F59E0B', '#8B5CF6', '#9CA3AF', '#EC4899']

function PieChartSVG({ data }: { data: { label: string; pct: number }[] }) {
  if (!data.length) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
      Belum ada data kategori
    </div>
  )

  const cx = 80, cy = 80, r = 60
  let acc = 0
  const slices = data.map((d, i) => {
    const start = (acc / 100) * 2 * Math.PI - Math.PI / 2
    acc += d.pct
    const end  = (acc / 100) * 2 * Math.PI - Math.PI / 2
    const x1   = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2   = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end)
    const large = d.pct > 50 ? 1 : 0
    return {
      d:     `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }
  })

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 160 160" width="160" height="160" style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: '#374151', flex: 1 }}>{d.label}</span>
            <span style={{ fontWeight: 600, color: '#1A2E22' }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => getDashboardStats() })
  const { data: barData } = useQuery({ queryKey: ['bar-chart'],       queryFn: () => getBarChart() })
  const { data: lowStock } = useQuery({ queryKey: ['low-stock'],       queryFn: () => getLowStock() })

// Helper format delta
function fmtDelta(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return 'Bulan ini'
  if (pct > 0)  return `+${pct}% dari bulan lalu`
  if (pct < 0)  return `${pct}% dari bulan lalu`
  return 'Sama dengan bulan lalu'
}

// Ganti statCards:
const statCards = [
  {
    label: 'Total Produk',
    value: fmtNum(stats?.totalSKU ?? 0),
    icon: <IconBox />,
    iconBg: '#EBF5EE', iconColor: '#2E7D52',
    delta: fmtDelta(stats?.skuPct),
    deltaKind: (stats?.skuPct ?? 0) >= 0 ? 'up' : 'down',
  },
  {
    label: 'Stok Masuk (Bulan Ini)',
    value: fmtNum(stats?.masukBulanIni ?? 0),
    icon: <IconTrendUp />,
    iconBg: '#EBF5EE', iconColor: '#16A34A',
    delta: fmtDelta(stats?.masukPct),
    deltaKind: (stats?.masukPct ?? 0) >= 0 ? 'up' : 'down',
  },
  {
    label: 'Stok Keluar (Bulan Ini)',
    value: fmtNum(stats?.keluarBulanIni ?? 0),
    icon: <IconTrendDown />,
    iconBg: '#FEF9C3', iconColor: '#D97706',
    delta: fmtDelta(stats?.keluarPct),
    deltaKind: (stats?.keluarPct ?? 0) <= 0 ? 'down' : 'up',
  },
  {
    label: 'Alert Stok Kritis',
    value: fmtNum(stats?.lowStockCount ?? 0),
    icon: <IconAlert />,
    iconBg: '#FEE2E2', iconColor: '#DC2626',
    delta: 'Perlu perhatian',
    deltaKind: 'warn',
  },
]

  const quickActions = [
    { icon: <IconInboundSmall />, label: 'Terima Barang',  color: '#EBF5EE', textColor: '#2E7D52', nav: '/inbound/new' },
    { icon: <IconOutboundSmall />,label: 'Keluarkan Barang', color: '#FEF9C3', textColor: '#D97706', nav: '/outbound/new' },
    { icon: <IconScan />,         label: 'Scan SKU',       color: '#EFF6FF', textColor: '#4F9EF8', nav: '/products' },
    { icon: <IconPlus />,         label: 'Tambah Produk',  color: '#F5F3FF', textColor: '#8B5CF6', nav: '/products' },
    { icon: <IconBarChart />,     label: 'Lihat Laporan',  color: '#F5F6FA', textColor: '#6B7C74', nav: '/reports' },
  ]

  return (
    <div>
      <h1 className="wt-page-title">Dashboard</h1>
      <p className="wt-page-sub">Ringkasan operasional gudang Anda</p>

      {/* ── Stat cards ── */}
      <div className="wt-stat-grid">
        {statCards.map((s, i) => (
          <div key={i} className="wt-stat-card">
            <div className="wt-stat-label">{s.label}</div>
            <div className="wt-stat-value">{s.value}</div>
            <div className="wt-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
            <div className={`wt-stat-delta ${s.deltaKind}`}>
              {s.deltaKind === 'up' && <IconTrendUp />}
              {s.deltaKind === 'down' && <IconTrendDown />}
              {s.deltaKind === 'warn' && <IconAlert />}
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Line chart */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div>
              <div className="wt-card-title">Grafik Pergerakan Barang</div>
              <div className="wt-card-sub">6 bulan terakhir</div>
            </div>
            <Link to="/reports" className="wt-card-link">Lihat Detail</Link>
          </div>
          <div className="wt-card-body">
            <LineChartSVG data={barData ?? []} />
            <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7C74' }}>
                <span style={{ width: 20, height: 2, background: '#2E7D52', display: 'inline-block', borderRadius: 2 }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2E7D52', display: 'inline-block' }} />
                Stok Masuk
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7C74' }}>
                <span style={{ width: 20, height: 2, background: '#F59E0B', display: 'inline-block', borderRadius: 2 }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                Stok Keluar
              </span>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div>
              <div className="wt-card-title">Komposisi Kategori</div>
            </div>
          </div>
          <div className="wt-card-body">
            <PieChartSVG data={stats?.kategoriDistribusi ?? []} />
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: 16 }}>

        {/* Quick actions */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div className="wt-card-title">Aksi Cepat</div>
          </div>
          <div className="wt-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((a) => (
              <button key={a.label} className="wt-quick-btn" onClick={() => navigate({ to: a.nav as any })}>
                <span className="wt-quick-btn-icon" style={{ background: a.color, color: a.textColor }}>{a.icon}</span>
                <span style={{ color: a.textColor }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div>
              <div className="wt-card-title">Stok Perlu Perhatian</div>
            </div>
            <Link to="/alerts" className="wt-card-link">Lihat Semua</Link>
          </div>
          <div className="wt-card-body">
            {(lowStock ?? []).slice(0, 4).map((a: any) => {
              const pct = a.batas_minimum > 0 ? Math.min(100, Math.round((a.kuantitas_stok / a.batas_minimum) * 100)) : 0
              const isHabis  = a.kuantitas_stok === 0
              const isKritis = !isHabis && a.kuantitas_stok <= a.batas_minimum * 0.5
              const badgeClass = isHabis ? 'wt-badge-habis' : isKritis ? 'wt-badge-kritis' : 'wt-badge-rendah'
              const badgeLabel = isHabis ? 'Habis' : isKritis ? 'Kritis' : 'Rendah'
              const barColor   = isHabis ? '#9CA3AF' : isKritis ? '#DC2626' : '#F59E0B'
              return (
                <div key={a.sku} className="wt-alert-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="wt-alert-name">{a.nama_barang}</div>
                      <div className="wt-alert-sku">{a.sku}</div>
                    </div>
                    <span className={`wt-alert-badge ${badgeClass}`}>{badgeLabel}</span>
                  </div>
                  <div className="wt-progress">
                    <div className="wt-progress-bar" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{a.kuantitas_stok}/{a.batas_minimum}</div>
                </div>
              )
            })}
            {!(lowStock ?? []).length && (
              <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0' }}>Semua stok dalam kondisi baik ✓</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div className="wt-card-title">Aktivitas Terkini</div>
          </div>
          <div className="wt-card-body">
            {(stats?.transaksiHariIni ?? []).map((t: any, i: number) => {
              const isMasuk = t.jenis_transaksi === 'masuk'
              return (
                <div key={i} className="wt-activity-item">
                  <div className="wt-activity-icon" style={{ background: isMasuk ? '#EBF5EE' : '#FEF9C3', color: isMasuk ? '#2E7D52' : '#D97706' }}>
                    {isMasuk ? <IconInboundSmall /> : <IconOutboundSmall />}
                  </div>
                  <div>
                    <div className="wt-activity-text">
                      {isMasuk ? 'Penerimaan barang' : 'Pengeluaran untuk order'}
                    </div>
                    <div className="wt-activity-meta">
                      {t.barang.nama_barang} · {t.jumlah} unit · {new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            {!(stats?.transaksiHariIni ?? []).length && (
              <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0' }}>Belum ada aktivitas hari ini.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}