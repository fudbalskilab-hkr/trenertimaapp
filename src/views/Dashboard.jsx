import { useStore, initials, fmtDate } from '../data/store'
import { Icon, Crest } from '../components/Icons'
import { FEE_MONTHS } from '../data/seed'

export default function Dashboard({ setView }) {
  const { players, matches, microcycles, fees, team } = useStore()

  const curMonth = 'jul'
  const dueNames = players.filter(p => !(fees[p.id] && fees[p.id][curMonth]))
  const next = matches.find(m => m.gf === null) || matches[0]

  return (
    <section>
      <div className="kpis">
        <Kpi icon={<Icon.team />} val={players.length} lab="Igrača u timu" />
        <Kpi icon={<Icon.cal />} val={matches.length} lab="Utakmica u planu" />
        <Kpi icon={<Icon.mc />} val={microcycles.length} lab="Mikrociklusa" />
        <Kpi icon={<Icon.shield />} val={dueNames.length} lab={`Duguju članarinu (${curMonth})`} bad />
      </div>

      <div className="two">
        {next && (
          <button className="next-match" onClick={() => setView('match')} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <div className="nm-top">
              <span className="eyebrow">Sledeća utakmica</span>
              <span className="pill" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>{next.comp}</span>
            </div>
            <div className="vs">
              <div className="team">
                <Crest size={52} url={next.home ? '' : next.crest} />
                <b>{next.home ? team.name.replace('FK ', '') : next.opp}</b>
                <small>{next.home ? 'domaćin' : 'gost'}</small>
              </div>
              <div className="mid">{fmtDate(next.date)}<br />{next.time}</div>
              <div className="team">
                {next.home
                  ? (next.crest ? <Crest size={52} url={next.crest} /> : <div className="badge-lg">grb<br />+</div>)
                  : <Crest size={52} />}
                <b>{next.home ? next.opp : team.name.replace('FK ', '')}</b>
                <small>{next.home ? 'gost' : 'domaćin'}</small>
              </div>
            </div>
            <div className="nm-meta">
              <span>📍 {next.home ? 'SC Brodarac' : 'Gostovanje'}</span>
              <span>{next.comp}</span>
              <span>Klik za unos rezultata →</span>
            </div>
          </button>
        )}

        <div className="card">
          <div className="card-h"><h3>Duguju članarinu</h3><span className="pill bad" style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>{curMonth}</span></div>
          <div className="card-b" style={{ paddingTop: 6 }}>
            {dueNames.length === 0 && <div className="empty">Svi su platili za ovaj mesec 🎉</div>}
            {dueNames.slice(0, 6).map(p => (
              <div className="list-row" key={p.id}>
                <div className="av">{initials(p.name)}</div>
                <div className="nm">{p.name}<small>{[p.pos, p.dob && p.dob.slice(0, 4)].filter(Boolean).join(' · ')}</small></div>
                <span className="pill bad">Nije plaćeno</span>
              </div>
            ))}
            {dueNames.length > 6 && <p className="mock-note" style={{ marginTop: 10 }}>+ još {dueNames.length - 6} igrača</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function Kpi({ icon, val, lab, bad }) {
  return (
    <div className="kpi">
      <div className="k-ic" style={bad ? { background: 'var(--bad-bg)', color: 'var(--bad)' } : undefined}>{icon}</div>
      <div className="k-val num" style={bad ? { color: 'var(--bad)' } : undefined}>{val}</div>
      <div className="k-lab">{lab}</div>
    </div>
  )
}
