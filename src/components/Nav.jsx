import { useRef } from 'react'
import { Icon, Crest } from './Icons'
import { useStore, initials } from '../data/store'
import { shrinkImage } from '../utils/img'

export const NAV = [
  { id: 'dash', label: 'Pregled', icon: Icon.dash, short: 'Pregled' },
  { id: 'players', label: 'Igrači', icon: Icon.players, short: 'Igrači' },
  { id: 'cal', label: 'Kalendar aktivnosti', icon: Icon.cal, short: 'Kalendar' },
  { id: 'mc', label: 'Mikrociklusi', icon: Icon.mc, short: 'MC' },
  { id: 'train', label: 'Koncept treninga', icon: Icon.train, short: 'Trening' },
  { id: 'match', label: 'Utakmice', icon: Icon.match, short: 'Meč' },
  { id: 'gps', label: 'Catapult GPS', icon: Icon.gps, short: 'GPS' },
  { id: 'ex', label: 'Skladište vežbi', icon: Icon.ex, short: 'Vežbe' },
]

export function Sidebar({ view, setView }) {
  const { team } = useStore()
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
          return (
            <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
              <I /> {n.label}
            </button>
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
