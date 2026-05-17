import { useState, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fmtIDR, fmtNum, statusForStock } from '../lib/data'
import {
  getBarang, getBarangBySku, getGudang,
  createBarang, updateBarang, deleteBarang, deleteBarangForce,
  bulkCreateBarang, updateStokGudang, deleteStokGudang,
} from '../lib/queries'
import type { BarangRow, StokGudangRow, GudangRow } from '../lib/queries'

// ── Types ─────────────────────────────────────────────────────────────────────
type BarangFormData = {
  nama_barang: string
  sku: string
  kategori: string
  satuan: string
  batas_minimum: string
  harga: string
}
const EMPTY_FORM: BarangFormData = {
  nama_barang: '', sku: '', kategori: '', satuan: 'pcs',
  batas_minimum: '0', harga: '0',
}
const CSV_HEADERS = ['sku','nama_barang','kategori','satuan','batas_minimum','harga']
const PAGE_SIZE = 10

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ico = {
  Box:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Circle:   ({ c }: { c: string }) => <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill={c}/></svg>,
  Search:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Filter:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Plus:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  More:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Edit:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  X:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Back:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  ChevL:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Warehouse: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
function exportToCSV(data: BarangRow[]) {
  const rows = [
    CSV_HEADERS.join(','),
    ...data.map(p => [
      `"${p.sku}"`, `"${p.nama_barang}"`, `"${p.kategori ?? ''}"`,
      `"${p.satuan}"`, p.batas_minimum, p.harga,
    ].join(',')),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `produk_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map(line => {
    const fields: string[] = []; let cur = ''; let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { fields.push(cur); cur = ''; continue }
      cur += ch
    }
    fields.push(cur)
    return Object.fromEntries(headers.map((h, i) => [h, (fields[i] ?? '').trim()]))
  })
}

function csvRowToBarang(row: Record<string, string>) {
  const errors: string[] = []
  if (!row.sku)         errors.push('SKU kosong')
  if (!row.nama_barang) errors.push('Nama barang kosong')
  if (!row.satuan)      errors.push('Satuan kosong')
  const batas_minimum = parseInt(row.batas_minimum ?? '0', 10)
  const harga         = parseInt(row.harga ?? '0', 10)
  if (isNaN(batas_minimum)) errors.push('Batas minimum tidak valid')
  if (isNaN(harga))         errors.push('Harga tidak valid')
  if (errors.length) return { valid: false, errors, data: undefined }
  return {
    valid: true, errors: [],
    data: { sku: row.sku, nama_barang: row.nama_barang, kategori: row.kategori || undefined, satuan: row.satuan, batas_minimum, harga },
  }
}

// ── Modal: Tambah / Edit ──────────────────────────────────────────────────────
function ProductModal({
  mode, initial, onClose, onSaved,
}: {
  mode: 'create' | 'edit'
  initial?: BarangRow
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<BarangFormData>(
    initial
      ? { nama_barang: initial.nama_barang, sku: initial.sku, kategori: initial.kategori ?? '', satuan: initial.satuan, batas_minimum: String(initial.batas_minimum), harga: String(initial.harga) }
      : EMPTY_FORM
  )
  const [errors, setErrors] = useState<Partial<BarangFormData>>({})
  const [serverError, setServerError] = useState('')

  const createMut = useMutation({
    mutationFn: (d: typeof form) => createBarang({
      data: { nama_barang: d.nama_barang, sku: d.sku, kategori: d.kategori || undefined, satuan: d.satuan, batas_minimum: parseInt(d.batas_minimum, 10), harga: parseInt(d.harga, 10) },
    }),
    onSuccess: onSaved,
    onError: (e: any) => setServerError(e?.message ?? 'Gagal menyimpan'),
  })
  const updateMut = useMutation({
    mutationFn: (d: typeof form) => updateBarang({
      data: { sku: d.sku, nama_barang: d.nama_barang, kategori: d.kategori || null, satuan: d.satuan, batas_minimum: parseInt(d.batas_minimum, 10), harga: parseInt(d.harga, 10) },
    }),
    onSuccess: onSaved,
    onError: (e: any) => setServerError(e?.message ?? 'Gagal memperbarui'),
  })
  const isBusy = createMut.isPending || updateMut.isPending

  function set(f: keyof BarangFormData, v: string) {
    setForm(p => ({ ...p, [f]: v }))
    setErrors(e => ({ ...e, [f]: undefined }))
    setServerError('')
  }

  function validate() {
    const e: Partial<BarangFormData> = {}
    if (!form.nama_barang.trim()) e.nama_barang = 'Nama barang wajib diisi'
    if (!form.sku.trim())         e.sku          = 'SKU wajib diisi'
    if (!form.satuan.trim())      e.satuan        = 'Satuan wajib diisi'
    if (isNaN(parseInt(form.batas_minimum, 10))) e.batas_minimum = 'Angka tidak valid'
    if (isNaN(parseInt(form.harga, 10)))         e.harga         = 'Angka tidak valid'
    setErrors(e)
    return !Object.keys(e).length
  }

  function handleSubmit() {
    if (!validate()) return
    mode === 'create' ? createMut.mutate(form) : updateMut.mutate(form)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="modal-title">{mode === 'create' ? 'Tambah Produk Baru' : 'Edit Produk'}</div>
          <button className="icon-btn" onClick={onClose}><Ico.X /></button>
        </div>
        <p className="modal-sub">
          {mode === 'create'
            ? 'Isi informasi produk baru. Stok dapat diisi setelah produk ditambahkan via menu Stok Masuk.'
            : 'Ubah informasi produk'}
        </p>

        {serverError && (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', fontSize: 13, marginBottom: 14 }}>
            {serverError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Nama Barang <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-input" value={form.nama_barang} onChange={e => set('nama_barang', e.target.value)}
              placeholder="Contoh: Keyboard Mekanikal TKL" disabled={isBusy}
              style={errors.nama_barang ? { borderColor: '#EF4444' } : {}} />
            {errors.nama_barang && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.nama_barang}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">SKU <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-input"
              style={{ fontFamily: 'monospace', ...(mode === 'edit' ? { background: '#F5F6FA', color: '#9CA3AF' } : {}), ...(errors.sku ? { borderColor: '#EF4444' } : {}) }}
              value={form.sku} onChange={e => set('sku', e.target.value.toUpperCase())}
              placeholder="ELK-KB-0001" disabled={isBusy || mode === 'edit'} />
            {errors.sku && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.sku}</span>}
            {mode === 'edit' && <span style={{ fontSize: 11, color: '#9CA3AF' }}>SKU tidak dapat diubah</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <input className="form-input" value={form.kategori} onChange={e => set('kategori', e.target.value)}
              placeholder="Contoh: Elektronik" disabled={isBusy} />
          </div>

          <div className="form-group">
            <label className="form-label">Satuan <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-input" value={form.satuan} onChange={e => set('satuan', e.target.value)}
              placeholder="pcs / box / kg" disabled={isBusy}
              style={errors.satuan ? { borderColor: '#EF4444' } : {}} />
            {errors.satuan && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.satuan}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Harga (Rp) <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-input" type="number" min="0" value={form.harga}
              onChange={e => set('harga', e.target.value)} disabled={isBusy}
              style={errors.harga ? { borderColor: '#EF4444' } : {}} />
            {errors.harga && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.harga}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Batas Minimum Stok</label>
            <input className="form-input" type="number" min="0" value={form.batas_minimum}
              onChange={e => set('batas_minimum', e.target.value)} disabled={isBusy} />
            {errors.batas_minimum && <span style={{ fontSize: 11, color: '#EF4444' }}>{errors.batas_minimum}</span>}
          </div>
        </div>

        {mode === 'create' && (
          <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 10, background: '#EBF5EE', color: '#2E7D52', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ico.Warehouse />
            Setelah produk dibuat, tambahkan stok ke gudang lewat menu <strong>Stok Masuk</strong>.
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={isBusy}>Batal</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={isBusy}>
            {isBusy ? 'Menyimpan…' : mode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Edit Stok Gudang (dari detail produk) ──────────────────────────────
function EditStokGudangModal({
  idBarang, satuan, stokGudang, gudangList, onClose, onSaved,
}: {
  idBarang: number
  satuan: string
  stokGudang: StokGudangRow | null   // null = tambah ke gudang baru
  gudangList: GudangRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = stokGudang === null
  const [idGudang, setIdGudang] = useState(isNew ? '' : String(stokGudang!.id_gudang))
  const [stok, setStok]         = useState(isNew ? '' : String(stokGudang!.kuantitas_stok))
  const [err, setErr]           = useState('')

  const mut = useMutation({
    mutationFn: () => updateStokGudang({
      data: { id_barang: idBarang, id_gudang: Number(idGudang), kuantitas_stok: Number(stok) },
    }),
    onSuccess: onSaved,
    onError: (e: any) => setErr(e?.message ?? 'Gagal menyimpan'),
  })

  function handleSubmit() {
    if (!idGudang)               return setErr('Pilih gudang.')
    if (stok === '' || Number(stok) < 0) return setErr('Stok tidak valid.')
    mut.mutate()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="modal-title">{isNew ? 'Tambah Stok ke Gudang' : `Edit Stok — ${stokGudang!.gudang.nama_gudang}`}</div>
          <button className="icon-btn" onClick={onClose}><Ico.X /></button>
        </div>
        <p className="modal-sub">Set jumlah stok secara langsung untuk gudang yang dipilih.</p>

        {err && <div style={{ padding: '8px 12px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Gudang</label>
          {isNew ? (
            <select className="form-input" value={idGudang} onChange={e => { setIdGudang(e.target.value); setErr('') }}
              style={{ cursor: 'pointer' }}>
              <option value="">— Pilih Gudang —</option>
              {gudangList.map(g => (
                <option key={g.id_gudang} value={g.id_gudang}>{g.nama_gudang}</option>
              ))}
            </select>
          ) : (
            <input className="form-input" value={stokGudang!.gudang.nama_gudang} disabled
              style={{ background: '#F5F6FA', color: '#9CA3AF' }} />
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Jumlah Stok ({satuan})</label>
          <input className="form-input" type="number" min="0" value={stok}
            onChange={e => { setStok(e.target.value); setErr('') }}
            placeholder="0" disabled={mut.isPending} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={mut.isPending}>Batal</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={mut.isPending}>
            {mut.isPending ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Import CSV ─────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [step, setStep]       = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows]       = useState<any[]>([])
  const [result, setResult]   = useState<any>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const importMut = useMutation({
    mutationFn: (validRows: any[]) => bulkCreateBarang({ data: validRows }),
    onSuccess: (res) => { setResult(res); setStep('done'); onImported() },
  })

  function processFile(file: File) {
    setFileError('')
    if (!file.name.endsWith('.csv')) { setFileError('File harus berformat .csv'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string)
      if (!parsed.length) { setFileError('File CSV kosong atau format tidak dikenali'); return }
      setRows(parsed.map((r, i) => { const res = csvRowToBarang(r); return { row: i + 2, ...res } }))
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const sample = [
      CSV_HEADERS.join(','),
      '"ELK-KB-0001","Keyboard Mekanikal TKL","Komputer","pcs","15","820000"',
    ].join('\n')
    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'template_produk.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const validCount   = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 580 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="modal-title">Import Produk dari CSV</div>
          <button className="icon-btn" onClick={onClose}><Ico.X /></button>
        </div>
        <p className="modal-sub">Upload file CSV untuk menambahkan produk secara massal (tanpa stok)</p>

        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? '#2E7D52' : '#EAECF0'}`, borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#F0F9F4' : '#FAFAFA', transition: 'all 150ms' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Seret &amp; lepas file CSV di sini</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>atau klik untuk pilih file</div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
            </div>
            {fileError && <div style={{ padding: '8px 12px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', fontSize: 13 }}>{fileError}</div>}
            <div style={{ background: '#F5F6FA', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Format kolom: <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7C74' }}>{CSV_HEADERS.join(', ')}</span></div>
              <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); downloadTemplate() }}><Ico.Download /> Unduh template CSV</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#DCFCE7', color: '#16A34A', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 22 }}>{validCount}</div>
                <div style={{ fontSize: 12 }}>baris valid</div>
              </div>
              {invalidCount > 0 && (
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 22 }}>{invalidCount}</div>
                  <div style={{ fontSize: 12 }}>baris error</div>
                </div>
              )}
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #EAECF0', borderRadius: 10 }}>
              <table style={{ width: '100%', fontSize: 12 }}>
                <thead><tr style={{ background: '#FAFAFA' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>SKU</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Nama</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Harga</th>
                  <th style={{ padding: '6px 10px' }}>Status</th>
                </tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.row} style={{ borderTop: '1px solid #F5F6FA', background: r.valid ? 'transparent' : '#FFF5F5' }}>
                    <td style={{ padding: '6px 10px', color: '#9CA3AF' }}>{r.row}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{r.data?.sku ?? '—'}</td>
                    <td style={{ padding: '6px 10px' }}>{r.data?.nama_barang ?? '—'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{r.data ? fmtIDR(r.data.harga) : '—'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      {r.valid
                        ? <span style={{ color: '#16A34A', fontWeight: 600 }}>✓</span>
                        : <span style={{ fontSize: 11, color: '#DC2626' }}>{r.errors.join(', ')}</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Import selesai!</div>
            <div style={{ color: '#6B7C74', fontSize: 14 }}>
              <span style={{ color: '#16A34A', fontWeight: 600 }}>{result.succeeded}</span> produk berhasil disimpan
              {result.failed > 0 && <>, <span style={{ color: '#DC2626', fontWeight: 600 }}>{result.failed}</span> gagal</>}
            </div>
          </div>
        )}

        <div className="modal-footer">
          {step === 'upload' && <button className="btn btn-secondary btn-sm" onClick={onClose}>Batal</button>}
          {step === 'preview' && <>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep('upload')}><Ico.ChevL /> Ganti file</button>
            <button className="btn btn-primary btn-sm"
              onClick={() => importMut.mutate(rows.filter(r => r.valid && r.data).map((r: any) => r.data))}
              disabled={validCount === 0 || importMut.isPending}>
              {importMut.isPending ? 'Mengimpor…' : `Import ${validCount} Produk`}
            </button>
          </>}
          {step === 'done' && <button className="btn btn-primary btn-sm" onClick={onClose}>Selesai</button>}
        </div>
      </div>
    </div>
  )
}

// ── Modal: Hapus ──────────────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onDeleted }: {
  product: BarangRow; onClose: () => void; onDeleted: () => void
}) {
  const [step, setStep]       = useState<'confirm' | 'warn'>('confirm')
  const [trxCount, setTrxCount] = useState(0)

  const deleteMut = useMutation({
    mutationFn: () => deleteBarang({ data: product.sku }),
    onSuccess: (res: any) => {
      if (res.hasTransaksi) { setTrxCount(res.count); setStep('warn') }
      else onDeleted()
    },
  })
  const forceMut = useMutation({
    mutationFn: () => deleteBarangForce({ data: product.sku }),
    onSuccess: onDeleted,
  })

  if (step === 'confirm') return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
        <div style={{ padding: 'var(--modal-padding, 20px 24px 0)' }}>
          <div className="modal-title">Hapus Produk?</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Tindakan ini tidak dapat dibatalkan.</div>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            Produk <strong>{product.nama_barang}</strong> (<span className="mono">{product.sku}</span>) akan dihapus permanen beserta semua data stok gudang terkait.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={deleteMut.isPending}>Batal</button>
          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
            onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
            {deleteMut.isPending ? 'Memeriksa…' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 440 }}>
        <div style={{ padding: 'var(--modal-padding, 20px 24px 0)' }}>
          <div className="modal-title" style={{ color: 'var(--danger)' }}>⚠ Produk Memiliki Riwayat Transaksi</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Harap baca peringatan di bawah sebelum melanjutkan.</div>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--danger-bg, #fee2e2)', border: '1px solid var(--danger)', fontSize: 13, lineHeight: 1.6, color: 'var(--danger)' }}>
            Produk <strong>{product.nama_barang}</strong> masih tercatat dalam <strong>{trxCount} riwayat transaksi</strong>.
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>
            Jika dilanjutkan, <strong>semua {trxCount} transaksi terkait</strong> akan ikut dihapus permanen.
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            💡 Alternatif: Biarkan produk ini dan hapus data transaksinya dari menu Stok Masuk / Stok Keluar.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={forceMut.isPending}>Batal, jangan hapus</button>
          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
            onClick={() => forceMut.mutate()} disabled={forceMut.isPending}>
            {forceMut.isPending ? 'Menghapus…' : `Hapus produk + ${trxCount} transaksi`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Row Menu ──────────────────────────────────────────────────────────────────
function RowMenu({ onEdit, onDelete, onClose, anchor }: {
  onEdit: () => void; onDelete: () => void; onClose: () => void; anchor: DOMRect | null
}) {
  const style: React.CSSProperties = anchor
    ? { position: 'fixed', top: anchor.bottom + 4, right: window.innerWidth - anchor.right, zIndex: 50 }
    : { position: 'absolute', right: 0, top: '100%', zIndex: 50 }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div style={{ ...style, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,.12))', minWidth: 160, padding: '4px 0' }}>
        <button onClick={() => { onClose(); onEdit() }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <Ico.Edit /> Edit produk
        </button>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <button onClick={() => { onClose(); onDelete() }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-bg, #fee2e2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <Ico.Trash /> Hapus produk
        </button>
      </div>
    </>
  )
}

// ── Stok Gudang Row Menu (titik tiga di detail produk) ────────────────────────
function StokGudangMenu({ sg, satuan, idBarang, gudangList, onClose, onSaved, anchor }: {
  sg: StokGudangRow
  satuan: string
  idBarang: number
  gudangList: GudangRow[]
  onClose: () => void
  onSaved: () => void
  anchor: DOMRect | null
}) {
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const deleteMut = useMutation({
    mutationFn: () => deleteStokGudang({ data: { id_barang: idBarang, id_gudang: sg.id_gudang } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['barang'] }); onSaved() },
  })

  const style: React.CSSProperties = anchor
    ? { position: 'fixed', top: anchor.bottom + 4, right: window.innerWidth - anchor.right, zIndex: 50 }
    : { position: 'absolute', right: 0, top: '100%', zIndex: 50 }

  if (showEdit) return (
    <EditStokGudangModal
      idBarang={idBarang} satuan={satuan} stokGudang={sg} gudangList={gudangList}
      onClose={() => { setShowEdit(false); onClose() }}
      onSaved={() => { setShowEdit(false); queryClient.invalidateQueries({ queryKey: ['barang'] }); onSaved() }}
    />
  )

  if (showConfirm) return (
    <div className="modal-overlay" onClick={() => { setShowConfirm(false); onClose() }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
        <div className="modal-title" style={{ marginBottom: 8 }}>Hapus Stok dari {sg.gudang.nama_gudang}?</div>
        <div className="modal-body">
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            Semua stok produk ini (<strong>{sg.kuantitas_stok}</strong>) di <strong>{sg.gudang.nama_gudang}</strong> akan dihapus. Transaksi lama tidak terpengaruh.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowConfirm(false); onClose() }}>Batal</button>
          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
            onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
            {deleteMut.isPending ? 'Menghapus…' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div style={{ ...style, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 180, padding: '4px 0' }}>
        <button onClick={() => setShowEdit(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <Ico.Edit /> Edit stok di gudang ini
        </button>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <button onClick={() => setShowConfirm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-bg, #fee2e2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <Ico.Trash /> Hapus dari gudang ini
        </button>
      </div>
    </>
  )
}

// ── Main Products page ────────────────────────────────────────────────────────
export function Products() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('Semua')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [page, setPage]               = useState(1)
  const [showCreate, setShowCreate]   = useState(false)
  const [showImport, setShowImport]   = useState(false)
  const [editTarget, setEditTarget]   = useState<BarangRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BarangRow | null>(null)
  const [openMenuSku, setOpenMenuSku] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor]   = useState<DOMRect | null>(null)

  const { data: barang = [], isLoading } = useQuery({ queryKey: ['barang'], queryFn: () => getBarang() })
  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['barang'] }), [queryClient])

  const categories = ['Semua', ...Array.from(new Set(barang.map((p: BarangRow) => p.kategori ?? 'Lainnya')))]

  const filtered = barang.filter((p: BarangRow) => {
    const matchCat    = filterCat === 'Semua' || (filterCat === 'Lainnya' ? !p.kategori : p.kategori === filterCat)
    const q           = search.toLowerCase()
    const gudangNames = p.stok_gudang.map(sg => sg.gudang.nama_gudang.toLowerCase()).join(' ')
    const matchSearch = !q || p.nama_barang.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || gudangNames.includes(q)
    const s           = statusForStock(p.total_stok, p.batas_minimum)
    const matchStatus = filterStatus === 'Semua' || s.label === filterStatus
    return matchCat && matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const items      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalProduk = barang.length
  const produkAktif = barang.filter((p: BarangRow) => p.total_stok > 0).length
  const stokRendah  = barang.filter((p: BarangRow) => p.total_stok > 0 && p.total_stok <= p.batas_minimum).length
  const stokHabis   = barang.filter((p: BarangRow) => p.total_stok === 0).length

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="wt-page-title">Manajemen Produk</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Kelola semua produk dan inventaris Anda</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowImport(true)}><Ico.Upload /> Import CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Ico.Plus /> Tambah Produk</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Produk', value: fmtNum(totalProduk), icon: <Ico.Box />, iconBg: '#EBF5EE', iconColor: '#2E7D52' },
          { label: 'Produk Aktif', value: fmtNum(produkAktif), icon: <Ico.Circle c="#16A34A" />, iconBg: '#DCFCE7', iconColor: '#16A34A' },
          { label: 'Stok Rendah',  value: fmtNum(stokRendah),  icon: <Ico.Circle c="#D97706" />, iconBg: '#FEF9C3', iconColor: '#D97706' },
          { label: 'Stok Habis',   value: fmtNum(stokHabis),   icon: <Ico.Circle c="#DC2626" />, iconBg: '#FEE2E2', iconColor: '#DC2626' },
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

      {/* Search + filter */}
      <div className="wt-card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid #EAECF0', borderRadius: 10, background: '#FAFAFA', marginBottom: 12 }}>
          <Ico.Search />
          <input style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#1A2E22' }}
            placeholder="Cari nama produk, SKU, atau gudang..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}
            className="form-select" style={{ width: 160, padding: '8px 12px', fontSize: 13 }}>
            {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="form-select" style={{ width: 160, padding: '8px 12px', fontSize: 13 }}>
            {['Semua', 'NORMAL', 'HAMPIR MIN', 'RENDAH', 'HABIS'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(barang)}><Ico.Download /> Ekspor</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="wt-card">
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Memuat data…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            {search ? `Tidak ada produk untuk "${search}"` : 'Belum ada produk. Tambahkan produk pertama Anda.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th className="num">Total Stok</th>
                <th className="num">Harga</th>
                <th>Gudang</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p: BarangRow) => {
                const s = statusForStock(p.total_stok, p.batas_minimum)
                const gudangLabels = p.stok_gudang.length > 0
                  ? p.stok_gudang.map(sg => sg.gudang.nama_gudang).join(', ')
                  : '—'
                return (
                  <tr key={p.sku} onClick={() => navigate({ to: '/products/$sku', params: { sku: p.sku } })} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#6B7C74' }}>{p.sku}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1A2E22' }}>{p.nama_barang}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{p.satuan}</div>
                    </td>
                    <td style={{ color: '#6B7C74', fontSize: 13 }}>{p.kategori ?? '—'}</td>
                    <td className="num">
                      <div style={{ fontWeight: 600, color: p.total_stok === 0 ? '#DC2626' : p.total_stok <= p.batas_minimum ? '#D97706' : '#1A2E22' }}>
                        {fmtNum(p.total_stok)}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>/ min {p.batas_minimum}</div>
                    </td>
                    <td className="num" style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>Rp</div>
                      <div style={{ fontWeight: 600 }}>{fmtNum(p.harga)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.stok_gudang.length === 0
                          ? <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                          : p.stok_gudang.map(sg => (
                              <span key={sg.id_gudang} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#EBF5EE', color: '#2E7D52', fontWeight: 600 }}>
                                {sg.gudang.nama_gudang.slice(-1)}: {fmtNum(sg.kuantitas_stok)}
                              </span>
                            ))
                        }
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button className="icon-btn" onClick={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        if (openMenuSku === p.sku) { setOpenMenuSku(null); setMenuAnchor(null) }
                        else { setOpenMenuSku(p.sku); setMenuAnchor(rect) }
                      }}>
                        <Ico.More />
                      </button>
                      {openMenuSku === p.sku && (
                        <RowMenu
                          onEdit={() => setEditTarget(p)}
                          onDelete={() => setDeleteTarget(p)}
                          onClose={() => { setOpenMenuSku(null); setMenuAnchor(null) }}
                          anchor={menuAnchor}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #F5F6FA', fontSize: 13, color: '#6B7C74' }}>
          <div>Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {fmtNum(filtered.length)} produk</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #EAECF0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#9CA3AF' : '#374151', fontSize: 13, fontWeight: 500 }}>
              Sebelumnya
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #EAECF0', background: page === n ? '#2E7D52' : '#fff', color: page === n ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: page === n ? 700 : 400 }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #EAECF0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#9CA3AF' : '#374151', fontSize: 13, fontWeight: 500 }}>
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate   && <ProductModal mode="create" onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); invalidate() }} />}
      {editTarget   && <ProductModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); invalidate() }} />}
      {deleteTarget && <DeleteModal product={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => { setDeleteTarget(null); invalidate() }} />}
      {showImport   && <ImportModal onClose={() => setShowImport(false)} onImported={invalidate} />}
    </>
  )
}

// ── Product Detail ────────────────────────────────────────────────────────────
export function ProductDetail({ sku }: { sku: string }) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [showEdit, setShowEdit]     = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showAddGudang, setShowAddGudang] = useState(false)
  const [openStokMenuId, setOpenStokMenuId] = useState<number | null>(null)
  const [stokMenuAnchor, setStokMenuAnchor] = useState<DOMRect | null>(null)

  const { data: p, isLoading } = useQuery({
    queryKey: ['barang', sku],
    queryFn:  () => getBarangBySku({ data: sku }),
  })
  const { data: gudangList = [] } = useQuery({
    queryKey: ['gudang'],
    queryFn:  () => getGudang(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['barang', sku] })
    queryClient.invalidateQueries({ queryKey: ['barang'] })
  }

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Memuat…</div>
  if (!p) return <div style={{ padding: 40 }}>Produk tidak ditemukan.</div>

  const s         = statusForStock(p.total_stok, p.batas_minimum)
  const badgeColor = s.kind === 'ok' ? { bg: '#DCFCE7', color: '#16A34A' } : s.kind === 'warn' ? { bg: '#FEF9C3', color: '#CA8A04' } : { bg: '#FEE2E2', color: '#DC2626' }

  // Gudang yang belum punya stok produk ini (untuk tombol "Tambah ke Gudang")
  const gudangTerpakai = new Set(p.stok_gudang.map(sg => sg.id_gudang))
  const gudangTersedia = (gudangList as GudangRow[]).filter(g => !gudangTerpakai.has(g.id_gudang))

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate({ to: '/products' })} style={{ marginBottom: 16 }}>
        <Ico.Back /> Kembali ke Produk
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="wt-page-title">{p.nama_barang}</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3, fontFamily: 'monospace' }}>{p.sku} · {p.satuan} · {p.kategori ?? '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}><Ico.Edit /> Edit</button>
          <button className="btn btn-sm" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }} onClick={() => setShowDelete(true)}><Ico.Trash /> Hapus</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Informasi Produk */}
          <div className="wt-card">
            <div className="wt-card-header"><div className="wt-card-title">Informasi Produk</div></div>
            <div className="wt-card-body">
              {[
                ['SKU',      p.sku],
                ['Nama',     p.nama_barang],
                ['Kategori', p.kategori ?? '—'],
                ['Satuan',   p.satuan],
                ['Harga',    fmtIDR(p.harga)],
                ['Dibuat',   new Date(p.created_at).toLocaleDateString('id-ID')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F6FA', fontSize: 13.5 }}>
                  <span style={{ color: '#6B7C74' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#1A2E22', fontFamily: k === 'SKU' || k === 'Harga' ? 'monospace' : undefined }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Stok per Gudang */}
          <div className="wt-card">
            <div className="wt-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="wt-card-title">Detail Stok per Gudang</div>
              {gudangTersedia.length > 0 && (
                <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => setShowAddGudang(true)}>
                  <Ico.Plus /> Tambah ke Gudang
                </button>
              )}
            </div>
            {p.stok_gudang.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                Belum ada stok di gudang manapun.<br />
                <span style={{ fontSize: 12 }}>Tambahkan stok lewat menu <strong>Stok Masuk</strong> atau tombol di atas.</span>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nama Gudang</th>
                    <th className="num">Stok</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {p.stok_gudang.map(sg => (
                    <tr key={sg.id_gudang}>
                      <td style={{ fontWeight: 600, fontSize: 13.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: '#EBF5EE', color: '#2E7D52', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                            {sg.gudang.nama_gudang.slice(-1)}
                          </span>
                          {sg.gudang.nama_gudang}
                        </div>
                      </td>
                      <td className="num">
                        <span style={{ fontWeight: 700, fontSize: 15, color: sg.kuantitas_stok === 0 ? '#DC2626' : '#1A2E22' }}>
                          {fmtNum(sg.kuantitas_stok)}
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>{p.satuan}</span>
                      </td>
                      <td style={{ position: 'relative' }}>
                        <button className="icon-btn" onClick={e => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          if (openStokMenuId === sg.id_gudang) { setOpenStokMenuId(null); setStokMenuAnchor(null) }
                          else { setOpenStokMenuId(sg.id_gudang); setStokMenuAnchor(rect) }
                        }}>
                          <Ico.More />
                        </button>
                        {openStokMenuId === sg.id_gudang && (
                          <StokGudangMenu
                            sg={sg} satuan={p.satuan} idBarang={p.id_barang}
                            gudangList={gudangList as GudangRow[]}
                            anchor={stokMenuAnchor}
                            onClose={() => { setOpenStokMenuId(null); setStokMenuAnchor(null) }}
                            onSaved={() => { setOpenStokMenuId(null); setStokMenuAnchor(null); invalidate() }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Kolom kanan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stok card */}
          <div className="wt-card">
            <div className="wt-card-body" style={{ paddingTop: 20 }}>
              <div style={{ fontSize: 12.5, color: '#6B7C74', marginBottom: 8 }}>Total Stok (semua gudang)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A2E22' }}>{p.total_stok}</span>
                <span style={{ color: '#9CA3AF' }}>{p.satuan}</span>
                <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badgeColor.bg, color: badgeColor.color }}>{s.label}</span>
              </div>
              <div className="wt-progress">
                <div className="wt-progress-bar" style={{ width: `${Math.min(100, (p.total_stok / (p.batas_minimum * 3 || 1)) * 100)}%`, background: s.kind === 'ok' ? '#16A34A' : s.kind === 'warn' ? '#D97706' : '#DC2626' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                <span>Min: {p.batas_minimum}</span><span>Target: {p.batas_minimum * 3}</span>
              </div>
            </div>
          </div>

          {/* Harga & Nilai */}
          <div className="wt-card">
            <div className="wt-card-header"><div className="wt-card-title">Harga &amp; Nilai</div></div>
            <div className="wt-card-body">
              {[
                ['Harga Beli (est.)', fmtIDR(Math.round(p.harga * 0.72))],
                ['Harga Jual',        fmtIDR(p.harga)],
                ['Margin (est.)',     '28%'],
                ['Nilai Stok',        fmtIDR(p.harga * p.total_stok)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F6FA', fontSize: 13.5 }}>
                  <span style={{ color: '#6B7C74' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#1A2E22', fontFamily: 'monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <ProductModal mode="edit" initial={p}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); invalidate() }} />
      )}
      {showDelete && (
        <DeleteModal product={p}
          onClose={() => setShowDelete(false)}
          onDeleted={() => { setShowDelete(false); navigate({ to: '/products' }); queryClient.invalidateQueries({ queryKey: ['barang'] }) }} />
      )}
      {showAddGudang && (
        <EditStokGudangModal
          idBarang={p.id_barang} satuan={p.satuan} stokGudang={null}
          gudangList={gudangTersedia}
          onClose={() => setShowAddGudang(false)}
          onSaved={() => { setShowAddGudang(false); invalidate() }} />
      )}
    </>
  )
}