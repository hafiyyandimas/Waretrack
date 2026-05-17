import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fmtNum, fmtIDR } from '../lib/data'
import {
  getBarang, getGudang,
  getTransaksiMasuk, getTransaksiKeluar,
  createTransaksiMasuk, createTransaksiKeluar,
} from '../lib/queries'
import type { GudangRow } from '../lib/queries'

const PAGE_SIZE = 5

// ── Helper: ambil id_pengguna dari session ────────────────────────────────────
function getSessionUserId(): number {
  try {
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!stored) return 1
    return JSON.parse(stored).id_pengguna ?? 1
  } catch { return 1 }
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoPlus()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcoSearch()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcoBox()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IcoCheck()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function IcoClock()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IcoTruck()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> }
function IcoLeft()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> }
function IcoWarehouse(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }

// ── Shared Pagination ─────────────────────────────────────────────────────────
function Pagination({ page, totalPages, total, label, onPage }: {
  page: number; totalPages: number; total: number; label: string; onPage: (p: number) => void
}) {
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total)
  const to   = Math.min(page * PAGE_SIZE, total)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #F5F6FA', fontSize: 13, color: '#6B7C74' }}>
      <div>Menampilkan {from}–{to} dari {fmtNum(total)} {label}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #EAECF0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#9CA3AF' : '#374151', fontSize: 13, fontWeight: 500 }}>
          Sebelumnya
        </button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onPage(n)}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #EAECF0', background: page === n ? '#2E7D52' : '#fff', color: page === n ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: page === n ? 700 : 400 }}>
            {n}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #EAECF0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#9CA3AF' : '#374151', fontSize: 13, fontWeight: 500 }}>
          Berikutnya
        </button>
      </div>
    </div>
  )
}

// ── Filter Card ───────────────────────────────────────────────────────────────
function FilterCard({ search, onSearch, dropdowns }: {
  search: string
  onSearch: (v: string) => void
  dropdowns: { placeholder: string; options: string[]; value: string; onChange: (v: string) => void }[]
}) {
  return (
    <div className="wt-card" style={{ marginBottom: 16, padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {dropdowns.map((d, i) => (
          <select key={i} value={d.value} onChange={e => d.onChange(e.target.value)}
            style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1px solid #EAECF0', borderRadius: 10, background: '#FAFAFA', outline: 'none', cursor: 'pointer' }}>
            <option value="">{d.placeholder}</option>
            {d.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', border: '1px solid #EAECF0', borderRadius: 10, background: '#FAFAFA' }}>
        <IcoSearch />
        <input style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13.5, outline: 'none', color: '#1A2E22' }}
          placeholder="Cari nomor transaksi, barang..." value={search} onChange={e => onSearch(e.target.value)} />
      </div>
    </div>
  )
}

// ── Shared Form styles ────────────────────────────────────────────────────────
const fl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }
const fi: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#1A2E22', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }
const fg: React.CSSProperties = { marginBottom: 18 }
const errS: React.CSSProperties = { fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }

// ── Period filter helper ──────────────────────────────────────────────────────
function matchPeriod(tanggal: string, period: string): boolean {
  if (!period) return true
  const d   = new Date(tanggal)
  const now = new Date()
  if (period === 'Hari ini')         return d.toDateString() === now.toDateString()
  if (period === 'Minggu ini')       { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w }
  if (period === 'Bulan ini')        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (period === '3 bulan terakhir') { const m = new Date(now); m.setMonth(now.getMonth() - 3); return d >= m }
  return true
}

// ── Inbound (list) ────────────────────────────────────────────────────────────
export function Inbound() {
  const navigate = useNavigate()
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')

  const { data: transaksi = [], isLoading } = useQuery({
    queryKey: ['transaksi-masuk'],
    queryFn:  () => getTransaksiMasuk(),
  })

  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const bulanIni      = (transaksi as any[]).filter(t => { const d = new Date(t.tanggal); return d.getMonth() === month && d.getFullYear() === year })
  const totalBulanIni = bulanIni.reduce((a: number, t: any) => a + t.jumlah, 0)
  const nilaiTotal    = (transaksi as any[]).reduce((a: number, t: any) => a + Number(t.barang?.harga ?? 0) * t.jumlah, 0)

  const filtered = (transaksi as any[]).filter(t => {
    const noTrx       = `IN-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3, '0')}`
    const matchSearch  = !search || noTrx.toLowerCase().includes(search.toLowerCase()) || t.barang?.nama_barang?.toLowerCase().includes(search.toLowerCase()) || t.keterangan?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && matchPeriod(t.tanggal, filterPeriod)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const items      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const rows = [
      'No. Transaksi,Tanggal,Barang,SKU,Gudang,Jumlah,Keterangan,Oleh',
      ...(transaksi as any[]).map(t => {
        const no  = `IN-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3, '0')}`
        const tgl = new Date(t.tanggal).toLocaleDateString('id-ID')
        return `"${no}","${tgl}","${t.barang?.nama_barang ?? ''}","${t.barang?.sku ?? ''}","${t.gudang?.nama_gudang ?? ''}",${t.jumlah},"${t.keterangan ?? ''}","${t.pengguna?.nama_lengkap ?? ''}"`
      })
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'stok_masuk.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="wt-page-title">Stok Masuk</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Kelola penerimaan barang masuk ke gudang</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><IcoDownload /> Ekspor Data</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate({ to: '/inbound/new' })}><IcoPlus /> Penerimaan Baru</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Bulan Ini', value: fmtNum(totalBulanIni), icon: <IcoBox />,   iconBg: '#EBF5EE', iconColor: '#2E7D52' },
          { label: 'Terverifikasi',   value: fmtNum((transaksi as any[]).length), icon: <IcoCheck />, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Menunggu',        value: '0',                    icon: <IcoClock />, iconBg: '#FEF9C3', iconColor: '#D97706' },
          { label: 'Nilai Total',     value: nilaiTotal >= 1_000_000 ? `${(nilaiTotal / 1_000_000).toFixed(1)}M` : fmtNum(nilaiTotal), icon: <span style={{ fontWeight: 700, fontSize: 13 }}>Rp</span>, iconBg: '#EFF6FF', iconColor: '#2563EB' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EAECF0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12.5, color: '#6B7C74', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1A2E22', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <FilterCard
        search={search} onSearch={v => { setSearch(v); setPage(1) }}
        dropdowns={[
          { placeholder: 'Semua Status',  options: ['Terverifikasi'], value: filterStatus, onChange: v => { setFilterStatus(v); setPage(1) } },
          { placeholder: 'Semua Periode', options: ['Hari ini', 'Minggu ini', 'Bulan ini', '3 bulan terakhir'], value: filterPeriod, onChange: v => { setFilterPeriod(v); setPage(1) } },
        ]}
      />

      <div className="wt-card">
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Memuat data…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Tidak ada transaksi ditemukan.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>SKU</th>
                <th>Gudang</th>
                <th>Jumlah</th>
                <th className="num">Nilai</th>
                <th>Keterangan</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t: any) => {
                const noTrx = `IN-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3, '0')}`
                const tgl   = new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                const nilai = Number(t.barang?.harga ?? 0) * t.jumlah
                return (
                  <tr key={t.id_transaksi}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: '#1A2E22' }}>{noTrx}</td>
                    <td style={{ fontSize: 13, color: '#6B7C74' }}>{tgl}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{t.barang?.nama_barang ?? '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7C74' }}>{t.barang?.sku ?? '—'}</td>
                    <td>
                      {t.gudang
                        ? <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#EBF5EE', color: '#2E7D52', fontWeight: 600 }}>{t.gudang.nama_gudang}</span>
                        : <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>+{fmtNum(t.jumlah)} {t.barang?.satuan ?? ''}</td>
                    <td className="num" style={{ fontWeight: 600, fontSize: 13 }}>{fmtIDR(nilai)}</td>
                    <td style={{ fontSize: 12, color: '#9CA3AF' }}>{t.keterangan ?? '—'}</td>
                    <td style={{ fontSize: 13, color: '#6B7C74' }}>{t.pengguna?.nama_lengkap ?? '—'}</td>
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

// ── Outbound (list) ───────────────────────────────────────────────────────────
export function Outbound() {
  const navigate = useNavigate()
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')

  const { data: transaksi = [], isLoading } = useQuery({
    queryKey: ['transaksi-keluar'],
    queryFn:  () => getTransaksiKeluar(),
  })

  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const bulanIni      = (transaksi as any[]).filter(t => { const d = new Date(t.tanggal); return d.getMonth() === month && d.getFullYear() === year })
  const totalBulanIni = bulanIni.reduce((a: number, t: any) => a + t.jumlah, 0)
  const nilaiTotal    = (transaksi as any[]).reduce((a: number, t: any) => a + Number(t.barang?.harga ?? 0) * t.jumlah, 0)

  const filtered = (transaksi as any[]).filter(t => {
    const noTrx       = `OUT-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3, '0')}`
    const matchSearch  = !search || noTrx.toLowerCase().includes(search.toLowerCase()) || t.barang?.nama_barang?.toLowerCase().includes(search.toLowerCase()) || t.keterangan?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && matchPeriod(t.tanggal, filterPeriod)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const items      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const rows = [
      'No. Transaksi,Tanggal,Barang,SKU,Gudang,Jumlah,Keterangan,Oleh',
      ...(transaksi as any[]).map(t => {
        const no  = `OUT-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3, '0')}`
        const tgl = new Date(t.tanggal).toLocaleDateString('id-ID')
        return `"${no}","${tgl}","${t.barang?.nama_barang ?? ''}","${t.barang?.sku ?? ''}","${t.gudang?.nama_gudang ?? ''}",${t.jumlah},"${t.keterangan ?? ''}","${t.pengguna?.nama_lengkap ?? ''}"`
      })
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'stok_keluar.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="wt-page-title">Stok Keluar</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Kelola pengeluaran dan distribusi barang dari gudang</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><IcoDownload /> Ekspor Data</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate({ to: '/outbound/new' })}><IcoPlus /> Pengeluaran Baru</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Bulan Ini', value: fmtNum(totalBulanIni), icon: <IcoTruck />, iconBg: '#FEF9C3', iconColor: '#D97706' },
          { label: 'Selesai',         value: fmtNum((transaksi as any[]).length), icon: <IcoCheck />, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Dalam Proses',    value: '0',                    icon: <IcoClock />, iconBg: '#EFF6FF', iconColor: '#2563EB' },
          { label: 'Nilai Total',     value: nilaiTotal >= 1_000_000 ? `${(nilaiTotal / 1_000_000).toFixed(1)}M` : fmtNum(nilaiTotal), icon: <span style={{ fontWeight: 700, fontSize: 13 }}>Rp</span>, iconBg: '#F5F3FF', iconColor: '#7C3AED' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EAECF0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12.5, color: '#6B7C74', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1A2E22', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <FilterCard
        search={search} onSearch={v => { setSearch(v); setPage(1) }}
        dropdowns={[
          { placeholder: 'Semua Status',  options: ['Selesai'], value: filterStatus, onChange: v => { setFilterStatus(v); setPage(1) } },
          { placeholder: 'Semua Periode', options: ['Hari ini', 'Minggu ini', 'Bulan ini', '3 bulan terakhir'], value: filterPeriod, onChange: v => { setFilterPeriod(v); setPage(1) } },
        ]}
      />

      <div className="wt-card">
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Memuat data…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Tidak ada transaksi ditemukan.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>SKU</th>
                <th>Gudang</th>
                <th>Jumlah</th>
                <th className="num">Nilai</th>
                <th>Keterangan</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t: any) => {
                const noTrx = `OUT-${new Date(t.tanggal).getFullYear()}-${String(t.id_transaksi).padStart(3, '0')}`
                const tgl   = new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                const nilai = Number(t.barang?.harga ?? 0) * t.jumlah
                return (
                  <tr key={t.id_transaksi}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: '#1A2E22' }}>{noTrx}</td>
                    <td style={{ fontSize: 13, color: '#6B7C74' }}>{tgl}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{t.barang?.nama_barang ?? '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7C74' }}>{t.barang?.sku ?? '—'}</td>
                    <td>
                      {t.gudang
                        ? <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#FEF9C3', color: '#D97706', fontWeight: 600 }}>{t.gudang.nama_gudang}</span>
                        : <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>-{fmtNum(t.jumlah)} {t.barang?.satuan ?? ''}</td>
                    <td className="num" style={{ fontWeight: 600, fontSize: 13 }}>{fmtIDR(nilai)}</td>
                    <td style={{ fontSize: 12, color: '#9CA3AF' }}>{t.keterangan ?? '—'}</td>
                    <td style={{ fontSize: 13, color: '#6B7C74' }}>{t.pengguna?.nama_lengkap ?? '—'}</td>
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

// ── InboundForm ───────────────────────────────────────────────────────────────
export function InboundForm() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const todayStr    = new Date().toISOString().slice(0, 10)

  const [idBarang, setIdBarang]       = useState('')
  const [idGudang, setIdGudang]       = useState('')
  const [jumlah, setJumlah]           = useState('')
  const [keterangan, setKeterangan]   = useState('')
  const [tanggal, setTanggal]         = useState(todayStr)
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [serverErr, setServerErr]     = useState('')

  const { data: barangList = [] } = useQuery({ queryKey: ['barang'], queryFn: () => getBarang() })
  const { data: gudangList = [] } = useQuery({ queryKey: ['gudang'], queryFn: () => getGudang() })

  const selectedBarang = (barangList as any[]).find((b: any) => String(b.id_barang) === idBarang)
  const selectedGudang = (gudangList as GudangRow[]).find(g => String(g.id_gudang) === idGudang)

  // Stok produk di gudang yang dipilih (untuk preview ringkasan)
  const stokDiGudang = selectedBarang && selectedGudang
    ? (selectedBarang.stok_gudang ?? []).find((sg: any) => sg.id_gudang === selectedGudang.id_gudang)?.kuantitas_stok ?? 0
    : 0

  const nilaiTotal  = selectedBarang ? Number(selectedBarang.harga) * (Number(jumlah) || 0) : 0
  const stokSetelah = stokDiGudang + (Number(jumlah) || 0)

  const mut = useMutation({
    mutationFn: () => createTransaksiMasuk({
      data: {
        id_barang:   Number(idBarang),
        id_pengguna: getSessionUserId(),
        id_gudang:   Number(idGudang),
        jumlah:      Number(jumlah),
        keterangan:  keterangan || undefined,
        tanggal,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaksi-masuk'] })
      queryClient.invalidateQueries({ queryKey: ['barang'] })
      navigate({ to: '/inbound' })
    },
    onError: (e: any) => setServerErr(e?.message ?? 'Gagal menyimpan transaksi.'),
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!idBarang)                    e.idBarang = 'Pilih barang terlebih dahulu.'
    if (!idGudang)                    e.idGudang = 'Pilih gudang tujuan.'
    if (!jumlah || Number(jumlah) < 1) e.jumlah  = 'Jumlah minimal 1.'
    if (!tanggal)                     e.tanggal  = 'Tanggal wajib diisi.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() { setServerErr(''); if (validate()) mut.mutate() }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate({ to: '/inbound' })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #EAECF0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
          <IcoLeft /> Kembali
        </button>
        <div>
          <h1 className="wt-page-title" style={{ fontSize: 20 }}>Penerimaan Barang Baru</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Catat penerimaan stok masuk ke gudang</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        <div className="wt-card" style={{ padding: '24px 28px' }}>
          {serverErr && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              ⚠ {serverErr}
            </div>
          )}

          {/* Pilih Barang */}
          <div style={fg}>
            <label style={fl}>Pilih Barang <span style={{ color: '#EF4444' }}>*</span></label>
            <select style={{ ...fi, borderColor: errors.idBarang ? '#F87171' : '#E5E7EB', cursor: 'pointer' }}
              value={idBarang} onChange={e => { setIdBarang(e.target.value); setErrors(p => ({ ...p, idBarang: '' })) }}>
              <option value="">— Pilih barang —</option>
              {(barangList as any[]).map((b: any) => (
                <option key={b.id_barang} value={b.id_barang}>[{b.sku}] {b.nama_barang}</option>
              ))}
            </select>
            {errors.idBarang && <span style={errS}>{errors.idBarang}</span>}
          </div>

          {/* Pilih Gudang */}
          <div style={fg}>
            <label style={fl}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IcoWarehouse /> Gudang Tujuan <span style={{ color: '#EF4444' }}>*</span>
              </span>
            </label>
            <select style={{ ...fi, borderColor: errors.idGudang ? '#F87171' : '#E5E7EB', cursor: 'pointer' }}
              value={idGudang} onChange={e => { setIdGudang(e.target.value); setErrors(p => ({ ...p, idGudang: '' })) }}>
              <option value="">— Pilih gudang —</option>
              {(gudangList as GudangRow[]).map(g => (
                <option key={g.id_gudang} value={g.id_gudang}>{g.nama_gudang}</option>
              ))}
            </select>
            {errors.idGudang && <span style={errS}>{errors.idGudang}</span>}
            {selectedBarang && selectedGudang && (
              <span style={{ fontSize: 12, color: '#6B7C74', marginTop: 4, display: 'block' }}>
                Stok {selectedBarang.nama_barang} di {selectedGudang.nama_gudang} saat ini: <strong>{stokDiGudang} {selectedBarang.satuan}</strong>
              </span>
            )}
          </div>

          {/* Jumlah */}
          <div style={fg}>
            <label style={fl}>Jumlah Diterima <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={{ ...fi, borderColor: errors.jumlah ? '#F87171' : '#E5E7EB' }}
              type="number" min="1" placeholder="Contoh: 50"
              value={jumlah} onChange={e => { setJumlah(e.target.value); setErrors(p => ({ ...p, jumlah: '' })) }} />
            {errors.jumlah && <span style={errS}>{errors.jumlah}</span>}
            {selectedBarang && <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>Satuan: {selectedBarang.satuan}</span>}
          </div>

          {/* Tanggal */}
          <div style={fg}>
            <label style={fl}>Tanggal Penerimaan <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={{ ...fi, borderColor: errors.tanggal ? '#F87171' : '#E5E7EB' }}
              type="date" value={tanggal}
              onChange={e => { setTanggal(e.target.value); setErrors(p => ({ ...p, tanggal: '' })) }} />
            {errors.tanggal && <span style={errS}>{errors.tanggal}</span>}
          </div>

          {/* Keterangan */}
          <div style={fg}>
            <label style={fl}>Keterangan <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opsional)</span></label>
            <input style={fi} placeholder="Contoh: PT Maju Jaya, PO-2026-001"
              value={keterangan} onChange={e => setKeterangan(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate({ to: '/inbound' })} disabled={mut.isPending}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={mut.isPending}>
              {mut.isPending ? 'Menyimpan…' : 'Simpan Penerimaan'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="wt-card" style={{ padding: '20px 22px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2E22', marginBottom: 14 }}>Ringkasan</div>
            {!selectedBarang || !selectedGudang ? (
              <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>Pilih barang dan gudang untuk melihat ringkasan</div>
            ) : (
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
                {[
                  { k: 'Barang',            v: selectedBarang.nama_barang },
                  { k: 'SKU',               v: selectedBarang.sku, mono: true },
                  { k: 'Gudang Tujuan',     v: selectedGudang.nama_gudang },
                  { k: 'Harga Satuan',      v: fmtIDR(Number(selectedBarang.harga)) },
                  { k: 'Stok di Gudang',    v: `${fmtNum(stokDiGudang)} ${selectedBarang.satuan}` },
                  { k: 'Jumlah Masuk',      v: jumlah ? `+${fmtNum(Number(jumlah))} ${selectedBarang.satuan}` : '—', color: '#16A34A' },
                  { k: 'Stok Setelah',      v: jumlah ? `${fmtNum(stokSetelah)} ${selectedBarang.satuan}` : '—', bold: true },
                  { k: 'Total Nilai',       v: nilaiTotal > 0 ? fmtIDR(nilaiTotal) : '—', bold: true, color: '#2563EB' },
                ].map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6B7C74' }}>{row.k}</span>
                    <span style={{ fontFamily: row.mono ? 'monospace' : undefined, fontWeight: row.bold ? 700 : 400, color: row.color ?? '#1A2E22', textAlign: 'right', maxWidth: 160, wordBreak: 'break-all' }}>
                      {row.v}
                    </span>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div style={{ background: '#EBF5EE', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#2E7D52', lineHeight: 1.6 }}>
            ✓ Stok di gudang yang dipilih akan bertambah otomatis setelah disimpan
          </div>
        </div>
      </div>
    </div>
  )
}

// ── OutboundForm ──────────────────────────────────────────────────────────────
export function OutboundForm() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const todayStr    = new Date().toISOString().slice(0, 10)

  const [idBarang, setIdBarang]       = useState('')
  const [idGudang, setIdGudang]       = useState('')
  const [jumlah, setJumlah]           = useState('')
  const [keterangan, setKeterangan]   = useState('')
  const [tanggal, setTanggal]         = useState(todayStr)
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [serverErr, setServerErr]     = useState('')

  const { data: barangList = [] } = useQuery({ queryKey: ['barang'], queryFn: () => getBarang() })
  const { data: gudangList = [] } = useQuery({ queryKey: ['gudang'], queryFn: () => getGudang() })

  const selectedBarang = (barangList as any[]).find((b: any) => String(b.id_barang) === idBarang)
  const selectedGudang = (gudangList as GudangRow[]).find(g => String(g.id_gudang) === idGudang)

  // Stok produk DI gudang yang dipilih — ini yang divalidasi
  const stokDiGudang = selectedBarang && selectedGudang
    ? (selectedBarang.stok_gudang ?? []).find((sg: any) => sg.id_gudang === selectedGudang.id_gudang)?.kuantitas_stok ?? 0
    : 0

  const jumlahNum   = Number(jumlah) || 0
  const stokSetelah = stokDiGudang - jumlahNum
  const stokCukup   = !selectedGudang || !selectedBarang || stokDiGudang >= jumlahNum
  const nilaiTotal  = selectedBarang ? Number(selectedBarang.harga) * jumlahNum : 0

  // Hanya tampilkan gudang yang punya stok produk ini
  const gudangDenganStok = selectedBarang
    ? (gudangList as GudangRow[]).filter(g =>
        (selectedBarang.stok_gudang ?? []).some((sg: any) => sg.id_gudang === g.id_gudang && sg.kuantitas_stok > 0)
      )
    : (gudangList as GudangRow[])

  const mut = useMutation({
    mutationFn: () => createTransaksiKeluar({
      data: {
        id_barang:   Number(idBarang),
        id_pengguna: getSessionUserId(),
        id_gudang:   Number(idGudang),
        jumlah:      jumlahNum,
        keterangan:  keterangan || undefined,
        tanggal,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaksi-keluar'] })
      queryClient.invalidateQueries({ queryKey: ['barang'] })
      navigate({ to: '/outbound' })
    },
    onError: (e: any) => setServerErr(e?.message ?? 'Gagal menyimpan transaksi.'),
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!idBarang)                    e.idBarang = 'Pilih barang terlebih dahulu.'
    if (!idGudang)                    e.idGudang = 'Pilih gudang asal.'
    if (!jumlah || jumlahNum < 1)     e.jumlah   = 'Jumlah minimal 1.'
    else if (selectedBarang && selectedGudang && jumlahNum > stokDiGudang)
      e.jumlah = `Stok di ${selectedGudang.nama_gudang} tidak cukup. Tersedia: ${stokDiGudang} ${selectedBarang.satuan}.`
    if (!tanggal)                     e.tanggal  = 'Tanggal wajib diisi.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() { setServerErr(''); if (validate()) mut.mutate() }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate({ to: '/outbound' })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #EAECF0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
          <IcoLeft /> Kembali
        </button>
        <div>
          <h1 className="wt-page-title" style={{ fontSize: 20 }}>Pengeluaran Barang Baru</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Catat pengeluaran atau distribusi barang dari gudang</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        <div className="wt-card" style={{ padding: '24px 28px' }}>
          {serverErr && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              ⚠ {serverErr}
            </div>
          )}

          {/* Pilih Barang */}
          <div style={fg}>
            <label style={fl}>Pilih Barang <span style={{ color: '#EF4444' }}>*</span></label>
            <select style={{ ...fi, borderColor: errors.idBarang ? '#F87171' : '#E5E7EB', cursor: 'pointer' }}
              value={idBarang} onChange={e => { setIdBarang(e.target.value); setIdGudang(''); setJumlah(''); setErrors(p => ({ ...p, idBarang: '' })) }}>
              <option value="">— Pilih barang —</option>
              {(barangList as any[]).map((b: any) => (
                <option key={b.id_barang} value={b.id_barang} disabled={b.total_stok === 0}>
                  [{b.sku}] {b.nama_barang} — Stok total: {b.total_stok} {b.satuan}{b.total_stok === 0 ? ' (HABIS)' : ''}
                </option>
              ))}
            </select>
            {errors.idBarang && <span style={errS}>{errors.idBarang}</span>}
          </div>

          {/* Pilih Gudang */}
          <div style={fg}>
            <label style={fl}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IcoWarehouse /> Gudang Asal <span style={{ color: '#EF4444' }}>*</span>
              </span>
            </label>
            <select style={{ ...fi, borderColor: errors.idGudang ? '#F87171' : '#E5E7EB', cursor: 'pointer' }}
              value={idGudang} onChange={e => { setIdGudang(e.target.value); setJumlah(''); setErrors(p => ({ ...p, idGudang: '' })) }}
              disabled={!idBarang}>
              <option value="">— Pilih gudang —</option>
              {gudangDenganStok.map(g => {
                const stokSg = selectedBarang
                  ? (selectedBarang.stok_gudang ?? []).find((sg: any) => sg.id_gudang === g.id_gudang)?.kuantitas_stok ?? 0
                  : 0
                return (
                  <option key={g.id_gudang} value={g.id_gudang}>
                    {g.nama_gudang} (Stok: {stokSg} {selectedBarang?.satuan ?? ''})
                  </option>
                )
              })}
            </select>
            {errors.idGudang && <span style={errS}>{errors.idGudang}</span>}
            {selectedBarang && !idBarang && <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>Pilih barang dulu untuk melihat gudang yang tersedia.</span>}
            {selectedBarang && selectedGudang && (
              <span style={{ fontSize: 12, color: stokDiGudang > 0 ? '#6B7C74' : '#DC2626', marginTop: 4, display: 'block' }}>
                Stok tersedia di {selectedGudang.nama_gudang}: <strong>{stokDiGudang} {selectedBarang.satuan}</strong>
              </span>
            )}
          </div>

          {/* Jumlah */}
          <div style={fg}>
            <label style={fl}>Jumlah Dikeluarkan <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={{ ...fi, borderColor: errors.jumlah ? '#F87171' : '#E5E7EB' }}
              type="number" min="1" max={stokDiGudang || undefined}
              placeholder="Contoh: 10"
              value={jumlah} onChange={e => { setJumlah(e.target.value); setErrors(p => ({ ...p, jumlah: '' })) }} />
            {errors.jumlah && <span style={errS}>{errors.jumlah}</span>}
          </div>

          {/* Tanggal */}
          <div style={fg}>
            <label style={fl}>Tanggal Pengeluaran <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={{ ...fi, borderColor: errors.tanggal ? '#F87171' : '#E5E7EB' }}
              type="date" value={tanggal}
              onChange={e => { setTanggal(e.target.value); setErrors(p => ({ ...p, tanggal: '' })) }} />
            {errors.tanggal && <span style={errS}>{errors.tanggal}</span>}
          </div>

          {/* Keterangan */}
          <div style={fg}>
            <label style={fl}>Keterangan <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opsional)</span></label>
            <input style={fi} placeholder="Contoh: Toko Cabang Bandung, ORD-2026-001"
              value={keterangan} onChange={e => setKeterangan(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate({ to: '/outbound' })} disabled={mut.isPending}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={mut.isPending || !stokCukup}>
              {mut.isPending ? 'Menyimpan…' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="wt-card" style={{ padding: '20px 22px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2E22', marginBottom: 14 }}>Ringkasan</div>
            {!selectedBarang || !selectedGudang ? (
              <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>Pilih barang dan gudang untuk melihat ringkasan</div>
            ) : (
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
                {[
                  { k: 'Barang',          v: selectedBarang.nama_barang },
                  { k: 'SKU',             v: selectedBarang.sku, mono: true },
                  { k: 'Gudang Asal',     v: selectedGudang.nama_gudang },
                  { k: 'Harga Satuan',    v: fmtIDR(Number(selectedBarang.harga)) },
                  { k: 'Stok di Gudang',  v: `${fmtNum(stokDiGudang)} ${selectedBarang.satuan}` },
                  { k: 'Jumlah Keluar',   v: jumlah ? `-${fmtNum(jumlahNum)} ${selectedBarang.satuan}` : '—', color: '#DC2626' },
                  { k: 'Stok Setelah',    v: jumlah ? `${fmtNum(stokSetelah)} ${selectedBarang.satuan}` : '—', bold: true, color: stokSetelah < 0 ? '#DC2626' : '#1A2E22' },
                  { k: 'Total Nilai',     v: nilaiTotal > 0 ? fmtIDR(nilaiTotal) : '—', bold: true, color: '#7C3AED' },
                ].map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6B7C74' }}>{row.k}</span>
                    <span style={{ fontFamily: row.mono ? 'monospace' : undefined, fontWeight: row.bold ? 700 : 400, color: row.color ?? '#1A2E22', textAlign: 'right', maxWidth: 160, wordBreak: 'break-all' }}>
                      {row.v}
                    </span>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {selectedBarang && selectedGudang && !stokCukup && jumlah && (
            <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#DC2626', lineHeight: 1.6 }}>
              ⚠ Stok di {selectedGudang.nama_gudang} tidak mencukupi.
            </div>
          )}

          {stokCukup && selectedBarang && selectedGudang && (
            <div style={{ background: '#FEF9C3', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#CA8A04', lineHeight: 1.6 }}>
              ✓ Stok di {selectedGudang.nama_gudang} akan berkurang otomatis setelah disimpan
            </div>
          )}
        </div>
      </div>
    </div>
  )
}