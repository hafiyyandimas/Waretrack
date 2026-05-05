import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../lib/queries'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function IcoPlus()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcoUsers()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcoShield()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function IcoMail()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> }
function IcoEdit()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }

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

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ aktif }: { aktif: boolean }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600, background: aktif?'#DCFCE7':'#F3F4F6', color: aktif?'#16A34A':'#6B7280' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: aktif?'#16A34A':'#9CA3AF' }}/>
      {aktif ? 'Aktif' : 'Tidak Aktif'}
    </span>
  )
}

// ── Permission Tag ────────────────────────────────────────────────────────────
function PermTag({ label }: { label: string }) {
  return (
    <span style={{ padding:'3px 10px', borderRadius:6, background:'#F0F9F4', border:'1px solid #D1FAE5', fontSize:11.5, color:'#2E7D52', fontWeight:500 }}>
      {label}
    </span>
  )
}

// ── Roles config ──────────────────────────────────────────────────────────────
const ROLES_CONFIG = [
  { nama:'Admin',            pengguna:2,  perms:['Semua Akses'] },
  { nama:'Warehouse Manager',pengguna:3,  perms:['Kelola Stok','Laporan','Kelola User'] },
  { nama:'Supervisor',       pengguna:5,  perms:['Kelola Stok','Lihat Laporan'] },
  { nama:'Staff Gudang',     pengguna:12, perms:['Terima Barang','Keluarkan Barang','Scan SKU'] },
]

// ── Audit log config ──────────────────────────────────────────────────────────
const AUDIT_LOG = [
  { icon:'mail', bg:'#EBF5EE', color:'#2E7D52', text:<><strong>Ahmad S.</strong> mengundang pengguna baru <strong>dewi.k@waretrack.com</strong></>, time:'29 Apr 2024, 14:30' },
  { icon:'edit', bg:'#EFF6FF', color:'#2563EB', text:<><strong>Budi P.</strong> mengubah role <strong>Siti R.</strong> menjadi Staff Gudang</>, time:'28 Apr 2024, 11:15' },
  { icon:'edit', bg:'#F5F3FF', color:'#7C3AED', text:<><strong>Ahmad S.</strong> menonaktifkan akun <strong>Eko W.</strong></>, time:'27 Apr 2024, 09:40' },
  { icon:'mail', bg:'#FEF9C3', color:'#CA8A04', text:<><strong>Siti R.</strong> login dari perangkat baru</>, time:'26 Apr 2024, 08:20' },
]

// ── Main Component ────────────────────────────────────────────────────────────
export function Users() {
  const [showInviteModal, setShowInviteModal] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  // Derive stats from real data or fallback
  const totalUser   = users.length || 22
  const aktifUser   = users.filter((u: any) => u.aktif !== false).length || 20
  const nonAktif    = totalUser - aktifUser
  const totalRole   = 4

  // Fallback static users for display if DB is empty
  const displayUsers = users.length > 0 ? users : [
    { id_pengguna:1, nama_lengkap:'Ahmad Supardi',  email:'ahmad.s@waretrack.com',  role:'Admin',             aktif:true,  last_login:'29 Apr 2024, 14:00' },
    { id_pengguna:2, nama_lengkap:'Budi Prasetyo',  email:'budi.p@waretrack.com',   role:'Warehouse Manager', aktif:true,  last_login:'29 Apr 2024, 13:00' },
    { id_pengguna:3, nama_lengkap:'Siti Rahmawati', email:'siti.r@waretrack.com',   role:'Staff Gudang',      aktif:true,  last_login:'29 Apr 2024, 09:00' },
    { id_pengguna:4, nama_lengkap:'Dewi Kartika',   email:'dewi.k@waretrack.com',   role:'Staff Gudang',      aktif:true,  last_login:'28 Apr 2024, 16:00' },
    { id_pengguna:5, nama_lengkap:'Eko Wijaya',     email:'eko.w@waretrack.com',    role:'Supervisor',        aktif:false, last_login:'15 Apr 2024, 10:00' },
  ]

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
          <button className="btn btn-primary btn-sm" onClick={() => setShowInviteModal(true)}><IcoPlus /> Undang Pengguna</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        {[
          { label:'Total User',   value:totalUser, icon:<IcoUsers />,  iconBg:'#EBF5EE', iconColor:'#2E7D52' },
          { label:'Aktif',        value:aktifUser, icon:<span style={{ width:10, height:10, borderRadius:'50%', background:'#16A34A', display:'inline-block' }}/>, iconBg:'#DCFCE7', iconColor:'#16A34A' },
          { label:'Tidak Aktif',  value:nonAktif,  icon:<span style={{ width:10, height:10, borderRadius:'50%', background:'#9CA3AF', display:'inline-block' }}/>, iconBg:'#F3F4F6', iconColor:'#6B7280' },
          { label:'Total Role',   value:totalRole, icon:<IcoShield />, iconBg:'#F5F3FF', iconColor:'#7C3AED' },
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
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, marginBottom:16 }}>

        {/* Left — Daftar Pengguna */}
        <div className="wt-card">
          <div className="wt-card-header">
            <div className="wt-card-title">Daftar Pengguna</div>
          </div>
          {isLoading ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>Memuat data…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Login Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u: any) => (
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
                    <td style={{ fontSize:13, color:'#374151' }}>{u.role}</td>
                    <td><StatusBadge aktif={u.aktif !== false} /></td>
                    <td style={{ fontSize:12, color:'#9CA3AF', whiteSpace:'nowrap' }}>{u.last_login ?? u.updated_at ? new Date(u.updated_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right — Role & Izin */}
        <div className="wt-card" style={{ alignSelf:'start' }}>
          <div className="wt-card-header">
            <div className="wt-card-title">Role &amp; Izin</div>
            <button className="wt-card-link">Kelola</button>
          </div>
          <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:20 }}>
            {ROLES_CONFIG.map(role => (
              <div key={role.nama}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13.5, color:'#1A2E22' }}>{role.nama}</div>
                    <div style={{ fontSize:11.5, color:'#9CA3AF', marginTop:1 }}>{role.pengguna} pengguna</div>
                  </div>
                  <IcoShield />
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
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
        </div>
        <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:0 }}>
          {AUDIT_LOG.map((log, i) => (
            <div key={i} style={{ display:'flex', gap:14, padding:'14px 0', borderBottom: i < AUDIT_LOG.length-1 ? '1px solid #F5F6FA' : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:log.bg, color:log.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {log.icon === 'mail' ? <IcoMail /> : <IcoEdit />}
              </div>
              <div>
                <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{log.text}</div>
                <div style={{ fontSize:11.5, color:'#9CA3AF', marginTop:3 }}>{log.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Undang Pengguna</div>
            <div className="modal-sub">Kirim undangan ke anggota tim baru</div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="nama@perusahaan.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select">
                <option value="">Pilih role…</option>
                {ROLES_CONFIG.map(r => <option key={r.nama} value={r.nama}>{r.nama}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowInviteModal(false)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowInviteModal(false)}>Kirim Undangan</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}