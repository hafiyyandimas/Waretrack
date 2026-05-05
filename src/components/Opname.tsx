import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../components/Icon';
import { Badge, PageHeader, LineChart, DonutChart, Sparkline } from '../components/ui';
import { fmtIDR, fmtNum } from '../lib/data';
import { getLowStock } from '../lib/queries';

// ─── Opname ──────────────────────────────────────────────────────────────────

export function Opname() {
  const rows = [
    { sku: "ELK-HP-0012", nama: "Smartphone Aura X3 128GB", lokasi: "A-02-14", sistem: 142, fisik: 142,  selisih: 0 },
    { sku: "ELK-HP-0013", nama: "Smartphone Aura X3 256GB", lokasi: "A-02-15", sistem: 28,  fisik: 27,   selisih: -1 },
    { sku: "ELK-AC-0203", nama: "Charger USB-C 65W",        lokasi: "A-04-08", sistem: 0,   fisik: 2,    selisih: 2 },
    { sku: "ELK-AC-0204", nama: "Powerbank 10.000mAh",      lokasi: "A-04-11", sistem: 412, fisik: 410,  selisih: -2 },
    { sku: "ELK-AU-0077", nama: "Earbuds TWS Pro 2",        lokasi: "A-03-05", sistem: 312, fisik: null, selisih: null },
    { sku: "ELK-KB-0341", nama: "Keyboard Mekanikal TKL",   lokasi: "B-01-09", sistem: 7,   fisik: null, selisih: null },
  ];
  const dicek = rows.filter(r => r.fisik !== null).length;

  return (
    <>
      <PageHeader
        title="Stock Opname"
        subtitle="OPN-2604-12 · Rak A-02 s/d A-04 · Dimulai 08:30 oleh Linda K."
        actions={
          <>
            <button className="btn btn-secondary btn-sm">Jeda</button>
            <button className="btn btn-secondary btn-sm"><Icon name="download" className="ico ico-sm" /> Cetak lembar hitung</button>
            <button className="btn btn-primary btn-sm"><Icon name="check" className="ico ico-sm" /> Selesaikan & posting</button>
          </>
        }
      />

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Progress</div>
          <div className="stat-value">{dicek}/{rows.length} <span className="stat-unit">SKU</span></div>
          <div className="progress" style={{ marginTop: 8 }}><div className="bar" style={{ width: `${(dicek / rows.length) * 100}%` }} /></div>
        </div>
        <div className="stat">
          <div className="stat-label">Sesuai</div>
          <div className="stat-value" style={{ color: "var(--ok)" }}>{rows.filter(r => r.selisih === 0).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Selisih</div>
          <div className="stat-value" style={{ color: "var(--warn)" }}>{rows.filter(r => r.selisih !== 0 && r.selisih !== null).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Nilai selisih</div>
          <div className="stat-value">−Rp 4,2jt</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="table-search"><Icon name="search" className="ico ico-sm" /><input placeholder="Scan SKU atau cari…" /></div>
          <button className="chip-filter applied">Area <span className="val">A-02 s/d A-04</span></button>
          <button className="chip-filter">Status <span className="val">Belum dihitung</span></button>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }}><Icon name="barcode" className="ico ico-sm" /> Mode scan</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>SKU / Produk</th><th>Lokasi</th>
              <th className="num">Qty sistem</th>
              <th className="num">Qty fisik</th>
              <th className="num">Selisih</th>
              <th>Keterangan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const done = r.fisik !== null;
              return (
                <tr key={r.sku} className={r.selisih !== 0 && r.selisih !== null ? "selected" : ""}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{r.nama}</div>
                    <div className="mono xsmall muted">{r.sku}</div>
                  </td>
                  <td className="mono">{r.lokasi}</td>
                  <td className="num">{r.sistem}</td>
                  <td>
                    <input className="input" style={{ height: 28, width: 80, textAlign: "right", fontFamily: "var(--ff-mono)" }}
                      defaultValue={r.fisik !== null ? r.fisik : ""} placeholder="—" />
                  </td>
                  <td className="num" style={{ fontWeight: 600, color: r.selisih === null ? "var(--text-3)" : r.selisih === 0 ? "var(--ok)" : "var(--danger)" }}>
                    {r.selisih === null ? "—" : (r.selisih > 0 ? "+" : "") + r.selisih}
                  </td>
                  <td>
                    {r.selisih !== 0 && r.selisih !== null
                      ? <input className="input" style={{ height: 28 }} placeholder="Alasan selisih…" />
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    {!done ? <Badge kind="neutral">MENUNGGU</Badge>
                      : r.selisih === 0 ? <Badge kind="ok">OK</Badge>
                      : <Badge kind="warn">SELISIH</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

function IcoAlert()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcoSettings() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoCart()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> }
function IcoSearch()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }

type AlertRow = { id_barang: number; sku: string; nama_barang: string; kategori: string | null; kuantitas_stok: number; batas_minimum: number; harga: number }

function getAlertStatus(row: AlertRow): { label: string; color: string; bg: string; dotColor: string } {
  if (row.kuantitas_stok === 0)                          return { label: 'Habis',  color: '#DC2626', bg: '#FEE2E2', dotColor: '#DC2626' }
  if (row.kuantitas_stok <= row.batas_minimum * 0.5)     return { label: 'Kritis', color: '#EA580C', bg: '#FFF0E6', dotColor: '#EA580C' }
  return                                                        { label: 'Rendah', color: '#CA8A04', bg: '#FEF9C3', dotColor: '#CA8A04' }
}

export function Alerts() {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterGudang, setFilterGudang]   = useState('')
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading } = useQuery({ queryKey: ['low-stock'], queryFn: () => getLowStock() })

  const totalAlert = rows.length
  const stokHabis  = rows.filter((r: AlertRow) => r.kuantitas_stok === 0).length
  const stokKritis = rows.filter((r: AlertRow) => r.kuantitas_stok > 0 && r.kuantitas_stok <= r.batas_minimum * 0.5).length
  const stokRendah = rows.filter((r: AlertRow) => r.kuantitas_stok > r.batas_minimum * 0.5).length

  const categories = Array.from(new Set(rows.map((r: AlertRow) => r.kategori ?? 'Lainnya'))) as string[]

  const filtered = rows.filter((r: AlertRow) => {
    const s = getAlertStatus(r)
    const matchStatus   = !filterStatus   || s.label.toLowerCase() === filterStatus.toLowerCase()
    const matchKategori = !filterKategori || (r.kategori ?? 'Lainnya') === filterKategori
    const matchSearch   = !search || r.nama_barang.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchKategori && matchSearch
  })

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((r: AlertRow) => r.id_barang)))
  }
  function toggle(id: number) {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const selectedRows = rows.filter((r: AlertRow) => selected.has(r.id_barang))

  return (
    <>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="wt-page-title">Alert Stok</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:3 }}>Monitor dan kelola produk dengan stok kritis</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm"><IcoSettings /> Aturan Alert</button>
          <button className="btn btn-secondary btn-sm"><IcoDownload /> Ekspor</button>
          <button className="btn btn-primary btn-sm"><IcoCart /> Buat PO</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        {[
          { label:'Total Alert', value: totalAlert, icon:<IcoAlert />, iconBg:'#FEE2E2', iconColor:'#DC2626' },
          { label:'Stok Habis',  value: stokHabis,  dot:'#DC2626', dotBg:'#FEE2E2' },
          { label:'Stok Kritis', value: stokKritis,  dot:'#EA580C', dotBg:'#FFF0E6' },
          { label:'Stok Rendah', value: stokRendah,  dot:'#CA8A04', dotBg:'#FEF9C3' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:14, border:'1px solid #EAECF0', padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
            {'icon' in s
              ? <div style={{ width:44, height:44, borderRadius:12, background:s.iconBg, color:s.iconColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
              : <div style={{ width:44, height:44, borderRadius:12, background:s.dotBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ width:14, height:14, borderRadius:'50%', background:s.dot, display:'block' }} />
                </div>
            }
            <div>
              <div style={{ fontSize:12.5, color:'#6B7C74', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:26, fontWeight:700, color:'#1A2E22', letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="wt-card" style={{ marginBottom:16, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select" style={{ flex:1, padding:'9px 12px', fontSize:13 }}>
            <option value="">Semua Status</option>
            {['Habis','Kritis','Rendah'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} className="form-select" style={{ flex:1, padding:'9px 12px', fontSize:13 }}>
            <option value="">Semua Kategori</option>
            {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterGudang} onChange={e => setFilterGudang(e.target.value)} className="form-select" style={{ flex:1, padding:'9px 12px', fontSize:13 }}>
            <option value="">Semua Gudang</option>
            <option value="Gudang A">Gudang A</option>
            <option value="Gudang B">Gudang B</option>
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', border:'1px solid #EAECF0', borderRadius:10, background:'#FAFAFA' }}>
          <IcoSearch />
          <input style={{ flex:1, border:'none', background:'transparent', fontSize:13.5, outline:'none', color:'#1A2E22' }}
            placeholder="Cari nama produk atau SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table + bottom bar */}
      <div className="wt-card" style={{ overflow:'visible' }}>
        {isLoading ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Memuat data…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>
            {rows.length === 0 ? '✓ Semua stok dalam kondisi baik!' : 'Tidak ada produk sesuai filter.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width:44 }}>
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} style={{ accentColor:'#2E7D52', width:15, height:15 }} />
                </th>
                <th>Status</th>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th className="num">Stok Saat Ini</th>
                <th className="num">Stok Minimum</th>
                <th>Gudang</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: AlertRow) => {
                const s = getAlertStatus(r)
                const isSelected = selected.has(r.id_barang)
                return (
                  <tr key={r.id_barang} style={{ background: isSelected ? '#F0FFF4' : 'transparent', cursor:'pointer' }} onClick={() => toggle(r.id_barang)}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(r.id_barang)}
                        style={{ accentColor:'#2E7D52', width:15, height:15 }} />
                    </td>
                    <td>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600, background:s.bg, color:s.color }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:s.dotColor, display:'inline-block' }} />
                        {s.label}
                      </span>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:12.5, color:'#6B7C74' }}>{r.sku}</td>
                    <td style={{ fontWeight:600, fontSize:13.5, color:'#1A2E22' }}>{r.nama_barang}</td>
                    <td style={{ fontSize:13, color:'#6B7C74' }}>{r.kategori ?? '—'}</td>
                    <td className="num" style={{ fontWeight:700, fontSize:15, color: r.kuantitas_stok === 0 ? '#DC2626' : r.kuantitas_stok <= r.batas_minimum * 0.5 ? '#EA580C' : '#CA8A04' }}>
                      {r.kuantitas_stok}
                    </td>
                    <td className="num" style={{ fontSize:13, color:'#6B7C74' }}>{r.batas_minimum}</td>
                    <td style={{ fontSize:13, color:'#6B7C74' }}>Gudang A</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Bottom action bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid #F5F6FA' }}>
          <span style={{ fontSize:13, color:'#6B7C74', cursor:'pointer', fontWeight:500 }} onClick={toggleAll}>
            {selected.size > 0 ? `${selected.size} produk dipilih` : 'Pilih Semua'}
          </span>
          <button
            className="btn btn-primary btn-sm"
            disabled={selected.size === 0}
            style={{ opacity: selected.size === 0 ? 0.5 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
            onClick={() => alert(`Membuat PO untuk ${selected.size} produk...`)}
          >
            <IcoCart /> Buat PO dari Produk Terpilih
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────

// Multi-line chart (3 series: stok masuk, stok keluar, nilai)
function ReportLineChart() {
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun']
  const series = [
    { label:'Stok Masuk',  color:'#2E7D52', values:[430,480,470,500,540,650] },
    { label:'Stok Keluar', color:'#F59E0B', values:[390,420,460,480,510,620] },
    { label:'Nilai (Juta)',color:'#8B5CF6', values:[280,310,320,350,370,420] },
  ]
  const W=580, H=240, PAD={top:20, right:20, bottom:44, left:44}
  const innerW = W-PAD.left-PAD.right
  const innerH = H-PAD.top-PAD.bottom
  const allVals = series.flatMap(s=>s.values)
  const maxVal  = Math.max(...allVals, 1)
  const yGrids  = [0,200,400,600,800]
  const xPos = (i:number) => PAD.left + (i/(months.length-1))*innerW
  const yPos = (v:number) => PAD.top + innerH - (v/maxVal)*innerH
  const toPath = (vals:number[]) => vals.map((v,i)=>`${i===0?'M':'L'} ${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
      {yGrids.map(v => {
        const y = yPos(Math.min(v,maxVal))
        return <g key={v}>
          <line x1={PAD.left} x2={W-PAD.right} y1={y} y2={y} stroke="#F0F0F0" strokeWidth="1"/>
          <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize="10" fill="#9CA3AF">{v}</text>
        </g>
      })}
      {series.map(s=>(
        <g key={s.label}>
          <path d={toPath(s.values)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {s.values.map((v,i)=><circle key={i} cx={xPos(i)} cy={yPos(v)} r="4" fill="#fff" stroke={s.color} strokeWidth="2"/>)}
        </g>
      ))}
      {months.map((m,i)=>(
        <text key={m} x={xPos(i)} y={H-8} textAnchor="middle" fontSize="11" fill="#9CA3AF">{m}</text>
      ))}
    </svg>
  )
}

// Pie chart for Komposisi Inventaris
function ReportPieChart() {
  const slices = [
    { label:'Elektronik', pct:35, color:'#2E7D52' },
    { label:'Furniture',  pct:25, color:'#4F9EF8' },
    { label:'Makanan',    pct:20, color:'#F59E0B' },
    { label:'Pakaian',    pct:15, color:'#8B5CF6' },
    { label:'Lainnya',    pct:5,  color:'#9CA3AF'  },
  ]
  const cx=120, cy=120, r=90
  let acc=0
  const paths = slices.map(s=>{
    const start=(acc/100)*2*Math.PI - Math.PI/2
    acc+=s.pct
    const end=(acc/100)*2*Math.PI - Math.PI/2
    const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start)
    const x2=cx+r*Math.cos(end),   y2=cy+r*Math.sin(end)
    const mid=(start+end)/2
    const lx=cx+(r*0.7)*Math.cos(mid), ly=cy+(r*0.7)*Math.sin(mid)
    return { d:`M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${s.pct>50?1:0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`, color:s.color, lx, ly, label:s.label, pct:s.pct }
  })
  // label positions for the 4 labeled ones (matching Figma)
  const labeledSlices = [
    { label:'Elektronik 35%', x:230, y:40,  color:'#2E7D52' },
    { label:'Makanan 20%',    x:10,  y:210, color:'#F59E0B' },
    { label:'Pakaian 15%',    x:195, y:215, color:'#8B5CF6' },
  ]
  return (
    <svg viewBox="0 0 280 240" width="100%" style={{display:'block'}}>
      {paths.map((p,i)=><path key={i} d={p.d} fill={p.color}/>)}
      {labeledSlices.map((l,i)=>(
        <text key={i} x={l.x} y={l.y} fontSize="11" fontWeight="600" fill={l.color}>{l.label}</text>
      ))}
    </svg>
  )
}

export function Reports() {
  const top5 = [
    { rank:1, nama:'Laptop Dell XPS 13',      trx:145, nilai:'Rp 2.68M', pct:95 },
    { rank:2, nama:'Monitor LG 27 inch',       trx:128, nilai:'Rp 2.15M', pct:80 },
    { rank:3, nama:'Mouse Wireless Logitech',  trx:342, nilai:'Rp 1.89M', pct:68 },
    { rank:4, nama:'Keyboard Mechanical',      trx:98,  nilai:'Rp 1.45M', pct:40 },
    { rank:5, nama:'Printer HP LaserJet',      trx:76,  nilai:'Rp 1.22M', pct:28 },
  ]

  const rankColor = (r:number) => r===1?{bg:'#FEF9C3',color:'#CA8A04'}: r===3?{bg:'#FFF0E6',color:'#EA580C'}:{bg:'#F3F4F6',color:'#6B7280'}

  return (
    <>
      {/* ── Header ── */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h1 className="wt-page-title">Laporan &amp; Analitik</h1>
          <p style={{fontSize:13,color:'#9CA3AF',marginTop:3}}>Analisis performa dan tren inventaris gudang</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Filter Periode
          </button>
          <button className="btn btn-primary btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* ── Stat cards (colored) ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
        {[
          { label:'Total Inventaris', value:'1,284', sub:'Produk aktif',    pct:'+12%', bg:'linear-gradient(135deg,#34A868,#2E7D52)', icon:'box'    },
          { label:'Turnover Rate',    value:'85%',   sub:'Bulan ini',       pct:'+8%',  bg:'linear-gradient(135deg,#60A5FA,#3B82F6)', icon:'trend'  },
          { label:'Nilai Inventaris', value:'28.5M', sub:'Rupiah',          pct:'+15%', bg:'linear-gradient(135deg,#A78BFA,#7C3AED)', icon:'dollar' },
          { label:'Accuracy Rate',   value:'98.5%', sub:'Akurasi stok',    pct:'-5%',  bg:'linear-gradient(135deg,#FB923C,#EA580C)', icon:'box2'   },
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:14,padding:'18px 20px',color:'#fff',position:'relative',overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {s.icon==='box'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>}
                {s.icon==='trend'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
                {s.icon==='dollar'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                {s.icon==='box2'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
              </div>
              <span style={{fontSize:12,fontWeight:700,background:'rgba(255,255,255,0.2)',padding:'2px 8px',borderRadius:20}}>{s.pct}</span>
            </div>
            <div style={{fontSize:12,opacity:0.85,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:28,fontWeight:700,letterSpacing:'-0.02em',lineHeight:1,marginBottom:4}}>{s.value}</div>
            <div style={{fontSize:11.5,opacity:0.75}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:16,marginBottom:16}}>
        {/* Line chart */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div>
              <div className="wt-card-title">Tren Pergerakan Stok</div>
              <div className="wt-card-sub">6 bulan terakhir</div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{fontSize:11.5}}>Bulan ini</button>
          </div>
          <div className="wt-card-body">
            <ReportLineChart />
            <div style={{display:'flex',gap:20,marginTop:12,justifyContent:'center'}}>
              {[{color:'#2E7D52',label:'Stok Masuk'},{color:'#F59E0B',label:'Stok Keluar'},{color:'#8B5CF6',label:'Nilai (Juta)'}].map(l=>(
                <span key={l.label} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#6B7C74'}}>
                  <span style={{width:20,height:2,background:l.color,display:'inline-block',borderRadius:2}}/>
                  <span style={{width:6,height:6,borderRadius:'50%',background:l.color,display:'inline-block'}}/>
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div className="wt-card-title">Komposisi Inventaris</div>
          </div>
          <div className="wt-card-body">
            <ReportPieChart />
          </div>
        </div>
      </div>

      {/* ── Top 5 Table ── */}
      <div className="wt-card">
        <div className="wt-card-header">
          <div>
            <div className="wt-card-title">Top 5 Produk Terlaris</div>
            <div className="wt-card-sub">Berdasarkan jumlah transaksi dan nilai</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{width:80}}>Ranking</th>
              <th>Nama Produk</th>
              <th>Jumlah Transaksi</th>
              <th>Total Nilai</th>
              <th style={{width:180}}>Grafik</th>
            </tr>
          </thead>
          <tbody>
            {top5.map(r=>{
              const rc = rankColor(r.rank)
              return (
                <tr key={r.rank}>
                  <td>
                    <div style={{width:32,height:32,borderRadius:8,background:rc.bg,color:rc.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14}}>
                      {r.rank}
                    </div>
                  </td>
                  <td style={{fontWeight:600,fontSize:13.5,color:'#1A2E22'}}>{r.nama}</td>
                  <td style={{fontSize:13,color:'#6B7C74'}}>{r.trx} transaksi</td>
                  <td style={{fontWeight:600,fontSize:13,color:'#1A2E22'}}>{r.nilai}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:6,borderRadius:99,background:'#F0F0F0',overflow:'hidden'}}>
                        <div style={{width:`${r.pct}%`,height:'100%',borderRadius:99,background:'#2E7D52'}}/>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}