import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fmtNum, fmtIDR } from '../lib/data'
import { getTransaksiMasuk, getTransaksiKeluar } from '../lib/queries'

const PAGE_SIZE = 5

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoPlus()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcoSearch()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcoBox()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IcoCheck()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function IcoClock()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IcoTruck()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> }

// ── Shared Pagination ─────────────────────────────────────────────────────────
function Pagination({ page, totalPages, total, label, onPage }: { page: number; totalPages: number; total: number; label: string; onPage: (p: number) => void }) {
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total)
  const to   = Math.min(page * PAGE_SIZE, total)
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid #F5F6FA', fontSize:13, color:'#6B7C74' }}>
      <div>Menampilkan {from}–{to} dari {fmtNum(total)} {label}</div>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #EAECF0', background:'#fff', cursor: page===1?'not-allowed':'pointer', color: page===1?'#9CA3AF':'#374151', fontSize:13, fontWeight:500 }}>
          Sebelumnya
        </button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onPage(n)}
            style={{ width:34, height:34, borderRadius:8, border:'1px solid #EAECF0', background: page===n?'#2E7D52':'#fff', color: page===n?'#fff':'#374151', cursor:'pointer', fontSize:13, fontWeight: page===n?700:400 }}>
            {n}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #EAECF0', background:'#fff', cursor: page===totalPages?'not-allowed':'pointer', color: page===totalPages?'#9CA3AF':'#374151', fontSize:13, fontWeight:500 }}>
          Berikutnya
        </button>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    terverifikasi: { bg:'#DCFCE7', color:'#16A34A', label:'Terverifikasi' },
    menunggu:      { bg:'#FEF9C3', color:'#CA8A04', label:'Menunggu' },
    selesai:       { bg:'#DCFCE7', color:'#16A34A', label:'Selesai' },
    proses:        { bg:'#EFF6FF', color:'#2563EB', label:'Proses' },
    dibatalkan:    { bg:'#FEE2E2', color:'#DC2626', label:'Dibatalkan' },
  }
  const s = map[status?.toLowerCase()] ?? { bg:'#F3F4F6', color:'#6B7280', label: status ?? '—' }
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── Filter Card ───────────────────────────────────────────────────────────────
function FilterCard({ search, onSearch, dropdowns }: { search: string; onSearch: (v: string) => void; dropdowns: { placeholder: string; options: string[]; value: string; onChange: (v: string) => void }[] }) {
  return (
    <div className="wt-card" style={{ marginBottom:16, padding:'16px 20px' }}>
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        {dropdowns.map((d, i) => (
          <select key={i} value={d.value} onChange={e => d.onChange(e.target.value)} className="form-select" style={{ flex:1, padding:'9px 12px', fontSize:13 }}>
            <option value="">{d.placeholder}</option>
            {d.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', border:'1px solid #EAECF0', borderRadius:10, background:'#FAFAFA' }}>
        <IcoSearch />
        <input style={{ flex:1, border:'none', background:'transparent', fontSize:13.5, outline:'none', color:'#1A2E22' }}
          placeholder="Cari nomor transaksi..." value={search} onChange={e => onSearch(e.target.value)} />
      </div>
    </div>
  )
}

// ── Inbound ───────────────────────────────────────────────────────────────────
export function Inbound() {
  const navigate  = useNavigate()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [filterPeriod, setFilterPeriod]     = useState('')

  const { data: transaksi = [], isLoading } = useQuery({
    queryKey: ['transaksi-masuk'],
    queryFn: () => getTransaksiMasuk(),
  })

  // Derive stats
  const totalBulanIni  = transaksi.reduce((a: number, t: any) => a + t.jumlah, 0)
  const terverifikasi  = transaksi.filter((t: any) => (t.status ?? 'terverifikasi').toLowerCase() === 'terverifikasi').length
  const menunggu       = transaksi.filter((t: any) => (t.status ?? '').toLowerCase() === 'menunggu').length
  const nilaiTotal     = transaksi.reduce((a: number, t: any) => a + (t.barang?.harga ?? 0) * t.jumlah, 0)

  // Unique suppliers
  const suppliers = Array.from(new Set(transaksi.map((t: any) => t.barang?.supplier ?? t.keterangan ?? '').filter(Boolean))) as string[]

  // Filter
  const filtered = transaksi.filter((t: any) => {
    const noTrx = `IN-${String(t.id_transaksi).padStart(7, '0')}`
    const matchSearch = !search || noTrx.toLowerCase().includes(search.toLowerCase()) || t.barang?.nama_barang?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || (t.status ?? 'terverifikasi').toLowerCase() === filterStatus.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const items      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const rows = [
      'No. Transaksi,Tanggal,Barang,SKU,Jumlah,Status,Oleh',
      ...transaksi.map((t: any) => {
        const no = `IN-${String(t.id_transaksi).padStart(7,'0')}`
        const tgl = new Date(t.tanggal).toLocaleDateString('id-ID')
        return `"${no}","${tgl}","${t.barang?.nama_barang ?? ''}","${t.barang?.sku ?? ''}",${t.jumlah},"${t.status ?? 'terverifikasi'}","${t.pengguna?.nama_lengkap ?? ''}"`
      })
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'stok_masuk.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="wt-page-title">Stok Masuk</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:3 }}>Kelola penerimaan barang dari supplier</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><IcoDownload /> Ekspor Data</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate({ to: '/inbound/new' })}><IcoPlus /> Penerimaan Baru</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        {[
          { label:'Total Bulan Ini', value: fmtNum(totalBulanIni),    icon:<IcoBox />,   iconBg:'#EBF5EE', iconColor:'#2E7D52' },
          { label:'Terverifikasi',   value: fmtNum(terverifikasi),     icon:<IcoCheck />, iconBg:'#DCFCE7', iconColor:'#16A34A' },
          { label:'Menunggu',        value: fmtNum(menunggu),          icon:<IcoClock />, iconBg:'#FEF9C3', iconColor:'#D97706' },
          { label:'Nilai Total',     value: nilaiTotal >= 1_000_000 ? `${(nilaiTotal/1_000_000).toFixed(1)}M` : fmtNum(nilaiTotal),
                                            icon: <span style={{ fontWeight:700, fontSize:13 }}>Rp</span>,
                                            iconBg:'#EFF6FF', iconColor:'#2563EB' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:14, border:'1px solid #EAECF0', padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:s.iconBg, color:s.iconColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:12.5, color:'#6B7C74', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:26, fontWeight:700, color:'#1A2E22', letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <FilterCard
        search={search} onSearch={v => { setSearch(v); setPage(1) }}
        dropdowns={[
          { placeholder:'Semua Status', options:['Terverifikasi','Menunggu','Dibatalkan'], value:filterStatus, onChange: v => { setFilterStatus(v); setPage(1) } },
          { placeholder:'Semua Supplier', options:suppliers, value:filterSupplier, onChange: v => { setFilterSupplier(v); setPage(1) } },
          { placeholder:'Semua Periode', options:['Hari ini','Minggu ini','Bulan ini','3 bulan terakhir'], value:filterPeriod, onChange: v => { setFilterPeriod(v); setPage(1) } },
        ]}
      />

      {/* Table */}
      <div className="wt-card">
        {isLoading ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Memuat data…</div>
        ) : items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Tidak ada transaksi ditemukan.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Jumlah Item</th>
                <th className="num">Total Nilai</th>
                <th>Status</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t: any) => {
                const noTrx  = `IN-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3,'0')}`
                const tgl    = new Date(t.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
                const nilai  = (t.barang?.harga ?? 0) * t.jumlah
                const status = t.status ?? 'terverifikasi'
                return (
                  <tr key={t.id_transaksi} style={{ cursor:'pointer' }}>
                    <td style={{ fontFamily:'monospace', fontSize:12.5, fontWeight:600, color:'#1A2E22' }}>{noTrx}</td>
                    <td style={{ fontSize:13, color:'#6B7C74' }}>{tgl}</td>
                    <td style={{ fontWeight:600, fontSize:13, color:'#1A2E22' }}>{t.keterangan ?? t.barang?.nama_barang ?? '—'}</td>
                    <td style={{ fontSize:13, color:'#374151' }}>{t.jumlah} items</td>
                    <td className="num">
                      <div style={{ fontSize:12, color:'#9CA3AF' }}>Rp</div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{fmtNum(nilai)}</div>
                    </td>
                    <td><StatusBadge status={status} /></td>
                    <td style={{ fontSize:13, color:'#6B7C74' }}>{t.pengguna?.nama_lengkap?.split(' ').map((w: string, i: number) => i === 0 ? w : w[0] + '.').join(' ') ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} total={filtered.length} label="transaksi" onPage={setPage} />
      </div>
    </>
  )
}

// ── Outbound ──────────────────────────────────────────────────────────────────
export function Outbound() {
  const navigate  = useNavigate()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterTujuan, setFilterTujuan]   = useState('')
  const [filterPeriod, setFilterPeriod]   = useState('')

  const { data: transaksi = [], isLoading } = useQuery({
    queryKey: ['transaksi-keluar'],
    queryFn: () => getTransaksiKeluar(),
  })

  const totalBulanIni = transaksi.reduce((a: number, t: any) => a + t.jumlah, 0)
  const selesai       = transaksi.filter((t: any) => (t.status ?? 'selesai').toLowerCase() === 'selesai').length
  const dalamProses   = transaksi.filter((t: any) => (t.status ?? '').toLowerCase() === 'proses').length
  const nilaiTotal    = transaksi.reduce((a: number, t: any) => a + (t.barang?.harga ?? 0) * t.jumlah, 0)

  const filtered = transaksi.filter((t: any) => {
    const noTrx = `OUT-${String(t.id_transaksi).padStart(7,'0')}`
    const matchSearch = !search || noTrx.toLowerCase().includes(search.toLowerCase()) || t.barang?.nama_barang?.toLowerCase().includes(search.toLowerCase()) || t.keterangan?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || (t.status ?? 'selesai').toLowerCase() === filterStatus.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const items      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const rows = [
      'No. Transaksi,Tanggal,Tujuan,Jumlah,Status,Oleh',
      ...transaksi.map((t: any) => {
        const no = `OUT-${String(t.id_transaksi).padStart(7,'0')}`
        const tgl = new Date(t.tanggal).toLocaleDateString('id-ID')
        return `"${no}","${tgl}","${t.keterangan ?? ''}",${t.jumlah},"${t.status ?? 'selesai'}","${t.pengguna?.nama_lengkap ?? ''}"`
      })
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'stok_keluar.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="wt-page-title">Stok Keluar</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:3 }}>Kelola pengeluaran dan distribusi barang</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><IcoDownload /> Ekspor Data</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate({ to: '/outbound/new' })}><IcoPlus /> Pengeluaran Baru</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        {[
          { label:'Total Bulan Ini', value: fmtNum(totalBulanIni), icon:<IcoTruck />, iconBg:'#FEF9C3', iconColor:'#D97706' },
          { label:'Selesai',         value: fmtNum(selesai),        icon:<IcoCheck />, iconBg:'#DCFCE7', iconColor:'#16A34A' },
          { label:'Dalam Proses',    value: fmtNum(dalamProses),    icon:<IcoClock />, iconBg:'#EFF6FF', iconColor:'#2563EB' },
          { label:'Nilai Total',     value: nilaiTotal >= 1_000_000 ? `${(nilaiTotal/1_000_000).toFixed(1)}M` : fmtNum(nilaiTotal),
                                            icon: <span style={{ fontWeight:700, fontSize:13 }}>Rp</span>,
                                            iconBg:'#F5F3FF', iconColor:'#7C3AED' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:14, border:'1px solid #EAECF0', padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:s.iconBg, color:s.iconColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:12.5, color:'#6B7C74', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:26, fontWeight:700, color:'#1A2E22', letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <FilterCard
        search={search} onSearch={v => { setSearch(v); setPage(1) }}
        dropdowns={[
          { placeholder:'Semua Status', options:['Selesai','Proses','Dibatalkan'], value:filterStatus, onChange: v => { setFilterStatus(v); setPage(1) } },
          { placeholder:'Semua Tujuan', options:['Order','Transfer Gudang','Return'], value:filterTujuan, onChange: v => { setFilterTujuan(v); setPage(1) } },
          { placeholder:'Semua Periode', options:['Hari ini','Minggu ini','Bulan ini','3 bulan terakhir'], value:filterPeriod, onChange: v => { setFilterPeriod(v); setPage(1) } },
        ]}
      />

      {/* Table */}
      <div className="wt-card">
        {isLoading ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Memuat data…</div>
        ) : items.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Tidak ada transaksi ditemukan.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tanggal</th>
                <th>Tujuan</th>
                <th>Jumlah Item</th>
                <th className="num">Total Nilai</th>
                <th>Status</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t: any) => {
                const noTrx  = `OUT-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3,'0')}`
                const tgl    = new Date(t.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
                const nilai  = (t.barang?.harga ?? 0) * t.jumlah
                const status = t.status ?? 'selesai'
                const tujuan = t.keterangan ?? `Order #ORD-${String(t.id_transaksi).padStart(4,'0')}`
                return (
                  <tr key={t.id_transaksi} style={{ cursor:'pointer' }}>
                    <td style={{ fontFamily:'monospace', fontSize:12.5, fontWeight:600, color:'#1A2E22' }}>{noTrx}</td>
                    <td style={{ fontSize:13, color:'#6B7C74' }}>{tgl}</td>
                    <td style={{ fontWeight:600, fontSize:13, color:'#1A2E22' }}>{tujuan}</td>
                    <td style={{ fontSize:13, color:'#374151' }}>{t.jumlah} items</td>
                    <td className="num">
                      <div style={{ fontSize:12, color:'#9CA3AF' }}>Rp</div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{fmtNum(nilai)}</div>
                    </td>
                    <td><StatusBadge status={status} /></td>
                    <td style={{ fontSize:13, color:'#6B7C74' }}>{t.pengguna?.nama_lengkap?.split(' ').map((w: string, i: number) => i === 0 ? w : w[0] + '.').join(' ') ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} total={filtered.length} label="transaksi" onPage={setPage} />
      </div>
    </>
  )
}

// ── Forms (placeholder) ───────────────────────────────────────────────────────
export function InboundForm() {
  const navigate = useNavigate()
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:12 }}>
      <div style={{ fontSize:40, opacity:0.3 }}>📦</div>
      <div style={{ fontWeight:600, fontSize:16 }}>Form Penerimaan</div>
      <div style={{ color:'#9CA3AF', fontSize:14 }}>Fitur ini akan segera tersedia</div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate({ to: '/inbound' })}>← Kembali</button>
    </div>
  )
}

export function OutboundForm() {
  const navigate = useNavigate()
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:12 }}>
      <div style={{ fontSize:40, opacity:0.3 }}>🚚</div>
      <div style={{ fontWeight:600, fontSize:16 }}>Form Pengeluaran</div>
      <div style={{ color:'#9CA3AF', fontSize:14 }}>Fitur ini akan segera tersedia</div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate({ to: '/outbound' })}>← Kembali</button>
    </div>
  )
}