import { useState, useEffect, useRef } from 'react'
import { Sidebar, MobileNav } from './components/Nav'
import { Icon } from './components/Icons'
import { useStore } from './data/store'
import { useAuth } from './auth'

import Dashboard from './views/Dashboard'
import Players from './views/Players'
import Calendar from './views/Calendar'
import Microcycles from './views/Microcycles'
import Training from './views/Training'
import Matches from './views/Matches'
import GPS from './views/GPS'
import Exercises from './views/Exercises'

const TITLES = {
  dash: ['Pregled', s => `Sezona ${s.team.season} · ${s.team.period}`],
  players: ['Igrači', s => `${s.players.length} igrača · profili, statistika i članarina`],
  cal: ['Kalendar aktivnosti', () => '06.07 – 16.08 · plan po danima'],
  mc: ['Mikrociklusi', () => '5 pripremnih + 1 takmičarski'],
  train: ['Koncept treninga', () => 'Jedan trening — detaljno'],
  match: ['Utakmice', () => 'Unos, formacija i statistika mečeva'],
  gps: ['Catapult GPS', () => 'Fizičke performanse i poređenje igrača'],
  ex: ['Skladište vežbi', s => `${s.exercises.length} vežbi u biblioteci`],
}

export default function App() {
  const store = useStore()
  const [view, _setView] = useState('dash')
  const [adding, setAdding] = useState(false)
  const [dataMenu, setDataMenu] = useState(false)
  const setView = (v) => { setAdding(false); _setView(v) }

  const [title, subFn] = TITLES[view]
  const sub = subFn(store)

  function toggleTheme() {
    const root = document.documentElement
    const isDark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme:dark)').matches)
    root.setAttribute('data-theme', isDark ? 'light' : 'dark')
    try { localStorage.setItem('trenertima_theme', isDark ? 'light' : 'dark') } catch (e) {}
  }
  useEffect(() => {
    const t = localStorage.getItem('trenertima_theme')
    if (t) document.documentElement.setAttribute('data-theme', t)
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [view])

  const canAdd = view === 'players' || view === 'ex'

  const views = {
    dash: <Dashboard setView={setView} />,
    players: <Players addOpen={adding} onCloseAdd={() => setAdding(false)} />,
    cal: <Calendar />,
    mc: <Microcycles />,
    train: <Training />,
    match: <Matches />,
    gps: <GPS />,
    ex: <Exercises addOpen={adding} onCloseAdd={() => setAdding(false)} />,
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} />
      <div className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <div className="sub">{sub}</div>
          </div>
          <div className="spacer" />
          <span className="cloud-dot" title={store.cloud === 'online' ? 'Podaci se čuvaju u cloud-u' : store.cloud === 'offline' ? 'Nema veze — čuva se lokalno' : 'Povezivanje…'}>
            <span className="d" style={{ background: store.cloud === 'online' ? 'var(--good)' : store.cloud === 'offline' ? 'var(--bad)' : 'var(--warn)' }} />
            {store.cloud === 'online' ? 'Cloud' : store.cloud === 'offline' ? 'Offline' : '…'}
          </span>
          {canAdd && (
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Icon.plus /> Dodaj
            </button>
          )}
          <button className="btn themebtn" onClick={() => setDataMenu(true)} title="Podaci / backup" aria-label="Podaci">
            <Icon.gear />
          </button>
          <button className="btn themebtn" onClick={toggleTheme} title="Promeni temu" aria-label="Promeni temu">
            <Icon.moon />
          </button>
        </header>
        <div className="content">
          {store.recovery && <RecoveryBanner store={store} />}
          <div className="view" key={view}>{views[view]}</div>
        </div>
      </div>
      <MobileNav view={view} setView={setView} />
      {dataMenu && <DataMenu store={store} onClose={() => setDataMenu(false)} />}
    </div>
  )
}

function RecoveryBanner({ store }) {
  function exportBackup() {
    const blob = new Blob([store.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'trenertima-backup.json'; a.click()
    URL.revokeObjectURL(url)
  }
  const n = (store.players || []).length
  return (
    <div style={{ background: '#FBF1DC', border: '1px solid #E0A21A', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
      <div style={{ fontWeight: 800, color: '#8a5b00', marginBottom: 6 }}>🛟 REŽIM SPAŠAVANJA — podaci se NE sinhronizuju</div>
      <div style={{ fontSize: 13.5, color: '#5a4a20', marginBottom: 12 }}>
        Ovo je poslednje lokalno sačuvano stanje na ovom uređaju. Trenutno ima <b>{n}</b> igrača.
        Ako su tvoji podaci tu — klikni dugme da ih sačuvaš u fajl.
      </div>
      <button className="btn primary" onClick={exportBackup}><Icon.download /> Sačuvaj podatke (Izvoz)</button>
    </div>
  )
}

function DataMenu({ store, onClose }) {
  const fileRef = useRef()
  const authCtx = useAuth()
  const [hist, setHist] = useState(null) // null=zatvoreno; niz=otvorena istorija
  function exportBackup() {
    const blob = new Blob([store.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'trenertima-backup.json'; a.click()
    URL.revokeObjectURL(url)
  }
  function importBackup(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => { try { store.importData(String(r.result)); alert('Podaci su uvezeni.'); onClose() } catch (err) { alert('Greška: fajl nije ispravan backup.') } }
    r.readAsText(file)
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-h"><h3>Podaci i backup</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn primary" onClick={exportBackup} style={{ justifyContent: 'center' }}><Icon.download /> Izvoz (skini backup fajl)</button>
          <button className="btn" onClick={() => fileRef.current.click()} style={{ justifyContent: 'center' }}><Icon.upload /> Uvoz (učitaj backup)</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          <button className="btn" onClick={() => setHist(store.getHistory())} style={{ justifyContent: 'center' }}>↩ Istorija (vrati verziju)</button>
          <p className="mock-note" style={{ margin: '4px 0 0' }}>Podaci se čuvaju u cloud-u i automatski se pravi backup pri svakoj izmeni. „Istorija" vraća neko od ranijih stanja. „Izvoz" pravi fajl na tvom uređaju.</p>
          {authCtx && (
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--grey)' }}>Prijavljen: <b style={{ color: 'var(--ink)' }}>{authCtx.user.email}</b></div>
              <button className="btn sm" onClick={() => { authCtx.logout(); onClose() }}>Odjavi se</button>
            </div>
          )}
        </div>
      </div>
      {hist && <HistoryModal store={store} local={hist} onClose={() => setHist(null)} onDone={onClose} />}
    </div>
  )
}

function HistoryModal({ store, local, onClose, onDone }) {
  const [cloud, setCloud] = useState(null)
  useEffect(() => { store.getCloudVersions().then(setCloud) }, [])
  function fmtAt(at) {
    if (!at) return '—'
    const d = new Date(at)
    const p = n => String(n).padStart(2, '0')
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}. ${p(d.getHours())}:${p(d.getMinutes())}`
  }
  function count(json) { try { const o = JSON.parse(json); return (o.players || []).length } catch (e) { return '?' } }
  function restore(json) {
    if (!confirm('Vratiti podatke na ovu verziju? Trenutno stanje se zamenjuje (ali i ono ide u istoriju).')) return
    store.restoreSnapshot(json); onDone()
  }
  const cloudOnly = (cloud || []).filter(c => !local.some(l => l.json === c.json))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-h"><h3>Istorija verzija</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Na ovom uređaju</div>
          {local.length === 0 && <div className="empty" style={{ padding: 14 }}>Nema sačuvanih verzija još.</div>}
          {local.map((h, i) => (
            <div key={i} className="ge" style={{ marginBottom: 6 }}>
              <span style={{ flex: 1 }}>{fmtAt(h.at)} · <b>{count(h.json)}</b> igrača</span>
              <button className="btn sm" onClick={() => restore(h.json)}>Vrati</button>
            </div>
          ))}
          <div className="eyebrow" style={{ margin: '14px 0 8px' }}>U cloud-u {cloud === null ? '(učitavanje…)' : ''}</div>
          {cloud !== null && cloudOnly.length === 0 && <div className="empty" style={{ padding: 14 }}>Nema dodatnih cloud verzija.</div>}
          {cloudOnly.map((h, i) => (
            <div key={i} className="ge" style={{ marginBottom: 6 }}>
              <span style={{ flex: 1 }}>{fmtAt(h.at)} · <b>{count(h.json)}</b> igrača</span>
              <button className="btn sm" onClick={() => restore(h.json)}>Vrati</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
