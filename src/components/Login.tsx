import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { loginUser, registerUser, requestPasswordReset, validateResetToken, changePasswordWithToken } from '../lib/queries'

type View = 'login' | 'signup' | 'forgot' | 'contact' | 'token' | 'change-password'

interface LoginForm   { username: string; password: string }
interface SignupForm  { nama_lengkap: string; username: string; password: string; konfirmasi: string }
interface ContactForm { nama: string; email: string; pesan: string }

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function BoxIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function MailIcon({ color = '#9CA3AF' }: { color?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
}
function LockIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
function UserIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function ArrowLeftIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
}
function PhoneIcon({ color = '#6B7AFF' }: { color?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
}
function MessageIcon({ color = '#A855F7' }: { color?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function ChatIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const GREEN       = '#2E7D52'
const GREEN_LIGHT = '#EBF5EE'

const shared: Record<string, React.CSSProperties> = {
  page:         { minHeight:'100vh', background:'linear-gradient(145deg,#e0f2e9 0%,#d4eddf 50%,#c8e8d7 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 16px', fontFamily:"'Inter','Segoe UI',sans-serif" },
  branding:     { display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28, gap:8 },
  logoBox:      { width:64, height:64, background:'linear-gradient(135deg,#34A868 0%,#2E7D52 100%)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(46,125,82,0.35)', marginBottom:4 },
  brandName:    { fontSize:28, fontWeight:700, color:'#1A2E22', margin:0, letterSpacing:'-0.02em' },
  brandSub:     { fontSize:14, color:'#4A6355', margin:0 },
  card:         { background:'#FFFFFF', borderRadius:20, padding:'36px 40px', width:'100%', maxWidth:480, boxShadow:'0 4px 32px rgba(0,0,0,0.08)' },
  cardTitle:    { fontSize:22, fontWeight:700, color:'#1A2E22', margin:'0 0 6px', letterSpacing:'-0.01em' },
  cardSub:      { fontSize:14, color:'#6B7C74', margin:'0 0 24px' },
  fieldGroup:   { marginBottom:16 },
  label:        { display:'block', fontSize:13.5, fontWeight:500, color:'#374151', marginBottom:6 },
  inputWrap:    { display:'flex', alignItems:'center', border:'1.5px solid #E5E7EB', borderRadius:12, background:'#FAFAFA', overflow:'hidden' },
  inputWrapErr: { borderColor:'#F87171', background:'#FFF5F5' },
  inputIcon:    { display:'flex', alignItems:'center', padding:'0 12px', flexShrink:0 },
  input:        { flex:1, border:'none', background:'transparent', padding:'13px 14px 13px 0', fontSize:14, color:'#1A2E22', outline:'none', width:'100%' },
  fieldErr:     { display:'block', fontSize:12, color:'#EF4444', marginTop:4 },
  linkBtn:      { background:'none', border:'none', color:GREEN, fontSize:13.5, fontWeight:600, cursor:'pointer', padding:0 },
  submitBtn:    { width:'100%', padding:'14px', background:`linear-gradient(135deg,#34A868 0%,${GREEN} 100%)`, color:'#FFFFFF', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 12px rgba(46,125,82,0.3)' },
  divider:      { height:1, background:'#F0F0F0', margin:'24px 0 20px' },
  footerText:   { textAlign:'center' as const, fontSize:13.5, color:'#6B7C74', margin:0 },
  errBanner:    { background:'#FEE2E2', border:'1px solid #FCA5A5', color:'#991B1B', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:16 },
  successBanner:{ background:GREEN_LIGHT, border:`1px solid ${GREEN}33`, color:GREEN, borderRadius:10, padding:'12px 14px', fontSize:13, marginBottom:16 },
  pageFooter:   { marginTop:24, fontSize:13, color:'#6B7C74', textAlign:'center' as const },
  backBtn:      { width:'100%', padding:'13px', background:'transparent', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer', marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  forgotHeader: { display:'flex', alignItems:'center', gap:14, marginBottom:16 },
  forgotIconBox:{ width:48, height:48, background:GREEN_LIGHT, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
}

function Branding() {
  return (
    <div style={shared.branding}>
      <div style={shared.logoBox}><BoxIcon /></div>
      <h1 style={shared.brandName}>WareTrack</h1>
      <p style={shared.brandSub}>Sistem Manajemen Inventaris Gudang</p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate()
  const [view, setView]             = useState<View>('login')
  const [rememberMe, setRememberMe] = useState(false)

  // Login state
  const [loginForm, setLoginForm]           = useState<LoginForm>({ username:'', password:'' })
  const [loginErrors, setLoginErrors]       = useState<Partial<LoginForm>>({})
  const [loginServerErr, setLoginServerErr] = useState<string|null>(null)
  const [loginLoading, setLoginLoading]     = useState(false)

  // Signup state
  const [signupForm, setSignupForm]           = useState<SignupForm>({ nama_lengkap:'', username:'', password:'', konfirmasi:'' })
  const [signupErrors, setSignupErrors]       = useState<Partial<SignupForm>>({})
  const [signupServerErr, setSignupServerErr] = useState<string|null>(null)
  const [signupLoading, setSignupLoading]     = useState(false)
  const [signupSuccess, setSignupSuccess]     = useState(false)

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotErr, setForgotErr]     = useState('')
  const [forgotSent, setForgotSent]   = useState(false)

  // Reset password flow state
  const [resetUsername, setResetUsername]     = useState('')
  const [tokenInput, setTokenInput]           = useState('')
  const [tokenErr, setTokenErr]               = useState('')
  const [newPass, setNewPass]                 = useState('')
  const [newPassConfirm, setNewPassConfirm]   = useState('')
  const [changePassErr, setChangePassErr]     = useState('')
  const [changePassLoading, setChangePassLoading] = useState(false)
  const [changePassSuccess, setChangePassSuccess] = useState(false)

  // Contact state
  const [contactForm, setContactForm]       = useState<ContactForm>({ nama:'', email:'', pesan:'' })
  const [contactErrors, setContactErrors]   = useState<Partial<ContactForm>>({})
  const [contactSent, setContactSent]       = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  // ── Login handlers ──
  function setLoginField(k: keyof LoginForm, v: string) {
    setLoginForm(p => ({ ...p, [k]:v }))
    if (loginErrors[k]) setLoginErrors(p => { const n={...p}; delete n[k]; return n })
    if (loginServerErr) setLoginServerErr(null)
  }

  async function handleLogin() {
    const e: Partial<LoginForm> = {}
    if (!loginForm.username.trim()) e.username = 'Email atau username wajib diisi.'
    if (!loginForm.password)        e.password = 'Password wajib diisi.'
    if (Object.keys(e).length) { setLoginErrors(e); return }
    setLoginLoading(true)
    try {
      const res = await loginUser({ data: { username: loginForm.username, password: loginForm.password } })
      if (!res.ok) { setLoginServerErr(res.error ?? 'Login gagal.'); return }
      const userData = JSON.stringify(res.user)
      if (rememberMe) {
        localStorage.setItem('auth_user', userData)
        sessionStorage.removeItem('auth_user')
      } else {
        sessionStorage.setItem('auth_user', userData)
        localStorage.removeItem('auth_user')
      }
      window.location.href = '/'
    } catch { setLoginServerErr('Terjadi kesalahan. Coba lagi.') }
    finally   { setLoginLoading(false) }
  }

  // ── Signup handlers ──
  function setSignupField(k: keyof SignupForm, v: string) {
    setSignupForm(p => ({ ...p, [k]:v }))
    if (signupErrors[k]) setSignupErrors(p => { const n={...p}; delete n[k]; return n })
    if (signupServerErr) setSignupServerErr(null)
  }

  async function handleSignup() {
    const e: Partial<SignupForm> = {}
    if (!signupForm.nama_lengkap.trim()) e.nama_lengkap = 'Nama lengkap wajib diisi.'
    if (!signupForm.username.trim())     e.username     = 'Username wajib diisi.'
    if (!signupForm.password)            e.password     = 'Password wajib diisi.'
    else if (signupForm.password.length < 6) e.password = 'Password minimal 6 karakter.'
    if (!signupForm.konfirmasi)          e.konfirmasi   = 'Konfirmasi password wajib diisi.'
    else if (signupForm.password !== signupForm.konfirmasi) e.konfirmasi = 'Password tidak cocok.'
    if (Object.keys(e).length) { setSignupErrors(e); return }
    setSignupLoading(true)
    try {
      const res = await registerUser({ data: { nama_lengkap: signupForm.nama_lengkap, username: signupForm.username, password: signupForm.password } })
      if (!res.ok) { setSignupServerErr(res.error ?? 'Pendaftaran gagal.'); return }
      setSignupSuccess(true)
    } catch { setSignupServerErr('Terjadi kesalahan. Coba lagi.') }
    finally   { setSignupLoading(false) }
  }

  // ── Forgot handler ──
  async function handleForgotSubmit() {
    if (!forgotEmail.trim()) { setForgotErr('Email atau username wajib diisi.'); return }
    setResetUsername(forgotEmail)
    try {
      const res = await requestPasswordReset({ data: { username: forgotEmail } })
      if (!res.ok) { setForgotErr(res.error ?? 'Gagal mengirim permintaan.'); return }
      if (res.state === 'has_token') { setView('token'); return }
      setForgotSent(true)
    } catch { setForgotErr('Terjadi kesalahan.') }
  }

  // ── Contact handlers ──
  function setContactField(k: keyof ContactForm, v: string) {
    setContactForm(p => ({ ...p, [k]:v }))
    if (contactErrors[k]) setContactErrors(p => { const n={...p}; delete n[k]; return n })
  }

  function handleContactSubmit() {
    const e: Partial<ContactForm> = {}
    if (!contactForm.nama.trim())  e.nama  = 'Nama lengkap wajib diisi.'
    if (!contactForm.email.trim()) e.email = 'Email wajib diisi.'
    else if (!/\S+@\S+\.\S+/.test(contactForm.email)) e.email = 'Format email tidak valid.'
    if (!contactForm.pesan.trim()) e.pesan = 'Pesan wajib diisi.'
    else if (contactForm.pesan.trim().length < 10) e.pesan = 'Pesan minimal 10 karakter.'
    if (Object.keys(e).length) { setContactErrors(e); return }
    setContactLoading(true)
    setTimeout(() => { setContactLoading(false); setContactSent(true) }, 800)
  }

  const contactIconBox = (bg: string): React.CSSProperties => ({ width:40, height:40, background:bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 })

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: LOGIN
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'login') return (
    <div style={shared.page}>
      <Branding />
      <div style={shared.card}>
        <h2 style={shared.cardTitle}>Masuk ke Akun Anda</h2>
        <p style={shared.cardSub}>Silakan masukkan kredensial Anda</p>
        {loginServerErr && <div style={shared.errBanner}>⚠ {loginServerErr}</div>}
        <div onKeyDown={e => e.key==='Enter' && handleLogin()}>
          <div style={shared.fieldGroup}>
            <label style={shared.label}>Email atau Username</label>
            <div style={{ ...shared.inputWrap, ...(loginErrors.username ? shared.inputWrapErr : {}) }}>
              <span style={shared.inputIcon}><MailIcon /></span>
              <input style={shared.input} type="text" placeholder="nama@perusahaan.com atau username" value={loginForm.username} onChange={e=>setLoginField('username',e.target.value)} autoFocus />
            </div>
            {loginErrors.username && <span style={shared.fieldErr}>{loginErrors.username}</span>}
          </div>
          <div style={shared.fieldGroup}>
            <label style={shared.label}>Password</label>
            <div style={{ ...shared.inputWrap, ...(loginErrors.password ? shared.inputWrapErr : {}) }}>
              <span style={shared.inputIcon}><LockIcon /></span>
              <input style={shared.input} type="password" placeholder="password" value={loginForm.password} onChange={e=>setLoginField('password',e.target.value)} />
            </div>
            {loginErrors.password && <span style={shared.fieldErr}>{loginErrors.password}</span>}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, marginTop:4 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13.5, color:'#374151', cursor:'pointer' }}>
            <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{ accentColor:GREEN, width:16, height:16 }} />
            Ingat saya
          </label>
          <button style={shared.linkBtn} onClick={()=>{ setView('forgot'); setForgotEmail(''); setForgotErr(''); setForgotSent(false) }}>Lupa password?</button>
        </div>
        <button style={{ ...shared.submitBtn, opacity:loginLoading?0.6:1, cursor:loginLoading?'not-allowed':'pointer' }} onClick={handleLogin} disabled={loginLoading}>
          {loginLoading ? 'Memverifikasi...' : 'Masuk'}
        </button>
        <div style={shared.divider} />
        <p style={shared.footerText}>
          Belum punya akun?{' '}
          <button style={shared.linkBtn} onClick={()=>{ setView('signup'); setSignupForm({nama_lengkap:'',username:'',password:'',konfirmasi:''}); setSignupErrors({}); setSignupServerErr(null); setSignupSuccess(false) }}>
            Daftar sekarang
          </button>
        </p>
      </div>
      <p style={shared.pageFooter}>© 2026 WareTrack. All rights reserved.</p>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: SIGNUP
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'signup') return (
    <div style={shared.page}>
      <Branding />
      <div style={shared.card}>
        <h2 style={shared.cardTitle}>Buat Akun Baru</h2>
        <p style={shared.cardSub}>Daftarkan diri Anda ke sistem WareTrack</p>
        {signupSuccess ? (
          <>
            <div style={shared.successBanner}>✓ Akun berhasil dibuat! Silakan masuk dengan username dan password Anda.</div>
            <button style={shared.submitBtn} onClick={()=>setView('login')}>Masuk sekarang</button>
          </>
        ) : (
          <>
            {signupServerErr && <div style={shared.errBanner}>⚠ {signupServerErr}</div>}
            <div onKeyDown={e => e.key==='Enter' && handleSignup()}>
              <div style={shared.fieldGroup}>
                <label style={shared.label}>Nama Lengkap <span style={{ color:'#EF4444' }}>*</span></label>
                <div style={{ ...shared.inputWrap, ...(signupErrors.nama_lengkap ? shared.inputWrapErr : {}) }}>
                  <span style={shared.inputIcon}><UserIcon /></span>
                  <input style={shared.input} type="text" placeholder="Masukkan nama lengkap Anda" value={signupForm.nama_lengkap} onChange={e=>setSignupField('nama_lengkap',e.target.value)} autoFocus />
                </div>
                {signupErrors.nama_lengkap && <span style={shared.fieldErr}>{signupErrors.nama_lengkap}</span>}
              </div>
              <div style={shared.fieldGroup}>
                <label style={shared.label}>Username <span style={{ color:'#EF4444' }}>*</span></label>
                <div style={{ ...shared.inputWrap, ...(signupErrors.username ? shared.inputWrapErr : {}) }}>
                  <span style={shared.inputIcon}><MailIcon /></span>
                  <input style={shared.input} type="text" placeholder="Buat username unik Anda" value={signupForm.username} onChange={e=>setSignupField('username',e.target.value)} />
                </div>
                {signupErrors.username && <span style={shared.fieldErr}>{signupErrors.username}</span>}
              </div>
              <div style={shared.fieldGroup}>
                <label style={shared.label}>Password <span style={{ color:'#EF4444' }}>*</span></label>
                <div style={{ ...shared.inputWrap, ...(signupErrors.password ? shared.inputWrapErr : {}) }}>
                  <span style={shared.inputIcon}><LockIcon /></span>
                  <input style={shared.input} type="password" placeholder="Minimal 6 karakter" value={signupForm.password} onChange={e=>setSignupField('password',e.target.value)} />
                </div>
                {signupErrors.password && <span style={shared.fieldErr}>{signupErrors.password}</span>}
              </div>
              <div style={shared.fieldGroup}>
                <label style={shared.label}>Konfirmasi Password <span style={{ color:'#EF4444' }}>*</span></label>
                <div style={{ ...shared.inputWrap, ...(signupErrors.konfirmasi ? shared.inputWrapErr : {}) }}>
                  <span style={shared.inputIcon}><LockIcon /></span>
                  <input style={shared.input} type="password" placeholder="Ulangi password Anda" value={signupForm.konfirmasi} onChange={e=>setSignupField('konfirmasi',e.target.value)} />
                </div>
                {signupErrors.konfirmasi && <span style={shared.fieldErr}>{signupErrors.konfirmasi}</span>}
              </div>
            </div>
            <button style={{ ...shared.submitBtn, opacity:signupLoading?0.6:1, cursor:signupLoading?'not-allowed':'pointer', marginTop:4 }} onClick={handleSignup} disabled={signupLoading}>
              {signupLoading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </>
        )}
        <button style={shared.backBtn} onClick={()=>setView('login')}><ArrowLeftIcon /> Sudah punya akun? Masuk</button>
      </div>
      <p style={shared.pageFooter}>© 2026 WareTrack. All rights reserved.</p>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: FORGOT PASSWORD
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'forgot') return (
    <div style={shared.page}>
      <Branding />
      <div style={shared.card}>
        <div style={shared.forgotHeader}>
          <div style={shared.forgotIconBox}><MailIcon color={GREEN} /></div>
          <div>
            <h2 style={{ ...shared.cardTitle, marginBottom:2 }}>Lupa Password</h2>
            <p style={{ ...shared.cardSub, margin:0 }}>Reset password akun Anda</p>
          </div>
        </div>
        {forgotSent ? (
          <div style={shared.successBanner}>
            ⏳ Permintaan reset password telah dikirim. Menunggu admin menyetujui.
            <br />
            <button style={{ ...shared.linkBtn, marginTop:8, fontSize:13 }} onClick={()=>setView('token')}>
              Sudah punya kode? Masukkan di sini →
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize:14, color:'#6B7C74', lineHeight:1.6, margin:'0 0 20px' }}>
              Masukkan email atau username yang terdaftar. Admin akan memberikan kode reset password.
            </p>
            {forgotErr && <div style={shared.errBanner}>⚠ {forgotErr}</div>}
            <div style={shared.fieldGroup}>
              <label style={shared.label}>Email atau Username</label>
              <div style={{ ...shared.inputWrap, ...(forgotErr ? shared.inputWrapErr : {}) }}>
                <span style={shared.inputIcon}><MailIcon /></span>
                <input style={shared.input} type="text" placeholder="nama@perusahaan.com atau username" value={forgotEmail} onChange={e=>{ setForgotEmail(e.target.value); setForgotErr('') }} autoFocus />
              </div>
            </div>
            <button style={shared.submitBtn} onClick={handleForgotSubmit}>Kirim Permintaan Reset</button>
          </>
        )}
        <button style={shared.backBtn} onClick={()=>setView('login')}><ArrowLeftIcon /> Kembali ke Login</button>
      </div>
      <p style={shared.pageFooter}>
        Butuh bantuan? <button style={shared.linkBtn} onClick={()=>setView('contact')}>Hubungi Administrator</button>
      </p>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: TOKEN
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'token') return (
    <div style={shared.page}>
      <Branding />
      <div style={shared.card}>
        <h2 style={shared.cardTitle}>Masukkan Kode Reset</h2>
        <p style={shared.cardSub}>Masukkan kode 6 karakter yang diberikan oleh admin.</p>
        {tokenErr && <div style={shared.errBanner}>⚠ {tokenErr}</div>}
        <div style={shared.fieldGroup}>
          <label style={shared.label}>Username / Email</label>
          <div style={shared.inputWrap}>
            <span style={shared.inputIcon}><MailIcon /></span>
            <input style={shared.input} placeholder="Username kamu" value={resetUsername} onChange={e=>{ setResetUsername(e.target.value); setTokenErr('') }} />
          </div>
        </div>
        <div style={shared.fieldGroup}>
          <label style={shared.label}>Kode Token (6 karakter)</label>
          <div style={shared.inputWrap}>
            <span style={shared.inputIcon}><LockIcon /></span>
            <input style={{ ...shared.input, fontFamily:'monospace', letterSpacing:'0.2em', textTransform:'uppercase' }}
              placeholder="ABC123" maxLength={6} value={tokenInput}
              onChange={e=>{ setTokenInput(e.target.value.toUpperCase()); setTokenErr('') }} />
          </div>
        </div>
        <button style={shared.submitBtn} onClick={async () => {
          if (!resetUsername.trim() || !tokenInput.trim()) { setTokenErr('Isi semua field.'); return }
          try {
            const res = await validateResetToken({ data: { username: resetUsername, token: tokenInput } })
            if (!res.ok) { setTokenErr(res.error ?? 'Token tidak valid.'); return }
            setView('change-password')
          } catch { setTokenErr('Terjadi kesalahan.') }
        }}>
          Verifikasi Kode
        </button>
        <button style={shared.backBtn} onClick={()=>setView('forgot')}><ArrowLeftIcon /> Kembali</button>
      </div>
      <p style={shared.pageFooter}>© 2026 WareTrack. All rights reserved.</p>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: CHANGE PASSWORD
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'change-password') return (
    <div style={shared.page}>
      <Branding />
      <div style={shared.card}>
        {changePassSuccess ? (
          <>
            <div style={shared.successBanner}>✓ Password berhasil diubah! Silakan login dengan password baru.</div>
            <button style={shared.submitBtn} onClick={()=>{ setView('login'); setChangePassSuccess(false) }}>Masuk Sekarang</button>
          </>
        ) : (
          <>
            <h2 style={shared.cardTitle}>Buat Password Baru</h2>
            <p style={shared.cardSub}>Password baru minimal 6 karakter.</p>
            {changePassErr && <div style={shared.errBanner}>⚠ {changePassErr}</div>}
            <div style={shared.fieldGroup}>
              <label style={shared.label}>Password Baru <span style={{ color:'#EF4444' }}>*</span></label>
              <div style={shared.inputWrap}>
                <span style={shared.inputIcon}><LockIcon /></span>
                <input style={shared.input} type="password" placeholder="Minimal 6 karakter" value={newPass} onChange={e=>{ setNewPass(e.target.value); setChangePassErr('') }} />
              </div>
            </div>
            <div style={shared.fieldGroup}>
              <label style={shared.label}>Konfirmasi Password <span style={{ color:'#EF4444' }}>*</span></label>
              <div style={shared.inputWrap}>
                <span style={shared.inputIcon}><LockIcon /></span>
                <input style={shared.input} type="password" placeholder="Ulangi password baru" value={newPassConfirm} onChange={e=>{ setNewPassConfirm(e.target.value); setChangePassErr('') }} />
              </div>
            </div>
            <button style={{ ...shared.submitBtn, opacity:changePassLoading?0.6:1 }} disabled={changePassLoading}
              onClick={async () => {
                if (newPass.length < 6)        { setChangePassErr('Password minimal 6 karakter.'); return }
                if (newPass !== newPassConfirm) { setChangePassErr('Password tidak cocok.'); return }
                setChangePassLoading(true)
                try {
                  const res = await changePasswordWithToken({ data: { username: resetUsername, token: tokenInput, newPassword: newPass } })
                  if (!res.ok) { setChangePassErr(res.error ?? 'Gagal mengubah password.'); return }
                  setChangePassSuccess(true)
                } catch { setChangePassErr('Terjadi kesalahan.') }
                finally { setChangePassLoading(false) }
              }}>
              {changePassLoading ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </>
        )}
      </div>
      <p style={shared.pageFooter}>© 2026 WareTrack. All rights reserved.</p>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: CONTACT ADMIN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ ...shared.page, justifyContent:'flex-start', paddingTop:32 }}>
      <Branding />
      <div style={{ display:'flex', gap:20, width:'100%', maxWidth:900, alignItems:'flex-start' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'28px', width:320, flexShrink:0, boxShadow:'0 4px 24px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            <div style={contactIconBox('#EEF2FF')}><PhoneIcon /></div>
            <div>
              <p style={{ fontSize:17, fontWeight:700, color:'#1A2E22', margin:'0 0 2px' }}>Informasi Kontak</p>
              <p style={{ fontSize:13, color:'#6B7C74', margin:0 }}>Tim Support WareTrack</p>
            </div>
          </div>
          <p style={{ fontSize:13.5, color:'#6B7C74', lineHeight:1.65, margin:'0 0 20px' }}>
            Silakan hubungi administrator jika mengalami kendala pada sistem atau membutuhkan bantuan akses akun.
          </p>
          {[
            { bg:'#DCFCE7', icon:<MailIcon color="#2E7D52"/>,    label:'EMAIL',    value:'kelompokrpl25@gmail.com', note:'support25@gmail.com' },
            { bg:'#EEF2FF', icon:<PhoneIcon color="#6B7AFF"/>,   label:'TELEPON',  value:'+62 89524568910',         note:'Senin - Jumat: 08.00 - 17.00 WIB' },
            { bg:'#F3E8FF', icon:<MessageIcon color="#A855F7"/>, label:'WHATSAPP', value:'+62 89524568910',         note:'Chat langsung dengan admin' },
          ].map(c => (
            <div key={c.label} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px', border:'1.5px solid #E5E7EB', borderRadius:12, marginBottom:10 }}>
              <div style={contactIconBox(c.bg)}>{c.icon}</div>
              <div>
                <p style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase', margin:'0 0 2px' }}>{c.label}</p>
                <p style={{ fontSize:14, fontWeight:600, color:'#1A2E22', margin:'0 0 2px' }}>{c.value}</p>
                <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>{c.note}</p>
              </div>
            </div>
          ))}
          <div style={{ background:'#FFFBEB', border:'1.5px solid #FCD34D', borderRadius:12, padding:'12px 14px', marginTop:16 }}>
            <p style={{ fontSize:12.5, color:'#92400E', lineHeight:1.6, margin:0 }}>
              <strong>Catatan:</strong> Untuk permintaan akun baru atau reset password, harap sertakan informasi lengkap Anda.
            </p>
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:20, padding:'32px 36px', flex:1, boxShadow:'0 4px 24px rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#1A2E22', margin:'0 0 6px', letterSpacing:'-0.01em' }}>Hubungi Administrator</h2>
          <p style={{ fontSize:14, color:'#6B7C74', margin:'0 0 24px' }}>Kirim pesan atau pertanyaan Anda kepada tim administrator</p>
          {contactSent && <div style={shared.successBanner}>✓ Pesan Anda telah berhasil dikirim. Tim administrator akan menghubungi Anda segera.</div>}
          <div style={shared.fieldGroup}>
            <label style={shared.label}>Nama Lengkap</label>
            <div style={{ ...shared.inputWrap, ...(contactErrors.nama ? shared.inputWrapErr : {}) }}>
              <span style={shared.inputIcon}><UserIcon /></span>
              <input style={shared.input} type="text" placeholder="Masukkan nama lengkap Anda" value={contactForm.nama} onChange={e=>setContactField('nama',e.target.value)} autoFocus />
            </div>
            {contactErrors.nama && <span style={shared.fieldErr}>{contactErrors.nama}</span>}
          </div>
          <div style={shared.fieldGroup}>
            <label style={shared.label}>Email</label>
            <div style={{ ...shared.inputWrap, ...(contactErrors.email ? shared.inputWrapErr : {}) }}>
              <span style={shared.inputIcon}><MailIcon /></span>
              <input style={shared.input} type="email" placeholder="nama@perusahaan.com" value={contactForm.email} onChange={e=>setContactField('email',e.target.value)} />
            </div>
            {contactErrors.email && <span style={shared.fieldErr}>{contactErrors.email}</span>}
          </div>
          <div style={shared.fieldGroup}>
            <label style={shared.label}>Pesan</label>
            <div style={{ ...shared.inputWrap, ...(contactErrors.pesan ? shared.inputWrapErr : {}), alignItems:'flex-start' }}>
              <span style={{ ...shared.inputIcon, paddingTop:14 }}><ChatIcon /></span>
              <textarea style={{ ...shared.input, padding:'13px 14px 13px 0', resize:'none', minHeight:120, fontFamily:'inherit', lineHeight:1.6 } as React.CSSProperties}
                placeholder="Jelaskan kendala atau pertanyaan Anda..." value={contactForm.pesan} onChange={e=>setContactField('pesan',e.target.value)} rows={5} />
            </div>
            {contactErrors.pesan
              ? <span style={shared.fieldErr}>{contactErrors.pesan}</span>
              : <p style={{ fontSize:12, color:'#9CA3AF', margin:'6px 0 0' }}>Minimal 10 karakter. Jelaskan permasalahan Anda dengan detail.</p>
            }
          </div>
          <div style={{ display:'flex', gap:12, marginTop:24 }}>
            <button onClick={()=>setView('login')} style={{ flex:1, padding:'13px', background:'transparent', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <ArrowLeftIcon /> Kembali
            </button>
            <button onClick={handleContactSubmit} disabled={contactLoading||contactSent}
              style={{ flex:1, padding:'13px', background:`linear-gradient(135deg,#34A868,${GREEN})`, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:contactLoading||contactSent?'not-allowed':'pointer', opacity:contactLoading?0.65:1, boxShadow:'0 2px 12px rgba(46,125,82,0.3)' }}>
              {contactLoading?'Mengirim...':contactSent?'Terkirim ✓':'Kirim Pesan'}
            </button>
          </div>
        </div>
      </div>
      <p style={shared.pageFooter}>© 2026 WareTrack. All rights reserved.</p>
    </div>
  )
}