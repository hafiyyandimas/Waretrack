import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGudang, createGudang, updateGudang, deleteGudang } from '../lib/queries'
import type { GudangRow } from '../lib/queries'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoPlus()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcoEdit()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IcoTrash() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> }
function IcoX()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IcoWH()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }

const GREEN = '#2E7D52'
const overlay:   React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }
const modalBox:  React.CSSProperties = { background:'#fff', borderRadius:16, padding:'28px 32px', width:'100%', maxWidth:400, boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }
const fl:        React.CSSProperties = { display:'block', fontSize:13, fontWeight:500, color:'#374151', marginBottom:6 }
const fi:        React.CSSProperties = { width:'100%', padding:'10px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, color:'#1A2E22', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }

// ── Modal Tambah / Edit ───────────────────────────────────────────────────────
function GudangModal({ mode, initial, onClose, onSaved }: {
  mode: 'create' | 'edit'; initial?: GudangRow; onClose: () => void; onSaved: () => void
}) {
  const [nama, setNama] = useState(initial?.nama_gudang ?? '')
  const [err,  setErr]  = useState('')
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => mode === 'create'
      ? createGudang({ data: { nama_gudang: nama } })
      : updateGudang({ data: { id_gudang: Number(initial!.id_gudang), nama_gudang: nama } }),
    onSuccess: (res: any) => {
      if (!res.ok) { setErr(res.error ?? 'Gagal menyimpan'); return }
      qc.invalidateQueries({ queryKey: ['gudang'] }); onSaved()
    },
    onError: (e: any) => setErr(e?.message ?? 'Gagal menyimpan'),
  })

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#1A2E22' }}>{mode === 'create' ? 'Tambah Gudang' : 'Edit Gudang'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><IcoX /></button>
        </div>

        {err && <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:14 }}>⚠ {err}</div>}

        <div style={{ marginBottom:24 }}>
          <label style={fl}>Nama Gudang <span style={{ color:'#EF4444' }}>*</span></label>
          <input style={fi} placeholder="Contoh: Gudang Utama Jakarta" value={nama} autoFocus
            onChange={e => { setNama(e.target.value); setErr('') }} />
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={mut.isPending}>Batal</button>
          <button className="btn btn-primary btn-sm"
            onClick={() => { if (!nama.trim()) { setErr('Nama gudang wajib diisi.'); return } mut.mutate() }}
            disabled={mut.isPending}>
            {mut.isPending ? 'Menyimpan…' : mode === 'create' ? 'Tambah Gudang' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Hapus ───────────────────────────────────────────────────────────────
function DeleteGudangModal({ gudang, onClose, onDeleted }: {
  gudang: GudangRow; onClose: () => void; onDeleted: () => void
}) {
  const [blocked, setBlocked] = useState(false)
  const [count,   setCount]   = useState(0)
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => deleteGudang({ data: Number(gudang.id_gudang) }),
    onSuccess: (res: any) => {
      if (res.hasStok) { setCount(res.count); setBlocked(true); return }
      qc.invalidateQueries({ queryKey: ['gudang'] }); onDeleted()
    },
  })

  if (blocked) return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:17, fontWeight:700, color:'#DC2626', marginBottom:12 }}>⚠ Gudang Masih Memiliki Stok</div>
        <p style={{ fontSize:14, color:'#374151', lineHeight:1.6, marginBottom:20 }}>
          <strong>{gudang.nama_gudang}</strong> masih memiliki <strong>{count}</strong> record stok barang.
          Pindahkan atau hapus stok terlebih dahulu.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Mengerti</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth:380 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:17, fontWeight:700, color:'#1A2E22', marginBottom:8 }}>Hapus Gudang?</div>
        <p style={{ fontSize:14, color:'#374151', lineHeight:1.6, marginBottom:24 }}>
          Gudang <strong>{gudang.nama_gudang}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={mut.isPending}>Batal</button>
          <button className="btn btn-sm" style={{ background:'#DC2626', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}
            onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Menghapus…' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Gudang() {
  const [showAdd,      setShowAdd]      = useState(false)
  const [editTarget,   setEditTarget]   = useState<GudangRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GudangRow | null>(null)

  const { data: gudangList = [], isLoading } = useQuery({
    queryKey: ['gudang'],
    queryFn:  () => getGudang(),
  })

  return (
    <>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="wt-page-title">Manajemen Gudang</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:3 }}>Kelola daftar gudang dalam sistem WareTrack</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <IcoPlus /> Tambah Gudang
        </button>
      </div>

      {/* Stat card — hanya 1 karena tidak ada status aktif/nonaktif di DB */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EAECF0', padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#EBF5EE', color:GREEN, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IcoWH />
          </div>
          <div>
            <div style={{ fontSize:12.5, color:'#6B7C74', marginBottom:4 }}>Total Gudang</div>
            <div style={{ fontSize:26, fontWeight:700, color:'#1A2E22', letterSpacing:'-0.02em', lineHeight:1 }}>{gudangList.length}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="wt-card">
        <div className="wt-card-header">
          <div className="wt-card-title">Daftar Gudang</div>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{gudangList.length} gudang terdaftar</span>
        </div>
        {isLoading ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Memuat data…</div>
        ) : gudangList.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>Belum ada gudang. Tambahkan gudang pertama.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama Gudang</th>
                <th style={{ width:100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(gudangList as GudangRow[]).map(g => (
                <tr key={String(g.id_gudang)}>
                  <td style={{ fontWeight:600, fontSize:13.5, color:'#1A2E22' }}>{g.nama_gudang}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding:'5px 10px' }}
                        onClick={() => setEditTarget(g)}>
                        <IcoEdit />
                      </button>
                      <button className="btn btn-sm" style={{ padding:'5px 10px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:8 }}
                        onClick={() => setDeleteTarget(g)}>
                        <IcoTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd      && <GudangModal mode="create" onClose={() => setShowAdd(false)} onSaved={() => setShowAdd(false)} />}
      {editTarget   && <GudangModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSaved={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteGudangModal gudang={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => setDeleteTarget(null)} />}
    </>
  )
}