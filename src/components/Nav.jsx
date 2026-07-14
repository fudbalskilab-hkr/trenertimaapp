import { useRef, useState } from 'react'
import { Icon, Crest } from './Icons'
import { useStore, initials } from '../data/store'
import { shrinkImage } from '../utils/img'

export const NAV = [
  { id: 'dash', label: 'Pregled', icon: Icon.dash, short: 'Pregled' },
  { id: 'players', label: 'Moj tim', icon: Icon.players, short: 'Moj tim', children: [
    { key: 'roster', label: 'Igrači' },
    { key: 'lineup', label: 'Prva postava' },
    { key: 'reg', label: 'Registracija' },
  ] },
  { id: 'cal', label: 'Kalendar aktivnosti', icon: Icon.cal, short: 'Kalendar' },
  { id: 'mc', label: 'Mikrociklusi', icon: Icon.mc, short: 'MC' },
  { id: 'base', label: 'Trening baza', icon: Icon.train, short: 'Trening', children: [
    { key: 'ex', label: 'Vežbe' },
    { key: 'concept', label: 'Koncept treninga' },
    { key: 'archive', label: 'Arhiva treninga' },
  ] },
  { id: 'match', label: 'Utakmice', icon: Icon.match, short: 'Meč' },
  { id: 'gps', label: 'Catapult GPS', icon: Icon.gps, short: 'GPS' },
]

export function Sidebar({ view, setView, sub, setSub }) {
  const { team } = useStore()
  const [openId, setOpenId] = useState(view)   // koji parent je raširen
  function clickParent(n) {
    if (n.children) {
      if (view === n.id) { setOpenId(o => o === n.id ? null : n.id); return } // već aktivan → toggle
      setView(n.id); setOpenId(n.id)
    } else { setView(n.id); setOpenId(null) }
  }
  return (
    <aside className="sidebar">
      <div className="brand">
        <Crest size={40} />
        <div className="brand-txt">
          <b>{team.name}</b>
          <span>{team.category} · {team.season}</span>
        </div>
      </div>
      <div className="navlabel">Glavni meni</div>
      <nav className="nav">
        {NAV.map(n => {
          const I = n.icon
          const expanded = n.children && view === n.id && openId === n.id
          return (
            <div key={n.id}>
              <button className={view === n.id ? 'on' : ''} onClick={() => clickParent(n)}>
                <I /> {n.label}
                {n.children && <span className={'nav-caret' + (expanded ? ' open' : '')}>▾</span>}
              </button>
              {expanded && (
                <div className="subnav">
                  {n.children.map(c => (
                    <button key={c.key} className={'subnav-item' + (sub === c.key ? ' on' : '')} onClick={() => setSub(c.key)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="side-foot">
        <div className="coach">
          <div className="av">{initials(team.coach || 'Trener')}</div>
          <div><b>{team.coach || 'Trener'}</b><small>Trener · {team.name}</small></div>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav({ view, setView }) {
  return (
    <nav className="mobtabs">
      {NAV.map(n => {
        const I = n.icon
        return (
          <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
            <I /> {n.short}
          </button>
        )
      })}
    </nav>
  )
}
