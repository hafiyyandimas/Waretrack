import { useQuery } from '@tanstack/react-query'
import { getBarang, getMonthlyStats, getTopProducts, getLowStock } from '../lib/queries'
import { fmtIDR, fmtNum } from '../lib/data'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoBox()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IcoTrendUp()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function IcoCoin()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function IcoAlert()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoFilter()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> }

// ── Line Chart ────────────────────────────────────────────────────────────────
function LineChart({ data }: { data: { label: string; in: number; out: number; nilaiMasuk: number; nilaiKeluar: number }[] }) {
  if (!data.length) return <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF', fontSize:13 }}>Belum ada data</div>

  const W = 600, H = 240, PAD = { top:24, right:24, bottom:44, left:44 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom
  const maxVal = Math.max(...data.flatMap(d => [d.in, d.out, d.nilaiMasuk]), 1)
  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal]

  function xPos(i: number) { return PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2) }
  function yPos(v: number) { return PAD.top + innerH - (v / maxVal) * innerH }
  const toPath = (pts: number[][]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

  const inPts    = data.map((d, i) => [xPos(i), yPos(d.in)])
  const outPts   = data.map((d, i) => [xPos(i), yPos(d.out)])
  const nilaiPts = data.map((d, i) => [xPos(i), yPos(d.nilaiMasuk)])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block' }}>
      {yTicks.map(v => {
        const y = yPos(v)
        return (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#F0F0F0" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
          </g>
        )
      })}
      {/* Stok Masuk */}
      <path d={toPath(inPts)} fill="none" stroke="#2E7D52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {inPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#2E7D52" strokeWidth="2" />)}
      {/* Stok Keluar */}
      <path d={toPath(outPts)} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {outPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#F59E0B" strokeWidth="2" />)}
      {/* Nilai */}
      <path d={toPath(nilaiPts)} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3" />
      {nilaiPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#8B5CF6" strokeWidth="2" />)}
      {/* X Labels */}
      {data.map((d, i) => (
        <text key={i} x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9CA3AF">{d.label}</text>
      ))}
    </svg>
  )
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#2E7D52','#4F9EF8','#F59E0B','#8B5CF6','#EC4899','#9CA3AF']

function PieChart({ data }: { data: { label: string; value: number; pct: number }[] }) {
  const cx = 80, cy = 80, r = 65
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
      label: d.label,
      pct:   d.pct,
    }
  })

  return (
    <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
      <svg viewBox="0 0 160 160" width="160" height="160" style={{ flexShrink:0 }}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }} />
            <span style={{ color:'#374151', flex:1 }}>{s.label}</span>
            <span style={{ fontWeight:600, color:'#1A2E22' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Gradient Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient, delta }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; gradient: string; delta?: string
}) {
  return (
    <div style={{
      borderRadius:16, padding:'20px 22px', background:gradient,
      color:'#fff', position:'relative', overflow:'hidden',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ opacity:0.9, fontSize:13, fontWeight:500, marginBottom:8 }}>{label}</div>
        {delta && (
          <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'2px 8px', fontSize:11.5, fontWeight:600 }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ fontSize:34, fontWeight:700, letterSpacing:'-0.03em', lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, opacity:0.75, marginTop:4 }}>{sub}</div>}
      <div style={{ position:'absolute', right:18, bottom:14, opacity:0.2, transform:'scale(2.5)', transformOrigin:'right bottom' }}>
        {icon}
      </div>
    </div>
  )
}

// ── Reports Page ──────────────────────────────────────────────────────────────
export function Reports() {
  const { data: barang = [] }      = useQuery({ queryKey:['barang'],         queryFn: () => getBarang() })
  const { data: monthly = [] }     = useQuery({ queryKey:['monthly-stats'],  queryFn: () => getMonthlyStats() })
  const { data: topProducts = [] } = useQuery({ queryKey:['top-products'],   queryFn: () => getTopProducts() })
  const { data: lowStock = [] }    = useQuery({ queryKey:['low-stock'],      queryFn: () => getLowStock() })

  // ── Stats derivasi ──
  const totalSKU      = barang.length
  const nilaiInv = barang.reduce((s: number, b: any) => s + Number(b.harga) * (b.total_stok ?? 0), 0)
  const bulanIni      = monthly[monthly.length - 1]
  const totalMasuk    = bulanIni?.in  ?? 0
  const totalKeluar   = bulanIni?.out ?? 0
  const alertCount    = lowStock.length

  // ── Kategori composition dari data real ──
  const katMap: Record<string, number> = {}
  ;(barang as any[]).forEach((b: any) => {
    const k = b.kategori ?? 'Lainnya'
    katMap[k] = (katMap[k] ?? 0) + Number(b.harga) * (b.total_stok ?? 0)
  })
  const totalKatVal = Object.values(katMap).reduce((s, v) => s + v, 0) || 1
  const katData = Object.entries(katMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value, pct: Math.round((value / totalKatVal) * 100) }))

  // Normalize pct agar total = 100
  const pctSum = katData.reduce((s, k) => s + k.pct, 0)
  if (katData.length && pctSum !== 100) katData[0].pct += 100 - pctSum

  // ── Top products bar max ──
  const maxTrx = Math.max(...(topProducts as any[]).map((p: any) => p.jumlah_transaksi), 1)

  // ── Export CSV ──
  function exportCSV() {
    const rows = [
      'Nama Produk,SKU,Jumlah Transaksi,Total Qty,Total Nilai',
      ...(topProducts as any[]).map((p: any) =>
        `"${p.nama_barang}","${p.sku}",${p.jumlah_transaksi},${p.total_qty},"${fmtIDR(p.total_nilai)}"`
      )
    ]
    const blob = new Blob([rows.join('\n')], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'laporan_top_produk.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="wt-page-title">Laporan &amp; Analitik</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:3 }}>Analisis performa dan tren inventaris gudang</p>
        </div>
        <div style={{ display:'flex', gap:8 }}> 
          <button className="btn btn-primary btn-sm" onClick={exportCSV}><IcoDownload /> Ekspor CSV</button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        <StatCard
          label="Total Inventaris"
          value={fmtNum(totalSKU)}
          sub="Produk aktif"
          icon={<IcoBox />}
          gradient="linear-gradient(135deg,#2E7D52,#16A34A)"
          delta={`+${totalSKU} SKU`}
        />
        <StatCard
          label="Stok Masuk Bulan Ini"
          value={fmtNum(totalMasuk)}
          sub="Unit diterima"
          icon={<IcoTrendUp />}
          gradient="linear-gradient(135deg,#3B82F6,#60A5FA)"
          delta={totalMasuk > 0 ? `+${totalMasuk}` : '0'}
        />
        <StatCard
          label="Nilai Inventaris"
          value={nilaiInv >= 1_000_000_000 ? `${(nilaiInv/1_000_000_000).toFixed(1)}M` : nilaiInv >= 1_000_000 ? `${(nilaiInv/1_000_000).toFixed(1)}Jt` : fmtNum(nilaiInv)}
          sub="Rupiah"
          icon={<IcoCoin />}
          gradient="linear-gradient(135deg,#7C3AED,#A855F7)"
        />
        <StatCard
          label="Alert Stok"
          value={fmtNum(alertCount)}
          sub="Item perlu perhatian"
          icon={<IcoAlert />}
          gradient="linear-gradient(135deg,#EA580C,#F97316)"
          delta={alertCount > 0 ? 'Perlu tindakan' : 'Semua aman'}
        />
      </div>

      {/* ── Chart Row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16, marginBottom:16 }}>

        {/* Line Chart */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div>
              <div className="wt-card-title">Tren Pergerakan Stok</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>6 bulan terakhir</div>
            </div>
          </div>
          <div className="wt-card-body">
            <LineChart data={monthly as any} />
            <div style={{ display:'flex', gap:20, marginTop:14, justifyContent:'center', flexWrap:'wrap' }}>
              {[
                { color:'#2E7D52', label:'Stok Masuk', dash:false },
                { color:'#F59E0B', label:'Stok Keluar', dash:false },
                { color:'#8B5CF6', label:'Nilai (Juta)', dash:true },
              ].map(l => (
                <span key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6B7C74' }}>
                  <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={l.color} strokeWidth="2.5" strokeDasharray={l.dash ? '5,3' : 'none'} /></svg>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:l.color, display:'inline-block' }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div className="wt-card-title">Komposisi Inventaris</div>
          </div>
          <div className="wt-card-body">
            {katData.length > 0
              ? <PieChart data={katData} />
              : <div style={{ padding:32, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Belum ada data kategori</div>
            }
          </div>
        </div>
      </div>

      {/* ── Top 5 Produk ── */}
      <div className="wt-card">
        <div className="wt-card-header">
          <div>
            <div className="wt-card-title">Top 5 Produk Terlaris</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Berdasarkan jumlah transaksi dan nilai</div>
          </div>
        </div>
        {(topProducts as any[]).length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>
            Belum ada data transaksi untuk ditampilkan.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width:80 }}>Ranking</th>
                <th>Nama Produk</th>
                <th>SKU</th>
                <th className="num">Jumlah Transaksi</th>
                <th className="num">Total Nilai</th>
                <th style={{ width:180 }}>Grafik</th>
              </tr>
            </thead>
            <tbody>
              {(topProducts as any[]).map((p: any, i: number) => {
                const rankColors = ['#F59E0B','#9CA3AF','#CD7C2F','#6B7C74','#6B7C74']
                const rankBg     = ['#FEF9C3','#F3F4F6','#FEF3E2','#F9FAFB','#F9FAFB']
                const barPct     = Math.round((p.jumlah_transaksi / maxTrx) * 100)
                return (
                  <tr key={p.sku}>
                    <td>
                      <div style={{
                        width:28, height:28, borderRadius:8,
                        background: rankBg[i], color: rankColors[i],
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontWeight:700, fontSize:13,
                      }}>
                        {i + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight:600, fontSize:13, color:'#1A2E22' }}>{p.nama_barang}</td>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'#9CA3AF' }}>{p.sku}</td>
                    <td className="num" style={{ fontSize:13 }}>{fmtNum(p.jumlah_transaksi)} transaksi</td>
                    <td className="num" style={{ fontWeight:600, fontSize:13 }}>
                      {p.total_nilai >= 1_000_000 ? `Rp ${(p.total_nilai/1_000_000).toFixed(2)}M` : fmtIDR(p.total_nilai)}
                    </td>
                    <td>
                      <div style={{ background:'#F3F4F6', borderRadius:99, height:8, overflow:'hidden' }}>
                        <div style={{ width:`${barPct}%`, height:'100%', background:'#2E7D52', borderRadius:99, transition:'width 0.5s' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Summary row */}
        {(topProducts as any[]).length > 0 && (
          <div style={{ padding:'14px 20px', borderTop:'1px solid #F5F6FA', display:'flex', gap:32, fontSize:12.5, color:'#6B7C74' }}>
            <span>Total transaksi tercatat: <strong style={{ color:'#1A2E22' }}>{fmtNum((topProducts as any[]).reduce((s: number, p: any) => s + p.jumlah_transaksi, 0))}</strong></span>
            <span>Total nilai: <strong style={{ color:'#1A2E22' }}>{fmtIDR((topProducts as any[]).reduce((s: number, p: any) => s + p.total_nilai, 0))}</strong></span>
          </div>
        )}
      </div>
    </>
  )
}