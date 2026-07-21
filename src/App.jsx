import { useState, useEffect } from 'react'
import { Sidebar, MobileNav } from './components/Nav'
import { Icon } from './components/Icons'
import { useStore } from './data/store'

import Dashboard from './views/Dashboard'
import Players from './views/Players'
import Calendar from './views/Calendar'
import Microcycles from './views/Microcycles'
import TrainingBase from './views/TrainingBase'
import Matches from './views/Matches'
import GPS from './views/GPS'
import Settings from './views/Settings'

const TITLES = {
  dash: ['Pregled', s => `Sezona ${s.team.season} · ${s.team.period}`],
  players: ['Moj tim', s => `${s.players.length} igrača · postava, profili i statistika`],
  cal: ['Kalendar aktivnosti', () => 'Plan po danima'],
  mc: ['Mikrociklusi', () => 'Nedeljni plan'],
  base: ['Trening baza', () => 'Vežbe · koncept treninga · arhiva'],
  match: ['Utakmice', () => 'Unos, formacija i statistika mečeva'],
  gps: ['Catapult GPS', () => 'Fizičke performanse i poređenje igrača'],
  settings: ['Podešavanja', () => 'Klub, prikaz, podaci i nalog'],
}

export default function App() {
  const store = useStore()
  const [view, _setView] = useState('dash')
  const [subs, setSubs] = useState({ base: 'ex', players: 'roster', settings: 'team' }) // podtab po tabu
  const sub = subs[view]
  const setSub = (k) => setSubs(s => ({ ...s, [view]: k }))
  const [adding, setAdding] = useState(false)
  const [matchFocus, setMatchFocus] = useState(null) // koju utakmicu otvoriti u tabu
  const setView = (v) => { setAdding(false); _setView(v) }
  const openMatch = (id) => { setMatchFocus(id); setAdding(false); _setView('match') }

  const [title, subFn] = TITLES[view]
  const subtitle = subFn(store)

  useEffect(() => {
    const t = localStorage.getItem('trenertima_theme')
    if (t) document.documentElement.setAttribute('data-theme', t)
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [view])

  const canAdd = view === 'players' && subs.players === 'roster'

  const views = {
    dash: <Dashboard setView={setView} openMatch={openMatch} />,
    players: <Players sub={subs.players} setSub={k => setSubs(s => ({ ...s, players: k }))} addOpen={adding} onCloseAdd={() => setAdding(false)} />,
    cal: <Calendar openMatch={openMatch} />,
    mc: <Microcycles />,
    base: <TrainingBase sub={sub} setSub={setSub} />,
    match: <Matches focusId={matchFocus} onFocusHandled={() => setMatchFocus(null)} />,
    gps: <GPS />,
    settings: <Settings sub={subs.settings} setSub={k => setSubs(s => ({ ...s, settings: k }))} />,
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} sub={sub} setSub={setSub} />
      <div className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <div className="sub">{subtitle}</div>
          </div>
          <div className="spacer" />
          {canAdd && (
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Icon.plus /> Dodaj
            </button>
          )}
          <span className="cloud-dot" title={store.cloud === 'online' ? 'Podaci se čuvaju u cloud-u' : store.cloud === 'offline' ? 'Nema veze — čuva se lokalno' : 'Povezivanje…'}>
            <span className="d" style={{ background: store.cloud === 'online' ? 'var(--good)' : store.cloud === 'offline' ? 'var(--bad)' : 'var(--warn)' }} />
            {store.cloud === 'online' ? 'Cloud' : store.cloud === 'offline' ? 'Offline' : '…'}
          </span>
        </header>
        <div className="content">
          {store.recovery && <RecoveryBanner store={store} />}
          <div className="view" key={view}>{views[view]}</div>
        </div>
      </div>
      <MobileNav view={view} setView={setView} />
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
