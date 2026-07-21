import { useStore, initials, fmtDate, shortName } from '../data/store'
import { Icon, Crest } from '../components/Icons'
import { FEE_MONTHS, isPlayed, ourResult, WDL, wdlLabel } from '../data/seed'
import { needsFilling } from './Matches'

export default function Dashboard({ setView, openMatch }) {
  const { players, matches, microcycles, fees, team, league } = useStore()

  const curMonth = 'jul'
  const dueNames = players.filter(p => !p.exempt && !(fees[p.id] && fees[p.id][curMonth]))

  const upcoming = matches.filter(m => !isPlayed(m) && m.gf === null && m.ga === null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const next = upcoming.find(m => m.kind === 'league') || upcoming[0]
  const isLeague = next?.kind === 'league'
  const firstLeague = matches.filter(m => m.kind === 'league').sort((a, b) => (a.date < b.date ? -1 : 1))[0]

  // odigrane po datumu a nezaključane → „za popunjavanje/zatvaranje"
  const toClose = matches.filter(needsFilling).sort((a, b) => (a.date < b.date ? 1 : -1))
  // preferencije prikaza
  const lang = team.prefs?.resultLang || 'en'
  const matchCount = team.prefs?.matchCount ?? 10
  const formCount = team.prefs?.formCount ?? 5
  // poslednje zaključane (rezultati) — pun niz pa slice po preferenci
  const playedDesc = matches.filter(m => isPlayed(m) && (m.gf !== null || m.ga !== null)).sort((a, b) => (a.date < b.date ? 1 : -1))
  const recent = playedDesc.slice(0, matchCount)
  const go = m => openMatch ? openMatch(m.id) : setView('match')

  const form5 = playedDesc.slice(0, formCount).reverse()

  return (
    <section>
      {form5.length > 0 && (
        <div className="form-top">
          <span className="form-top-lab">FORMA · poslednjih {form5.length}</span>
          <div className="form-strip form-strip-lg">
            {form5.map(m => {
              const r = ourResult(m); const w = r ? WDL[r.wdl] : null
              return <span key={m.id} className="form-dot" style={{ background: w ? w.color : 'var(--line)' }}
                title={`${w ? w.full : '—'} · vs ${m.opp} ${r ? r.our + ':' + r.opp : ''}`}>{w ? wdlLabel(r.wdl, lang) : '·'}</span>
            })}
          </div>
        </div>
      )}
      {toClose.length > 0 && (
        <div className="season-box" style={{ background: 'color-mix(in srgb,#E8862B 12%,var(--surface))', borderColor: 'color-mix(in srgb,#E8862B 34%,var(--line))' }}>
          <span className="sb-ic">📝</span>
          <div className="sb-txt">
            <b>Utakmica za popunjavanje ({toClose.length})</b>
            <span>vs {toClose[0].opp} · {fmtDate(toClose[0].date)}{toClose[0].date?.slice(0, 4)} — unesi rezultat, ocene i zaključi</span>
          </div>
          <button className="btn primary sm" onClick={() => go(toClose[0])}>Popuni</button>
        </div>
      )}
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
              <div className="mid"><span className="vs-x">{fmtDate(next.date)}{next.date?.slice(0, 4)}{next.time ? ' · ' + next.time : ''}</span><br /><span style={{ fontSize: 22, color: '#fff', fontWeight: 800 }}>VS</span></div>
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

      {recent.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-h"><h3>Poslednji rezultati</h3></div>
          <div className="card-b" style={{ paddingTop: 6 }}>
            {recent.map(m => {
              const r = ourResult(m); const w = r ? WDL[r.wdl] : null
              return (
                <button key={m.id} className="list-row" style={{ width: '100%', background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => go(m)}>
                  <span className="res-badge" style={{ background: w ? w.color : 'var(--grey)' }}>{w ? wdlLabel(r.wdl, lang) : '?'}</span>
                  <div className="nm">vs {m.opp}<small>{fmtDate(m.date)}{m.date?.slice(0, 4)} · {m.home ? 'dom' : 'gost'} · {m.comp}</small></div>
                  <b className="num" style={{ fontSize: 17, color: w ? w.color : 'inherit' }}>{r ? `${r.our}:${r.opp}` : '–:–'}</b>
                </button>
              )
            })}
          </div>
        </div>
      )}
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
