import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, registerUser, updateUser, deleteUser, getAuditLog, createAuditLog, approvePasswordReset, cancelPasswordReset } from '../lib/queries'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoPlus()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcoUsers()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcoShield()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function IcoMail()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> }
function IcoEdit()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IcoTrash()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function IcoMore()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg> }
function IcoX()        { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IcoLog()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }

// ── Constants ─────────────────────────────────────────────────────────────────
const GREEN = '#2E7D52'

const ROLE_OPTIONS = ['Admin', 'Staff Gudang', 'Operator Gudang']

const ROLES_CONFIG = [
  {
    nama: 'Admin',
    perms: ['Semua Akses', 'Kelola User', 'Kelola Gudang'],
    iconBg: '#FEF9C3', iconColor: '#CA8A04',
  },
  {
    nama: 'Staff Gudang',
    perms: ['Kelola Stok', 'Lihat Laporan', 'Akses Gudang'],
    iconBg: '#EBF5EE', iconColor: GREEN,
  },
  {
    nama: 'Operator Gudang',
    perms: ['Kelola Stok', 'Lihat Laporan'],
    iconBg: '#EFF6FF', iconColor: '#2563EB',
  },
]

// ── Helper ────────────────────────────────────────────────────────────────────
function getAktorId(): number | null {
  try {
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!stored) return null
    return JSON.parse(stored).id_pengguna ?? null
  } catch { return null }
}

// ── ResetPasswordCell ─────────────────────────────────────────────────────────
function ResetPasswordCell({ user }: { user: any }) {
  const qc    = useQueryClient()
  const token = user.token as string | null

  const approveMut = useMutation({
    mutationFn: () => approvePasswordReset({ data: Number(user.id_pengguna) }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const cancelMut = useMutation({
    mutationFn: () => cancelPasswordReset({ data: Number(user.id_pengguna) }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const isPending = token === 'pending'
  const isActive  = token && token !== 'pending' && (() => {
    const [, expStr] = token.split(':')
    return Date.now() < parseInt(expStr, 10)
  })()

  if (!token) return <span style={{ fontSize:12, color:'#9CA3AF' }}>—</span>

  if (isPending) return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <span style={{ fontSize:11.5, padding:'3px 8px', borderRadius:20, background:'#FEF9C3', color:'#CA8A04', fontWeight:600 }}>Menunggu</span>
      <button className="btn btn-primary btn-sm" style={{ fontSize:11, padding:'4px 10px' }}
        onClick={() => approveMut.mutate()} disabled={approveMut.isPending}>
        {approveMut.isPending ? '…' : 'Setujui'}
      </button>
      <button className="btn btn-sm" style={{ fontSize:11, padding:'4px 10px', background:'#FEE2E2', color:'#DC2626', border:'none' }}
        onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
        Tolak
      </button>
    </div>
  )

  if (isActive) {
    const [code] = token.split(':')
    return (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <span style={{ fontSize:11.5, padding:'3px 8px', borderRadius:20, background:'#DCFCE7', color:'#16A34A', fontWeight:600 }}>
          Token: <span style={{ fontFamily:'monospace' }}>{code}</span>
        </span>
        <button className="btn btn-sm" style={{ fontSize:11, padding:'4px 10px', background:'#FEE2E2', color:'#DC2626', border:'none' }}
          onClick={() => cancelMut.mutate()}>
          Batalkan
        </button>
      </div>
    )
  }

  return (
    <span style={{ fontSize:11.5, color:'#9CA3AF', cursor:'pointer' }} onClick={() => cancelMut.mutate()}>
      Kadaluarsa ✕
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors   = ['#2E7D52','#3B82F6','#7C3AED','#EA580C','#0891B2','#CA8A04']
  const color    = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, color:'#fff', fontSize:size*0.33, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {initials}
    </div>
  )
}

function PermTag({ label }: { label: string }) {
  return (
    <span style={{ padding:'3px 10px', borderRadius:6, background:'#F0F9F4', border:'1px solid #D1FAE5', fontSize:11.5, color:'#2E7D52', fontWeight:500 }}>
      {label}
    </span>
  )
}

// ── Modal styles ──────────────────────────────────────────────────────────────
const overlay:     React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }
const modalBox:    React.CSSProperties = { background:'#fff', borderRadius:16, padding:'28px 32px', width:'100%', maxWidth:460, boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }
const modalTitle:  React.CSSProperties = { fontSize:18, fontWeight:700, color:'#1A2E22', margin:'0 0 4px' }
const modalSub:    React.CSSProperties = { fontSize:13, color:'#9CA3AF', margin:'0 0 24px' }
const fieldGroup:  React.CSSProperties = { marginBottom:16 }
const fieldLabel:  React.CSSProperties = { display:'block', fontSize:13, fontWeight:500, color:'#374151', marginBottom:6 }
const fieldInput:  React.CSSProperties = { width:'100%', padding:'10px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, color:'#1A2E22', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }
const fieldSelect: React.CSSProperties = { ...fieldInput, cursor:'pointer' }
const errStyle:    React.CSSProperties = { fontSize:12, color:'#EF4444', marginTop:4, display:'block' }
const modalFooter: React.CSSProperties = { display:'flex', justifyContent:'flex-end', gap:8, marginTop:24 }

// ── Modal: Tambah Pengguna ────────────────────────────────────────────────────
interface AddUserForm { nama_lengkap: string; username: string; password: string; role: string }

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm]           = useState<AddUserForm>({ nama_lengkap:'', username:'', password:'', role:'Operator Gudang' })
  const [errors, setErrors]       = useState<Partial<AddUserForm>>({})
  const [serverErr, setServerErr] = useState('')
  const queryClient               = useQueryClient()

  const mut = useMutation({
    mutationFn: async (f: AddUserForm) => {
      const res = await registerUser({ data: { nama_lengkap: f.nama_lengkap, username: f.username, password: f.password } })
      if (!res.ok) throw new Error(res.error)
      if (res.user) {
        await updateUser({ data: { id_pengguna: res.user.id_pengguna, role: f.role } })
      }
      await createAuditLog({ data: {
        id_pengguna: getAktorId(),
        aksi: `Menambahkan pengguna baru: ${f.nama_lengkap} (${f.role})`,
      }})
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['audit_log'] })
      onSaved()
    },
    onError: (e: any) => setServerErr(e?.message ?? 'Gagal menambah pengguna.'),
  })

  function set(k: keyof AddUserForm, v: string) {
    setForm(p => ({ ...p, [k]:v }))
    setErrors(p => { const n={...p}; delete n[k]; return n })
    setServerErr('')
  }

  function validate() {
    const e: Partial<AddUserForm> = {}
    if (!form.nama_lengkap.trim()) e.nama_lengkap = 'Nama lengkap wajib diisi.'
    if (!form.username.trim())     e.username     = 'Username wajib diisi.'
    if (!form.password)            e.password     = 'Password wajib diisi.'
    else if (form.password.length < 6) e.password = 'Minimal 6 karakter.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={modalTitle}>Tambah Pengguna</div>
            <div style={modalSub}>Buat akun baru untuk anggota tim</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:4 }}><IcoX /></button>
        </div>

        {serverErr && (
          <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', color:'#991B1B', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:16 }}>
            ⚠ {serverErr}
          </div>
        )}

        <div style={fieldGroup}>
          <label style={fieldLabel}>Nama Lengkap <span style={{ color:'#EF4444' }}>*</span></label>
          <input style={{ ...fieldInput, borderColor: errors.nama_lengkap ? '#F87171' : '#E5E7EB' }}
            placeholder="Contoh: Budi Santoso" value={form.nama_lengkap}
            onChange={e => set('nama_lengkap', e.target.value)} autoFocus />
          {errors.nama_lengkap && <span style={errStyle}>{errors.nama_lengkap}</span>}
        </div>

        <div style={fieldGroup}>
          <label style={fieldLabel}>Username <span style={{ color:'#EF4444' }}>*</span></label>
          <input style={{ ...fieldInput, borderColor: errors.username ? '#F87171' : '#E5E7EB' }}
            placeholder="Contoh: budi.santoso" value={form.username}
            onChange={e => set('username', e.target.value)} />
          {errors.username && <span style={errStyle}>{errors.username}</span>}
        </div>

        <div style={fieldGroup}>
          <label style={fieldLabel}>Password <span style={{ color:'#EF4444' }}>*</span></label>
          <input style={{ ...fieldInput, borderColor: errors.password ? '#F87171' : '#E5E7EB' }}
            type="password" placeholder="Minimal 6 karakter" value={form.password}
            onChange={e => set('password', e.target.value)} />
          {errors.password && <span style={errStyle}>{errors.password}</span>}
        </div>

        <div style={fieldGroup}>
          <label style={fieldLabel}>Role</label>
          <select style={fieldSelect} value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={modalFooter}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={mut.isPending}>Batal</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (validate()) mut.mutate(form) }} disabled={mut.isPending}>
            {mut.isPending ? 'Menyimpan…' : 'Tambah Pengguna'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Edit Pengguna ──────────────────────────────────────────────────────
interface EditUserForm { nama_lengkap: string; role: string; password: string }

function EditUserModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm]           = useState<EditUserForm>({ nama_lengkap: user.nama_lengkap, role: user.role, password:'' })
  const [errors, setErrors]       = useState<Partial<EditUserForm>>({})
  const [serverErr, setServerErr] = useState('')
  const queryClient               = useQueryClient()

  const mut = useMutation({
    mutationFn: async (f: EditUserForm) => {
      await updateUser({ data: {
        id_pengguna:  user.id_pengguna,
        nama_lengkap: f.nama_lengkap,
        role:         f.role,
        ...(f.password ? { password: f.password } : {}),
      }})
      await createAuditLog({ data: {
        id_pengguna: getAktorId(),
        aksi: `Mengubah data pengguna: ${user.nama_lengkap}${f.role !== user.role ? ` → role diubah ke ${f.role}` : ''}`,
      }})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['audit_log'] })
      onSaved()
    },
    onError: (e: any) => setServerErr(e?.message ?? 'Gagal mengupdate pengguna.'),
  })

  function set(k: keyof EditUserForm, v: string) {
    setForm(p => ({ ...p, [k]:v }))
    setErrors(p => { const n={...p}; delete n[k]; return n })
    setServerErr('')
  }

  function validate() {
    const e: Partial<EditUserForm> = {}
    if (!form.nama_lengkap.trim()) e.nama_lengkap = 'Nama lengkap wajib diisi.'
    if (form.password && form.password.length < 6) e.password = 'Minimal 6 karakter.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={modalTitle}>Edit Pengguna</div>
            <div style={modalSub}>Ubah data akun <strong>{user.nama_lengkap}</strong></div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:4 }}><IcoX /></button>
        </div>

        {serverErr && (
          <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', color:'#991B1B', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:16 }}>
            ⚠ {serverErr}
          </div>
        )}

        <div style={fieldGroup}>
          <label style={fieldLabel}>Nama Lengkap <span style={{ color:'#EF4444' }}>*</span></label>
          <input style={{ ...fieldInput, borderColor: errors.nama_lengkap ? '#F87171' : '#E5E7EB' }}
            value={form.nama_lengkap} onChange={e => set('nama_lengkap', e.target.value)} />
          {errors.nama_lengkap && <span style={errStyle}>{errors.nama_lengkap}</span>}
        </div>

        <div style={fieldGroup}>
          <label style={fieldLabel}>Username</label>
          <input style={{ ...fieldInput, background:'#F9FAFB', color:'#9CA3AF', cursor:'not-allowed' }}
            value={user.email} disabled />
          <span style={{ fontSize:11.5, color:'#9CA3AF', marginTop:3, display:'block' }}>Username tidak dapat diubah</span>
        </div>

        <div style={fieldGroup}>
          <label style={fieldLabel}>Role</label>
          <select style={fieldSelect} value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={fieldGroup}>
          <label style={fieldLabel}>Password Baru <span style={{ color:'#9CA3AF', fontWeight:400 }}>(opsional)</span></label>
          <input style={{ ...fieldInput, borderColor: errors.password ? '#F87171' : '#E5E7EB' }}
            type="password" placeholder="Kosongkan jika tidak ingin mengubah"
            value={form.password} onChange={e => set('password', e.target.value)} />
          {errors.password && <span style={errStyle}>{errors.password}</span>}
        </div>

        <div style={modalFooter}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={mut.isPending}>Batal</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (validate()) mut.mutate(form) }} disabled={mut.isPending}>
            {mut.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Hapus Pengguna ─────────────────────────────────────────────────────
function DeleteUserModal({ user, onClose, onDeleted }: { user: any; onClose: () => void; onDeleted: () => void }) {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationFn: async () => {
      await deleteUser({ data: user.id_pengguna })
      await createAuditLog({ data: {
        id_pengguna: getAktorId(),
        aksi: `Menghapus pengguna: ${user.nama_lengkap} (${user.role})`,
      }})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['audit_log'] })
      onDeleted()
    },
  })

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div style={modalTitle}>Hapus Pengguna?</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:4 }}><IcoX /></button>
        </div>
        <p style={{ fontSize:14, color:'#374151', lineHeight:1.6, margin:'0 0 24px' }}>
          Akun <strong>{user.nama_lengkap}</strong>{' '}
          (<span style={{ fontFamily:'monospace', fontSize:13 }}>{user.email}</span>) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={modalFooter}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={mut.isPending}>Batal</button>
          <button className="btn btn-sm"
            style={{ background:'#DC2626', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}
            onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Menghapus…' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Row Action Menu ───────────────────────────────────────────────────────────
function RowMenu({ anchorEl, onEdit, onDelete, onClose }: {
  anchorEl: HTMLElement; onEdit: () => void; onDelete: () => void; onClose: () => void
}) {
  const rect = anchorEl.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow < 100
    ? rect.top - 90   // muncul ke atas kalau ruang bawah sempit
    : rect.bottom + 4 // muncul ke bawah normal

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:49 }} onClick={onClose} />
      <div style={{
        position:'fixed',
        top,
        right: window.innerWidth - rect.right,
        zIndex: 50,
        background:'#fff',
        border:'1px solid #EAECF0',
        borderRadius:10,
        boxShadow:'0 8px 24px rgba(0,0,0,.10)',
        minWidth:150,
        padding:'4px 0',
      }}>
        <button onClick={() => { onClose(); onEdit() }}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#374151', textAlign:'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        ><IcoEdit /> Edit pengguna</button>
        <div style={{ height:1, background:'#F3F4F6', margin:'4px 0' }} />
        <button onClick={() => { onClose(); onDelete() }}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#DC2626', textAlign:'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        ><IcoTrash /> Hapus pengguna</button>
      </div>
    </>
  )
}

// ── Audit Log Icon ────────────────────────────────────────────────────────────
function auditIcon(aksi: string): { bg: string; color: string; icon: JSX.Element } {
  if (aksi.startsWith('Menambahkan')) return { bg:'#EBF5EE', color:'#2E7D52', icon:<IcoMail /> }
  if (aksi.startsWith('Mengubah'))   return { bg:'#EFF6FF', color:'#2563EB', icon:<IcoEdit /> }
  if (aksi.startsWith('Menghapus'))  return { bg:'#FEF2F2', color:'#DC2626', icon:<IcoTrash /> }
  return { bg:'#F5F3FF', color:'#7C3AED', icon:<IcoLog /> }
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Users() {
  const [showAdd, setShowAdd]           = useState(false)
  const [editTarget, setEditTarget]     = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [menuState, setMenuState] = useState<{ id: number; el: HTMLElement } | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => getUsers(),
  })

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit_log'],
    queryFn:  () => getAuditLog(),
  })

  const totalUser = users.length
  const adminCount = (users as any[]).filter(u => u.role === 'Admin').length

  const rolesWithCount = ROLES_CONFIG.map(r => ({
    ...r,
    pengguna: (users as any[]).filter(u => u.role === r.nama).length,
  }))

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 className="wt-page-title">User &amp; Role</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', marginTop:3 }}>Kelola pengguna dan hak akses sistem</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm"><IcoDownload /> Ekspor</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <IcoPlus /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
        {[
          { label:'Total Pengguna',  value: totalUser,    icon:<IcoUsers />, iconBg:'#EBF5EE', iconColor:GREEN },
          { label:'Total Role',      value: ROLE_OPTIONS.length, icon:<IcoShield />, iconBg:'#F5F3FF', iconColor:'#7C3AED' },
          { label:'Admin',           value: adminCount,   icon:<IcoShield />, iconBg:'#FEF9C3', iconColor:'#CA8A04' },
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

      {/* ── Two-column layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:16 }}>

        {/* Daftar Pengguna */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div className="wt-card-title">Daftar Pengguna</div>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>{totalUser} pengguna</span>
          </div>
          {isLoading ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Memuat data…</div>
          ) : users.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Belum ada pengguna</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Role</th>
                  <th>Dibuat</th>
                  <th>Reset Password</th>
                  <th style={{ width:48 }}></th>
                </tr>
              </thead>
              <tbody>
                {(users as any[]).map((u: any) => (
                  <tr key={u.id_pengguna}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <Avatar name={u.nama_lengkap} size={36} />
                        <div>
                          <div style={{ fontWeight:600, fontSize:13.5, color:'#1A2E22' }}>{u.nama_lengkap}</div>
                          <div style={{ fontSize:11.5, color:'#9CA3AF' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize:12.5, padding:'3px 10px', borderRadius:20, background:'#F3F4F6', color:'#374151', fontWeight:500 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td>
                      <ResetPasswordCell user={u} />
                    </td>
                    <td style={{ position:'relative' }}>
                    <button
                      onClick={(e) => setMenuState(
                        menuState?.id === u.id_pengguna ? null : { id: u.id_pengguna, el: e.currentTarget }
                      )}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:'4px 8px', borderRadius:6 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    ><IcoMore /></button>
                    {menuState?.id === u.id_pengguna && (
                      <RowMenu
                        anchorEl={menuState.el}
                        onEdit={() => setEditTarget(u)}
                        onDelete={() => setDeleteTarget(u)}
                        onClose={() => setMenuState(null)}
                      />
                    )}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Role & Izin */}
        <div className="wt-card" style={{ alignSelf:'start' }}>
          <div className="wt-card-header">
            <div className="wt-card-title">Role &amp; Izin</div>
          </div>
          <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:18 }}>
            {rolesWithCount.map(role => (
              <div key={role.nama}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:'#1A2E22' }}>{role.nama}</div>
                    <div style={{ fontSize:11.5, color:'#9CA3AF', marginTop:1 }}>{role.pengguna} pengguna</div>
                  </div>
                  <div style={{ width:28, height:28, borderRadius:8, background:role.iconBg, color:role.iconColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <IcoShield />
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {role.perms.map(p => <PermTag key={p} label={p} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Audit Log ── */}
      <div className="wt-card">
        <div className="wt-card-header">
          <div className="wt-card-title">Audit Log</div>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{(auditLogs as any[]).length} aktivitas tercatat</span>
        </div>
        {auditLoading ? (
          <div style={{ padding:32, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Memuat log…</div>
        ) : (auditLogs as any[]).length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>
            Belum ada aktivitas tercatat. Log akan muncul setelah ada perubahan data pengguna.
          </div>
        ) : (
          <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column' }}>
            {(auditLogs as any[]).map((log: any, i: number) => {
              const { bg, color, icon } = auditIcon(log.aksi)
              return (
                <div key={log.id_log} style={{ display:'flex', gap:14, padding:'14px 0', borderBottom: i < (auditLogs as any[]).length - 1 ? '1px solid #F5F6FA' : 'none' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>
                      <strong>{log.pengguna?.nama_lengkap ?? 'Sistem'}</strong> — {log.aksi}
                    </div>
                    <div style={{ fontSize:11.5, color:'#9CA3AF', marginTop:3 }}>
                      {new Date(log.created_at).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSaved={() => setShowAdd(false)} />}
      {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} onSaved={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteUserModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => setDeleteTarget(null)} />}
    </>
  )
}