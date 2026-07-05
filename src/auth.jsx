import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { Crest } from './components/Icons'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthGate({ children }) {
  const [user, setUser] = useState(undefined) // undefined = učitavanje

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), [])

  if (user === undefined) {
    return <div className="auth-wrap"><div className="auth-card"><p className="auth-loading">Učitavanje…</p></div></div>
  }
  if (!user) return <Login />
  return <AuthCtx.Provider value={{ user, logout: () => signOut(auth) }}>{children}</AuthCtx.Provider>
}

function Login() {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email.trim(), pass)
      else await createUserWithEmailAndPassword(auth, email.trim(), pass)
    } catch (ex) {
      setErr(errMsg(ex.code))
    } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand"><Crest size={44} /><div><b>FK Brodarac</b><span>Trener — prijava</span></div></div>
        <div className="field"><label>Email</label>
          <input className="input" type="email" value={email} autoFocus onChange={e => setEmail(e.target.value)} placeholder="ime@primer.com" /></div>
        <div className="field"><label>Lozinka</label>
          <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="min. 6 karaktera" /></div>
        {err && <div className="pill bad" style={{ display: 'block', padding: 9, marginBottom: 10 }}>{err}</div>}
        <button className="btn primary" type="submit" disabled={busy || !email || pass.length < 6} style={{ width: '100%', justifyContent: 'center' }}>
          {busy ? 'Sačekaj…' : (mode === 'login' ? 'Prijavi se' : 'Registruj se')}
        </button>
        <p className="auth-switch">
          {mode === 'login' ? 'Nemaš nalog? ' : 'Već imaš nalog? '}
          <button type="button" className="linkbtn" onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setErr('') }}>
            {mode === 'login' ? 'Registruj se' : 'Prijavi se'}
          </button>
        </p>
      </form>
    </div>
  )
}

function errMsg(code) {
  switch (code) {
    case 'auth/invalid-email': return 'Neispravan email.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Pogrešan email ili lozinka.'
    case 'auth/email-already-in-use': return 'Nalog sa ovim email-om već postoji — prijavi se.'
    case 'auth/weak-password': return 'Lozinka mora imati bar 6 karaktera.'
    case 'auth/network-request-failed': return 'Nema veze sa internetom.'
    default: return 'Greška: ' + (code || 'pokušaj ponovo')
  }
}
