import { Icon, Crest } from './Icons'
import { useStore } from '../data/store'

export const NAV = [
  { id: 'dash', label: 'Pregled', icon: Icon.dash, short: 'Pregled' },
  { id: 'players', label: 'Igrači', icon: Icon.players, short: 'Igrači' },
  { id: 'cal', label: 'Kalendar aktivnosti', icon: Icon.cal, short: 'Kalendar' },
  { id: 'mc', label: 'Mikrociklusi', icon: Icon.mc, short: 'MC' },
  { id: 'train', label: 'Koncept treninga', icon: Icon.train, short: 'Trening' },
  { id: 'match', label: 'Utakmice', icon: Icon.match, short: 'Meč' },
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
          <div className="av">MT</div>
          <div><b>Trener</b><small>{team.name}</small></div>
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
