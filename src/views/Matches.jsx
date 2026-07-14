import { useState, useRef, useEffect } from 'react'
import { useStore, fmtDate, shortName } from '../data/store'
import { posGroup, POS_COLORS, matchColor } from '../data/seed'
import { Icon, Crest } from '../components/Icons'
import FormationBoard from '../components/FormationBoard'
import RatingSlider from '../components/RatingSlider'
import { shrinkImage, urlToCrest } from '../utils/img'

// da li je utakmica prošla po datumu a još nije zaključana (treba popuniti)
export function needsFilling(m) {
  if (m.played) return false
  if (!m.date) return false
  const d = new Date(m.date + 'T23:59:59')
  return !isNaN(d) && d.getTime() < Date.now()
}

const EVENT_TYPES = [
  { type: 'goal', label: 'Gol' },
  { type: 'assist', label: 'Asistencija' },
  { type: 'yellow', label: 'Žuti' },
  { type: 'red', label: 'Crveni' },
  { type: 'sub', label: 'Izmena' },
]

export default function Matches({ focusId, onFocusHandled }) {
  const store = useStore()
  const { matches, players, team } = store
  const [activeId, setActiveId] = useState(matches[0]?.id)
  const [addEv, setAddEv] = useState(null)
  const [editMeta, setEditMeta] = useState(false)
  const [crestOpen, setCrestOpen] = useState(false)

  useEffect(() => { if (focusId) { setActiveId(focusId); onFocusHandled && onFocusHandled() } }, [focusId])

  const m = matches.find(x => x.id === activeId) || matches[0]
  const pName = id => { const p = players.find(x => x.id === id); return p ? shortName(p.name) : '—' }
  // Za prvenstvene mečeve nude se samo registrovani; pripremne i „niko nije registrovan" → svi
  const anyReg = players.some(p => p.registered)
  const matchAvail = (m && m.kind !== 'friendly' && anyReg) ? players.filter(p => p.registered) : players

  function setScore(field, val) {
    store.updateMatch(m.id, { [field]: val === '' ? null : Math.max(0, parseInt(val) || 0) })
  }
  function toggleLineup(pid) {
    const cur = m.lineup || []
    const next = cur.includes(pid) ? cur.filter(x => x !== pid) : (cur.length >= 11 ? cur : [...cur, pid])
    store.updateMatch(m.id, { lineup: next })
  }
  const addEvent = ev => { store.updateMatch(m.id, { events: [...(m.events || []), { ...ev, id: 'ev' + Date.now() }] }); setAddEv(null) }
  const removeEvent = id => store.updateMatch(m.id, { events: (m.events || []).filter(e => e.id !== id) })

  const events = [...((m && m.events) || [])].sort((a, b) => (a.minute || 0) - (b.minute || 0))
  const lineup = (m && m.lineup) || []
  const ourGoals = events.filter(e => e.type === 'goal')

  return (
    <section>
      <MatchList matches={matches} activeId={activeId} onSelect={setActiveId} onNew={() => setActiveId(store.addMatch())} />

      {matches.length === 0 && <div className="card"><div className="empty">Nema utakmica. Klikni „+ Nova utakmica".</div></div>}
      {m && <>


      {/* Izveštaj / rezultat */}
      <div className="report">
        <div className="report-side">
          {m.home ? <Crest size={54} /> : (m.crest ? <button style={{ border: 0, background: 'transparent', cursor: 'pointer' }} onClick={() => setCrestOpen(true)}><Crest size={54} url={m.crest} /></button> : <button className="report-badge" onClick={() => setCrestOpen(true)}>grb +</button>)}
          <b>{m.home ? team.name.replace('FK ', '') : m.opp}</b>
          <div className="scorers">
            {m.home
              ? ourGoals.map(e => <div className="sc-row" key={e.id}>⚽ {pName(e.playerId)} {e.minute ? e.minute + "'" : ''}</div>)
              : null}
          </div>
        </div>

        <div className="report-mid">
          <div className="sc">
            <input className="sc-box num" value={m.gf ?? ''} onChange={e => setScore('gf', e.target.value)} inputMode="numeric" placeholder="–" aria-label="Golovi domaći" />
            <span style={{ opacity: .55 }}>:</span>
            <input className="sc-box num" value={m.ga ?? ''} onChange={e => setScore('ga', e.target.value)} inputMode="numeric" placeholder="–" aria-label="Golovi gosti" />
          </div>
          <span className="status">{m.played ? '⚫ Odigrana' : '🔵 Zakazana'}</span>
          <div className="ha-toggle">
            <button className={m.home ? 'on' : ''} onClick={() => store.updateMatch(m.id, { home: true })}>Domaćin</button>
            <button className={!m.home ? 'on' : ''} onClick={() => store.updateMatch(m.id, { home: false })}>Gost</button>
          </div>
          <div className="rm-meta">{fmtDate(m.date)}{m.date?.slice(0, 4)} · {m.time}<br />{m.comp}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn sm" style={{ background: 'rgba(255,255,255,.16)', border: 0, color: '#fff' }} onClick={() => setEditMeta(true)}>Izmeni</button>
            <button className="btn sm" style={{ background: m.played ? 'rgba(255,255,255,.16)' : '#1E9E6A', border: 0, color: '#fff' }}
              onClick={() => store.updateMatch(m.id, { played: !m.played })}>
              {m.played ? 'Otključaj' : '✓ Zaključi'}
            </button>
          </div>
        </div>

        <div className="report-side">
          {m.home
            ? (m.crest ? <button style={{ border: 0, background: 'transparent', cursor: 'pointer' }} onClick={() => setCrestOpen(true)}><Crest size={54} url={m.crest} /></button> : <button className="report-badge" onClick={() => setCrestOpen(true)}>grb +</button>)
            : <Crest size={54} />}
          <b>{m.home ? m.opp : team.name.replace('FK ', '')}</b>
          <div className="scorers">
            {!m.home
              ? ourGoals.map(e => <div className="sc-row" key={e.id}>⚽ {pName(e.playerId)} {e.minute ? e.minute + "'" : ''}</div>)
              : null}
          </div>
        </div>
      </div>

      {/* Postava i formacija */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-h"><h3>Postava i formacija</h3></div>
        <div className="card-b"><FormationBoard data={m} players={players} available={matchAvail} onChange={patch => store.updateMatch(m.id, patch)} /></div>
      </div>

      {/* Igrači na meču — minuti, učinak, ocena, beleška (sve na jednom mestu) */}
      <PlayersCard m={m} players={players} store={store} />


      <div>
        {/* Tok meča */}
        <div className="card">
          <div className="card-h"><h3>Tok meča</h3><span className="pill blue" style={{ marginLeft: 'auto' }}>{events.length} događaja</span></div>
          <div className="card-b">
            <div className="addbar">
              <span className="lab">Dodaj:</span>
              {EVENT_TYPES.map(t => (
                <button key={t.type} className="btn sm" onClick={() => setAddEv(t.type)}><EvIcon type={t.type} /> {t.label}</button>
              ))}
            </div>
            <div className="timeline">
              {events.length === 0 && <div className="empty">Nema događaja. Dodaj gol, asistenciju, karton ili izmenu ↑</div>}
              {events.map(e => (
                <div className="tl" key={e.id}>
                  <span className="min">{e.minute ? e.minute + "'" : '—'}</span>
                  <span className={'ic ' + evCls(e.type)}><EvIcon type={e.type} /></span>
                  <span className="desc">
                    {e.type === 'sub'
                      ? <><b>{pName(e.inId)}</b><small>ulazi za {pName(e.outId)}</small></>
                      : <><b>{pName(e.playerId)}</b><small>{evName(e.type)}</small></>}
                  </span>
                  <button className="btn ghost sm" onClick={() => removeEvent(e.id)} title="Ukloni"><Icon.trash /></button>
                </div>
              ))}
            </div>
            <p className="mock-note" style={{ marginTop: 12 }}>Golovi, asistencije i kartoni se automatski sabiraju u statistiku igrača. Clean sheet ide postavi kad je primljeno 0 golova.</p>
          </div>
        </div>
      </div>

      {/* Izveštaj sa utakmice */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Izveštaj sa utakmice</h3></div>
        <div className="card-b">
          <textarea className="input" rows={4} defaultValue={m.report || ''} placeholder="Celokupan utisak: šta je bilo dobro, šta popraviti, ključni momenti…"
            onBlur={e => store.updateMatch(m.id, { report: e.target.value })} />
        </div>
      </div>

      {addEv && <AddEvent type={addEv} players={players} lineup={lineup} onClose={() => setAddEv(null)} onSave={addEvent} />}
      {editMeta && <EditMatchMeta m={m} onClose={() => setEditMeta(false)}
        onSave={patch => { store.updateMatch(m.id, patch); setEditMeta(false) }}
        onDelete={() => { if (confirm(`Obrisati utakmicu vs ${m.opp}?`)) { store.removeMatch(m.id); setEditMeta(false); setActiveId(matches.find(x => x.id !== m.id)?.id) } }} />}
      {crestOpen && <CrestPicker current={m.crest} onClose={() => setCrestOpen(false)}
        onSave={url => { store.updateMatch(m.id, { crest: url }); setCrestOpen(false) }} />}
      </>}
    </section>
  )
}

function sortMatches(matches, mode) {
  const arr = [...matches]
  if (mode === 'scheduled') { // zakazane: najbliža prvo (rastuće), prazan datum na kraj
    return arr.sort((a, b) => (a.date || '9999-99-99') < (b.date || '9999-99-99') ? -1 : 1)
  }
  // odigrane / sve: najnovije prvo (opadajuće), prazan datum gore (tek napravljeno)
  return arr.sort((a, b) => { const da = a.date || '9999-99-99', db = b.date || '9999-99-99'; return da < db ? 1 : da > db ? -1 : 0 })
}

function MatchList({ matches, activeId, onSelect, onNew }) {
  const [view, setView] = useState(() => localStorage.getItem('trenertima_matchview') || 'list')
  const [filter, setFilter] = useState('played') // played | scheduled | all
  const [page, setPage] = useState(0)
  const [allOpen, setAllOpen] = useState(false)
  const played = matches.filter(m => m.played)
  // ako nema odigranih, ne prikazuj prazno — padni na „sve"
  const eff = filter === 'played' && played.length === 0 ? 'all' : filter
  const base = eff === 'played' ? played : eff === 'scheduled' ? matches.filter(m => !m.played) : matches
  const sorted = sortMatches(base, eff)
  const per = 5
  const maxPage = Math.max(0, Math.ceil(sorted.length / per) - 1)
  const pg = Math.min(page, maxPage)
  const items = sorted.slice(pg * per, pg * per + per)
  const setV = v => { setView(v); localStorage.setItem('trenertima_matchview', v) }
  const setF = f => { setFilter(f); setPage(0) }
  const FILTERS = [['played', 'Odigrane'], ['scheduled', 'Zakazane'], ['all', 'Sve']]

  return (
    <div className="match-browser">
      <div className="mb-bar">
        <button className="btn primary sm" onClick={() => { onNew(); setFilter('scheduled'); setPage(0) }}><Icon.plus /> Nova utakmica</button>
        <div className="match-filter">
          {FILTERS.map(([k, lab]) => (
            <button key={k} className={eff === k ? 'on' : ''} onClick={() => setF(k)}>{lab}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="view-toggle">
          <button className={view === 'list' ? 'on' : ''} onClick={() => setV('list')} title="Lista">☰</button>
          <button className={view === 'cards' ? 'on' : ''} onClick={() => setV('cards')} title="Kartice">▦</button>
        </div>
        <button className="btn sm" onClick={() => setAllOpen(true)}>Sve utakmice ({matches.length})</button>
      </div>

      {sorted.length > 0 && (
        <div className="mb-body">
          <button className="mb-arrow" disabled={pg >= maxPage} onClick={() => setPage(pg + 1)} title="Starije">‹</button>
          <div className={view === 'cards' ? 'match-cards' : 'match-rows'}>
            {items.map(m => view === 'cards'
              ? <MatchCard key={m.id} m={m} active={m.id === activeId} onClick={() => onSelect(m.id)} />
              : <MatchRow key={m.id} m={m} active={m.id === activeId} onClick={() => onSelect(m.id)} />)}
          </div>
          <button className="mb-arrow" disabled={pg <= 0} onClick={() => setPage(pg - 1)} title="Novije">›</button>
        </div>
      )}
      {sorted.length > per && <div className="mb-page">prikaz {pg * per + 1}–{Math.min(pg * per + per, sorted.length)} od {sorted.length} · strelice za dalje</div>}

      {allOpen && <AllMatches matches={sortMatches(matches, 'all')} activeId={activeId} onClose={() => setAllOpen(false)} onSelect={id => { onSelect(id); setAllOpen(false) }} />}
    </div>
  )
}

function MatchRow({ m, active, onClick }) {
  const c = matchColor(m)
  return (
    <button className={'match-row' + (active ? ' active' : '')} onClick={onClick} style={{ borderLeftColor: c.color }}>
      {needsFilling(m) && <span className="match-flag" title="Treba popuniti">!</span>}
      <span className="mr-date">{m.date ? fmtDate(m.date) : '—'}</span>
      <span className="mr-crest">{m.crest ? <img src={m.crest} alt="" /> : <span className="mr-nocrest">?</span>}</span>
      <span className="mr-opp">{m.opp}</span>
      <span className="mr-ha" style={{ background: c.color }} title={c.label}>{c.short}</span>
      <span className="mr-res num">{m.played ? `${m.gf ?? '–'}:${m.ga ?? '–'}` : (m.time || '')}</span>
      <span className="mr-comp">{m.comp}</span>
    </button>
  )
}

function MatchCard({ m, active, onClick }) {
  const c = matchColor(m)
  return (
    <button className={'match-card' + (active ? ' active' : '')} onClick={onClick} style={{ borderTopColor: c.color }}>
      {needsFilling(m) && <span className="match-flag" title="Treba popuniti">!</span>}
      <div className="mcard-crest">{m.crest ? <img src={m.crest} alt="" /> : <span className="mr-nocrest">?</span>}</div>
      <div className="mcard-res num">{m.played ? `${m.gf ?? '–'}:${m.ga ?? '–'}` : 'VS'}</div>
      <div className="mcard-opp">{m.opp}</div>
      <div className="mcard-meta"><span className="mr-ha" style={{ background: c.color }}>{c.short}</span> {m.date ? fmtDate(m.date) : '—'}</div>
      <div className="mcard-comp">{m.comp}</div>
    </button>
  )
}

function AllMatches({ matches, activeId, onClose, onSelect }) {
  const [q, setQ] = useState('')
  const ql = q.trim().toLowerCase()
  const list = ql ? matches.filter(m => (m.opp || '').toLowerCase().includes(ql) || (m.comp || '').toLowerCase().includes(ql)) : matches
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-h"><h3>Sve utakmice ({matches.length})</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b" style={{ maxHeight: '72vh', overflow: 'auto' }}>
          <input className="input" style={{ marginBottom: 10 }} value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 traži po protivniku ili takmičenju…" />
          <div className="match-rows">
            {list.map(m => <MatchRow key={m.id} m={m} active={m.id === activeId} onClick={() => onSelect(m.id)} />)}
            {list.length === 0 && <div className="empty" style={{ padding: 16 }}>Nema rezultata.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CrestPicker({ current, onClose, onSave }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()
  function upload(e) {
    const file = e.target.files[0]; if (!file) return
    setBusy(true); shrinkImage(file, 256, true).then(u => { onSave(u) })
  }
  function fromUrl() {
    if (!url.trim()) return
    setBusy(true); urlToCrest(url).then(u => onSave(u))
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Grb protivnika</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          {current && <div style={{ textAlign: 'center', marginBottom: 14 }}><Crest size={64} url={current} /></div>}
          <div className="field"><label>Nalepi link slike (URL)</label>
            <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…/grb.png" autoFocus />
            <p className="mock-note" style={{ marginTop: 6 }}>Npr. sa Wikipedije (desni klik na sliku → „Copy image address"). PNG sa providnom pozadinom je najbolji.</p>
          </div>
          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !url.trim()} onClick={fromUrl}>{busy ? 'Učitavam…' : 'Dodaj sa linka'}</button>
          <div style={{ textAlign: 'center', color: 'var(--grey)', fontSize: 12, margin: '12px 0' }}>— ili —</div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => fileRef.current.click()}><Icon.upload /> Ubaci sliku sa uređaja</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
          {current && <button className="btn ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--bad)', marginTop: 10 }} onClick={() => onSave('')}>Ukloni grb</button>}
        </div>
      </div>
    </div>
  )
}


const POS_RANK = { gk: 0, def: 1, mid: 2, att: 3 }
const posRank = p => { const g = posGroup(p.pos); return g ? POS_RANK[g] : 9 }
const GROUPS = [{ key: 'gk', label: 'Golmani' }, { key: 'def', label: 'Odbrana' }, { key: 'mid', label: 'Vezni red' }, { key: 'att', label: 'Napad' }, { key: '_', label: 'Ostalo' }]
const byPosNum = (a, b) => posRank(a) - posRank(b) || (a.number ?? 99) - (b.number ?? 99)
const STATS = [
  { type: 'goal', ico: '⚽' }, { type: 'assist', ico: '🅰' },
  { type: 'yellow', ico: '🟨' }, { type: 'red', ico: '🟥' },
]

function PlayersCard({ m, players, store }) {
  const [addOpen, setAddOpen] = useState(false)
  const lineup = m.lineup || []
  const events = m.events || []
  const minutes = m.minutes || {}
  const ratings = m.ratings || {}
  const extra = m.extra || []
  const involvedIds = new Set([
    ...lineup, ...extra,
    ...events.filter(e => e.type === 'sub').map(e => e.inId),
    ...events.filter(e => e.playerId).map(e => e.playerId),
    ...Object.keys(minutes), ...Object.keys(ratings),
  ].filter(Boolean))
  const involved = players.filter(p => involvedIds.has(p.id)).sort((a, b) => posRank(a) - posRank(b) || (a.number ?? 99) - (b.number ?? 99))
  const cnt = (pid, type) => events.filter(e => e.playerId === pid && e.type === type).length
  const setMin = (pid, v) => store.updateMatch(m.id, { minutes: { ...minutes, [pid]: v === '' ? undefined : Math.max(0, Math.min(120, parseInt(v) || 0)) } })
  const fill90 = () => { const nm = { ...minutes }; lineup.forEach(pid => { if (nm[pid] == null) nm[pid] = 90 }); store.updateMatch(m.id, { minutes: nm }) }
  const isStarter = pid => lineup.includes(pid)
  const cleanSheet = pid => { const g = posGroup(players.find(p => p.id === pid)?.pos); return (g === 'gk' || g === 'def') && isStarter(pid) && m.ga === 0 }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-h"><h3>Igrači na meču</h3>
        <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={fill90}>90′ startnima</button>
        <button className="btn sm" onClick={() => setAddOpen(true)}><Icon.plus /> Dodaj igrača (izmena)</button></div>
      <div className="card-b">
        {involved.length === 0 ? <div className="empty">Postavi prvu postavu (gore) pa se igrači pojave ovde.</div> : (
          <div className="pm-rows">
            {involved.map(p => {
              const r = ratings[p.id] || {}
              return (
                <div className="pmr" key={p.id}>
                  <div className="pmr-head">
                    <div className="pmr-name">
                      <b>{shortName(p.name)}</b> {p.pos && <span className="pos">{p.pos}</span>}
                      {!isStarter(p.id) && <span className="pmr-tag">izmena</span>}
                      {cleanSheet(p.id) && <span className="pmr-cs" title="Clean sheet">CS</span>}
                    </div>
                    <div className="pmr-min">
                      <input className="input" inputMode="numeric" value={minutes[p.id] ?? ''} onChange={e => setMin(p.id, e.target.value)} placeholder="min" />
                      <span className="pmr-unit">min</span>
                    </div>
                    {!isStarter(p.id) && <button className="btn ghost sm" title="Ukloni igrača" onClick={() => store.removeMatchPlayer(m.id, p.id)}><Icon.trash /></button>}
                  </div>
                  <div className="pmr-stats">
                    {STATS.map(s => {
                      const c = cnt(p.id, s.type)
                      return (
                        <div className={'stepper' + (c ? ' has' : '')} key={s.type}>
                          <button className="st-minus" disabled={!c} onClick={() => store.removeMatchEvent(m.id, p.id, s.type)}>−</button>
                          <span className="st-ico">{s.ico}</span><span className="st-n num">{c}</span>
                          <button className="st-plus" onClick={() => store.addMatchEvent(m.id, p.id, s.type)}>+</button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pmr-rate">
                    <RatingSlider value={r.score} onChange={v => store.setMatchRating(m.id, p.id, { score: v })} />
                    <input className="input pmr-note" defaultValue={r.note || ''} placeholder="beleška o igraču…"
                      onBlur={e => store.setMatchRating(m.id, p.id, { note: e.target.value })} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="mock-note" style={{ marginTop: 12 }}>Sve za igrača na jednom mestu: minuti, gol/asist/kartoni (klik + / −), ocena (5–10, klizač, podrazumevano 6,5) i beleška. Clean sheet ide automatski golmanu i odbrani kad je primljeno 0 golova. Igrači su poređani po pozicijama (GK → ATT).</p>
      </div>
      {addOpen && <AddMatchPlayer players={players.filter(p => !involvedIds.has(p.id))} onClose={() => setAddOpen(false)}
        onPick={pid => { store.addMatchPlayer(m.id, pid); setAddOpen(false) }} />}
    </div>
  )
}

function AddMatchPlayer({ players, onClose, onPick }) {
  const [q, setQ] = useState('')
  const ql = q.trim().toLowerCase()
  const list = ql ? players.filter(p => p.name.toLowerCase().includes(ql) || (p.pos || '').toLowerCase().includes(ql)) : players
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Dodaj igrača (ušao kao izmena)</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b" style={{ maxHeight: '62vh', overflow: 'auto' }}>
          {players.length === 0 ? <div className="empty">Svi igrači su već na spisku.</div> : (<>
            <input className="input" style={{ marginBottom: 10 }} value={q} autoFocus onChange={e => setQ(e.target.value)} placeholder="🔍 traži igrača…" />
            {GROUPS.map(g => {
              const gl = list.filter(p => (posGroup(p.pos) || '_') === g.key).sort(byPosNum)
              if (!gl.length) return null
              return (
                <div key={g.key} className="pick-group">
                  <div className="pick-group-h"><span className="bg-dot" style={{ background: POS_COLORS[g.key] || '#adb5bd' }} />{g.label} <span className="bg-n">{gl.length}</span></div>
                  <div className="lineup-chips">
                    {gl.map(p => {
                      const col = POS_COLORS[posGroup(p.pos) || '_'] || '#868e96'
                      return (
                        <button key={p.id} className="pchip" onClick={() => onPick(p.id)} style={{ borderLeft: `4px solid ${col}` }}>
                          <span className="pc-num" style={{ background: col }}>{p.pos || '–'}</span>
                          <span className="pc-name">{shortName(p.name)}</span>{p.number != null && p.number !== '' && <span className="pc-pos">#{p.number}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {ql && list.length === 0 && <div className="empty" style={{ padding: 12 }}>Nema rezultata za „{q}".</div>}
          </>)}
        </div>
      </div>
    </div>
  )
}

function EditMatchMeta({ m, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ opp: m.opp, date: m.date, time: m.time, comp: m.comp, home: m.home, kind: m.kind || 'friendly' })
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Izmeni podatke utakmice</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Protivnik</label><input className="input" value={f.opp} autoFocus onChange={e => set('opp', e.target.value)} /></div>
          <div className="row2">
            <div className="field"><label>Datum</label><input className="input" type="date" value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="field"><label>Vreme</label><input className="input" value={f.time} onChange={e => set('time', e.target.value)} placeholder="17:00" /></div>
          </div>
          <div className="field"><label>Takmičenje</label><input className="input" value={f.comp} onChange={e => set('comp', e.target.value)} placeholder="Prijateljska / Omladinska liga · 1. kolo" /></div>
          <div className="row2">
            <div className="field"><label>Mesto</label><select className="input" value={f.home ? '1' : '0'} onChange={e => set('home', e.target.value === '1')}><option value="1">Domaćin</option><option value="0">Gost</option></select></div>
            <div className="field"><label>Tip</label><select className="input" value={f.kind} onChange={e => set('kind', e.target.value)}><option value="friendly">Prijateljska</option><option value="league">Prvenstvena</option></select></div>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn ghost" style={{ color: 'var(--bad)', marginRight: 'auto' }} onClick={onDelete}><Icon.trash /> Obriši</button>
          <button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" onClick={() => onSave(f)}>Sačuvaj</button>
        </div>
      </div>
    </div>
  )
}

function evName(type) { return { goal: 'gol', assist: 'asistencija', yellow: 'žuti karton', red: 'crveni karton' }[type] || '' }
function evCls(type) { return type === 'goal' ? 'g' : type === 'assist' ? 'a' : type === 'sub' ? 'sub' : 'y' }
function EvIcon({ type }) {
  if (type === 'goal') return <span>⚽</span>
  if (type === 'assist') return <span>🅰</span>
  if (type === 'yellow') return <span className="cardico" style={{ background: 'var(--warn)' }} />
  if (type === 'red') return <span className="cardico" style={{ background: 'var(--bad)' }} />
  return <span>🔄</span>
}

function AddEvent({ type, players, lineup, onClose, onSave }) {
  const [pid, setPid] = useState('')
  const [inId, setInId] = useState('')
  const [outId, setOutId] = useState('')
  const [minute, setMinute] = useState('')
  const isSub = type === 'sub'
  const title = { goal: 'Gol', assist: 'Asistencija', yellow: 'Žuti karton', red: 'Crveni karton', sub: 'Izmena' }[type]
  const ok = isSub ? (inId && outId) : pid
  const onField = players.filter(p => lineup.includes(p.id))
  const offField = players.filter(p => !lineup.includes(p.id))
  const save = () => isSub ? onSave({ type, inId, outId, minute: Number(minute) || null }) : onSave({ type, playerId: pid, minute: Number(minute) || null })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>{title}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          {isSub ? (
            <div className="row2">
              <div className="field"><label>Ulazi</label>
                <select className="input" value={inId} onChange={e => setInId(e.target.value)}>
                  <option value="">— izaberi —</option>{offField.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div className="field"><label>Izlazi</label>
                <select className="input" value={outId} onChange={e => setOutId(e.target.value)}>
                  <option value="">— izaberi —</option>{onField.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
            </div>
          ) : (
            <div className="field"><label>Igrač</label>
              <select className="input" value={pid} onChange={e => setPid(e.target.value)} autoFocus>
                <option value="">— izaberi —</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
          )}
          <div className="field"><label>Minut (opciono)</label>
            <input className="input" inputMode="numeric" value={minute} onChange={e => setMinute(e.target.value)} placeholder="npr. 67" /></div>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!ok} onClick={save}>Dodaj</button></div>
      </div>
    </div>
  )
}
