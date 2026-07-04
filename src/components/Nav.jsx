import { useRef } from 'react'
import { Icon, Crest } from './Icons'
import { useStore, initials } from '../data/store'

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
  const { team, updateTeam } = useStore()
  const logoRef = useRef()
  function uploadLogo(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader(); r.onload = () => updateTeam({ logo: r.result }); r.readAsDataURL(file)
  }
  return (
    <aside className="sidebar">
      <div className="brand">
        <button onClick={() => logoRef.current.click()} title="Postavi grb kluba"
          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', lineHeight: 0 }}>
          <Crest size={40} url={team.logo} />
        </button>
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={uploadLogo} />
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
