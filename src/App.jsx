import { useState, useEffect } from 'react'
import { Sidebar, MobileNav } from './components/Nav'
import { Icon } from './components/Icons'
import { useStore } from './data/store'

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
          {canAdd && (
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Icon.plus /> Dodaj
            </button>
          )}
          <button className="btn themebtn" onClick={toggleTheme} title="Promeni temu" aria-label="Promeni temu">
            <Icon.moon />
          </button>
        </header>
        <div className="content">
          <div className="view" key={view}>{views[view]}</div>
        </div>
      </div>
      <MobileNav view={view} setView={setView} />
    </div>
  )
}
