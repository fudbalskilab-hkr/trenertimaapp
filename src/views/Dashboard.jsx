import { useStore, initials, fmtDate } from '../data/store'
import { Icon, Crest } from '../components/Icons'
import { FEE_MONTHS } from '../data/seed'

export default function Dashboard({ setView }) {
  const { players, matches, microcycles, fees, team, league } = useStore()

  const curMonth = 'jul'
  const dueNames = players.filter(p => !p.exempt && !(fees[p.id] && fees[p.id][curMonth]))

  const upcoming = matches.filter(m => m.gf === null && m.ga === null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  // sledeća prvenstvena je glavna; ako je nema, sledeća bilo koja
  const next = upcoming.find(m => m.kind === 'league') || upcoming[0]
  const isLeague = next?.kind === 'league'
  const firstLeague = matches.filter(m => m.kind === 'league').sort((a, b) => (a.date < b.date ? -1 : 1))[0]

  return (
    <section>
      {firstLeague && (
        <div className="season-box">
          <span className="sb-ic">🏆</span>
          <div className="sb-txt">
            <b>Početak sezone — {firstLeague.comp.replace('Omladinska liga · ', '') || '1. kolo'}</b>
            <span>{firstLeague.league ? '' : ''}vs {firstLeague.opp} · {fmtDate(firstLeague.date)}{firstLeague.date?.slice(0, 4)} · {firstLeague.home ? 'domaćin' : 'gost'}</span>
          </div>
          <button className="btn sm" onClick={() => setView('match')}>Detalji</button>
        </div>
      )}
      <div className="kpis">
        <Kpi icon={<Icon.team />} val={players.length} lab="Igrača u timu" />
        <Kpi icon={<Icon.cal />} val={upcoming.length} lab="Utakmica u planu" />
        <Kpi icon={<Icon.mc />} val={microcycles.length} lab="Mikrociklusa" />
        <Kpi icon={<Icon.shield />} val={dueNames.length} lab={`Duguju članarinu (${curMonth})`} bad />
      </div>

      <div className="two">
        {next && (
          <button className={'next-match' + (isLeague ? ' league' : '')} onClick={() => setView('match')} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <div className="nm-top">
              <span className="eyebrow">{isLeague ? 'Sledeća prvenstvena utakmica' : 'Sledeća utakmica'}</span>
              {isLeague && (
                <span className="league-badge">
                  {league.logo ? <img src={league.logo} alt="liga" /> : <span className="ll-ph">liga</span>}
                  {league.name}
                </span>
              )}
            </div>
            <div className="vs">
              <TeamBadge brodarac={next.home} team={team} opp={next.opp} crest={next.crest} side={next.home ? 'domaćin' : 'gost'} big />
              <div className="mid"><span className="vs-x">{fmtDate(next.date)}{next.date?.slice(0, 4)}</span><br />{next.time}<br /><span style={{ fontSize: 22, color: '#fff', fontWeight: 800 }}>VS</span></div>
              <TeamBadge brodarac={!next.home} team={team} opp={next.opp} crest={next.crest} side={next.home ? 'gost' : 'domaćin'} big />
            </div>
            <div className="nm-meta">
              <span>📍 {next.home ? 'SC Brodarac' : 'Gostovanje'}</span>
              <span>{next.comp}</span>
              <span>Klik za detalje →</span>
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

function TeamBadge({ brodarac, team, opp, crest, side, big }) {
  const sz = big ? 72 : 52
  return (
    <div className="team">
      {brodarac
        ? <Crest size={sz} />
        : (crest ? <Crest size={sz} url={crest} /> : <div className="badge-lg" style={big ? { width: 72, height: 72 } : undefined}>grb<br />+</div>)}
      <b>{brodarac ? team.name.replace('FK ', '') : opp}</b>
      <small>{side}</small>
    </div>
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
