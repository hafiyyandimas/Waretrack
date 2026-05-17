import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getBarang } from '../lib/queries'
import { fmtNum, fmtIDR, statusForStock } from '../lib/data'
import type { BarangRow } from '../lib/queries'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoAlert()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcoEmpty()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> }
function IcoLow()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg> }
function IcoNear()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IcoSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcoArrow()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> }

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  HABIS:      { label: 'Stok Habis',      bg: '#FEE2E2', color: '#DC2626', badgeBg: '#FEE2E2', badgeColor: '#DC2626', icon: <IcoEmpty />,  priority: 0 },
  RENDAH:     { label: 'Stok Rendah',     bg: '#FEF9C3', color: '#CA8A04', badgeBg: '#FEF9C3', badgeColor: '#CA8A04', icon: <IcoLow />,    priority: 1 },
  'HAMPIR MIN':{ label: 'Hampir Minimum', bg: '#FFF7ED', color: '#EA580C', badgeBg: '#FFEDD5', badgeColor: '#EA580C', icon: <IcoNear />,   priority: 2 },
} as const

type AlertStatus = keyof typeof STATUS_CONFIG

// ── Progress bar ──────────────────────────────────────────────────────────────
function StokBar({ stok, min, color }: { stok: number; min: number; color: string }) {
  const target = min * 3 || 1
  const pct    = Math.min(100, Math.round((stok / target) * 100))
  return (
    <div style={{ background: '#F3F4F6', borderRadius: 99, height: 6, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Alerts() {
  const navigate = useNavigate()
  const [search, setSearch]           = useState('')
  const [activeFilter, setActiveFilter] = useState<AlertStatus | 'Semua'>('Semua')

  const { data: barang = [], isLoading } = useQuery({
    queryKey: ['barang'],
    queryFn:  () => getBarang(),
  })

  // ── Kategorisasi ──
  const alertItems = (barang as BarangRow[])
    .map(b => ({ ...b, status: statusForStock(b.total_stok, b.batas_minimum) }))
    .filter(b => b.status.label !== 'NORMAL')
    .sort((a, b) => {
      const pa = STATUS_CONFIG[a.status.label as AlertStatus]?.priority ?? 9
      const pb = STATUS_CONFIG[b.status.label as AlertStatus]?.priority ?? 9
      return pa !== pb ? pa - pb : a.total_stok - b.total_stok
    })

  const habisItems     = alertItems.filter(b => b.status.label === 'HABIS')
  const rendahItems    = alertItems.filter(b => b.status.label === 'RENDAH')
  const hampirMinItems = alertItems.filter(b => b.status.label === 'HAMPIR MIN')

  // ── Filter + Search ──
  const filtered = alertItems.filter(b => {
    const matchStatus = activeFilter === 'Semua' || b.status.label === activeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || b.nama_barang.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q) || (b.kategori ?? '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const statCards = [
    { key: 'HABIS' as AlertStatus,       count: habisItems.length,     ...STATUS_CONFIG.HABIS },
    { key: 'RENDAH' as AlertStatus,      count: rendahItems.length,    ...STATUS_CONFIG.RENDAH },
    { key: 'HAMPIR MIN' as AlertStatus,  count: hampirMinItems.length, ...STATUS_CONFIG['HAMPIR MIN'] },
  ]

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="wt-page-title">Alert Stok</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
            Pantau produk dengan kondisi stok kritis, rendah, atau habis
          </p>
        </div>
        {alertItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
            <IcoAlert />
            {alertItems.length} produk butuh perhatian
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {statCards.map(s => (
          <button key={s.key}
            onClick={() => setActiveFilter(activeFilter === s.key ? 'Semua' : s.key)}
            style={{
              background: activeFilter === s.key ? s.bg : '#fff',
              borderRadius: 14,
              border: `1.5px solid ${activeFilter === s.key ? s.color : '#EAECF0'}`,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: '#6B7C74', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.count > 0 ? s.color : '#9CA3AF', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {s.count}
              </div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>
                {s.count === 0 ? 'Semua aman ✓' : 'produk'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Filter + Search ── */}
      <div className="wt-card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['Semua', 'HABIS', 'RENDAH', 'HAMPIR MIN'] as const).map(f => (
              <button key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid #EAECF0',
                  fontSize: 12.5, fontWeight: activeFilter === f ? 600 : 400, cursor: 'pointer',
                  background: activeFilter === f ? '#1A2E22' : '#fff',
                  color: activeFilter === f ? '#fff' : '#6B7C74',
                  transition: 'all 0.15s',
                }}>
                {f === 'Semua' ? `Semua (${alertItems.length})` : `${STATUS_CONFIG[f]?.label} (${alertItems.filter(b => b.status.label === f).length})`}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', border: '1px solid #EAECF0', borderRadius: 10, background: '#FAFAFA', marginLeft: 8 }}>
            <IcoSearch />
            <input
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13.5, outline: 'none', color: '#1A2E22' }}
              placeholder="Cari nama produk, SKU, atau kategori..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="wt-card">
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Memuat data…</div>
        ) : alertItems.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#1A2E22', marginBottom: 6 }}>Semua stok dalam kondisi baik</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>Tidak ada produk yang memerlukan perhatian saat ini.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Tidak ada produk yang cocok dengan filter ini.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Status</th>
                <th className="num">Stok Total</th>
                <th className="num">Batas Min</th>
                <th style={{ width: 200 }}>Level Stok</th>
                <th>Gudang</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const cfg   = STATUS_CONFIG[b.status.label as AlertStatus]
                const pct   = b.batas_minimum > 0 ? Math.min(100, Math.round((b.total_stok / b.batas_minimum) * 100)) : 0
                return (
                  <tr key={b.sku}
                    onClick={() => navigate({ to: '/products/$sku', params: { sku: b.sku } })}
                    style={{ cursor: 'pointer', background: activeFilter !== 'Semua' ? `${cfg?.bg}44` : 'transparent' }}>

                    {/* Produk */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1A2E22' }}>{b.nama_barang}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 1 }}>{b.sku}</div>
                    </td>

                    {/* Kategori */}
                    <td style={{ fontSize: 13, color: '#6B7C74' }}>{b.kategori ?? '—'}</td>

                    {/* Status badge */}
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                        background: cfg?.badgeBg, color: cfg?.badgeColor,
                      }}>
                        {b.status.label}
                      </span>
                    </td>

                    {/* Stok total */}
                    <td className="num">
                      <span style={{ fontWeight: 700, fontSize: 15, color: cfg?.color ?? '#1A2E22' }}>
                        {fmtNum(b.total_stok)}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#9CA3AF', marginLeft: 4 }}>{b.satuan}</span>
                    </td>

                    {/* Batas minimum */}
                    <td className="num" style={{ color: '#6B7C74', fontSize: 13 }}>{fmtNum(b.batas_minimum)}</td>

                    {/* Progress bar */}
                    <td style={{ paddingRight: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <StokBar stok={b.total_stok} min={b.batas_minimum} color={cfg?.color ?? '#9CA3AF'} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', width: 36, textAlign: 'right' }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 3 }}>
                        dari batas minimum
                      </div>
                    </td>

                    {/* Gudang */}
                    <td>
                      {b.stok_gudang.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Belum ada gudang</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {b.stok_gudang.map(sg => (
                            <span key={sg.id_gudang} style={{
                              fontSize: 11.5, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                              background: sg.kuantitas_stok === 0 ? '#F3F4F6' : '#EBF5EE',
                              color: sg.kuantitas_stok === 0 ? '#9CA3AF' : '#2E7D52',
                            }}>
                              {sg.gudang.kode_gudang}: {fmtNum(sg.kuantitas_stok)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Arrow */}
                    <td style={{ color: '#9CA3AF' }}><IcoArrow /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #F5F6FA', display: 'flex', gap: 24, fontSize: 12.5, color: '#6B7C74' }}>
            <span>Menampilkan <strong style={{ color: '#1A2E22' }}>{filtered.length}</strong> dari {alertItems.length} produk bermasalah</span>
            <span>Nilai stok terpengaruh: <strong style={{ color: '#1A2E22' }}>{fmtIDR(filtered.reduce((s, b) => s + b.harga * b.total_stok, 0))}</strong></span>
          </div>
        )}
      </div>
    </>
  )
}