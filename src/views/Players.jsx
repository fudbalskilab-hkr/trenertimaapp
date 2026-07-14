import { useState, useEffect, useMemo, useRef, Fragment } from 'react'
import { useStore, ageFrom, initials, computeStats, computeRatings, fmtDate } from '../data/store'
import { FEE_MONTHS, posGroup, POS_COLORS } from '../data/seed'
import { Icon } from '../components/Icons'
import { shrinkImage } from '../utils/img'
import { ratingColor } from '../components/RatingSlider'
import FormationBoard from '../components/FormationBoard'

const SORTS = [
  { key: 'pos', label: 'Po pozicijama (GK→ATT)' },
  { key: 'dob', label: 'Najmlađi → najstariji' },
  { key: 'dobOld', label: 'Najstariji → najmlađi' },
  { key: 'minutes', label: 'Najviše minuta' },
  { key: 'apps', label: 'Najviše nastupa' },
  { key: 'name', label: 'Ime (A–Š)' },
]
const GROUP_ORDER = { gk: 0, def: 1, mid: 2, att: 3 }
const posRank = p => { const g = posGroup(p.pos); return g ? GROUP_ORDER[g] : 9 }

// datum: interno yyyy-mm-dd, prikaz dd/mm/gggg
function isoToDisp(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return (d && m && y) ? `${d}/${m}/${y}` : '' }
function dispToIso(s) {
  if (!s) return ''
  const m = s.trim().match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})\.?$/)
  if (!m) return ''
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}
function posBadge(pos) {
  if (!pos) return '—'
  const g = posGroup(pos); const c = g ? POS_COLORS[g] : null
  return <span className="pos" style={c ? { background: c, color: '#fff', borderColor: c } : undefined}>{pos}</span>
}

// kolone koje se biraju (name je uvek tu)
const COLUMNS = [
  { key: 'number', label: 'Broj dresa' },
  { key: 'dob', label: 'Datum rođenja' },
  { key: 'age', label: 'Godine' },
  { key: 'foot', label: 'Jača noga' },
  { key: 'pos', label: 'Pozicija' },
  { key: 'alt', label: 'Alternativna' },
  { key: 'hw', label: 'Visina/težina' },
  { key: 'apps', label: 'Nastupi' },
  { key: 'minutes', label: 'Minuti' },
  { key: 'goals', label: 'Golovi' },
  { key: 'fee', label: 'Članarina (jul)' },
]
const DEFAULT_COLS = ['number', 'dob', 'foot', 'pos', 'alt']
function loadCols() {
  try { const r = localStorage.getItem('trenertima_pcols'); if (r) return JSON.parse(r) } catch (e) {}
  return DEFAULT_COLS
}

function numCol(key) { return ['number', 'age', 'apps', 'minutes', 'goals'].includes(key) }
function cellValue(key, p, fees) {
  switch (key) {
    case 'number': return p.number ?? '—'
    case 'dob': return p.dob ? fmtDate(p.dob) + p.dob.slice(0, 4) + '.' : '—'
    case 'age': return ageFrom(p.dob) ?? '—'
    case 'foot': return <span style={{ textTransform: 'capitalize' }}>{p.foot || '—'}</span>
    case 'pos': return posBadge(p.pos)
    case 'alt': return p.alt ? <span className="pos">{p.alt}</span> : '—'
    case 'hw': return p.hw || '—'
    case 'apps': return p._st?.apps ?? 0
    case 'minutes': return p._st?.minutes ?? 0
    case 'goals': return p._st?.goals ?? 0
    case 'fee': { const paid = fees[p.id] && fees[p.id].jul; return <span className="dot" style={{ background: paid ? 'var(--good)' : 'var(--bad)' }} /> }
    default: return '—'
  }
}

const SUBTABS = [['roster', 'Igrači'], ['lineup', 'Prva postava'], ['reg', 'Registracija']]

export default function Players({ sub, setSub, addOpen, onCloseAdd }) {
  return (
    <>
      <div className="subtabs mobile-only">
        {SUBTABS.map(([k, l]) => <button key={k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{l}</button>)}
      </div>
      {sub === 'lineup' ? <TeamLineup />
        : sub === 'reg' ? <Registration />
          : <Roster addOpen={addOpen} onCloseAdd={onCloseAdd} />}
    </>
  )
}

function TeamLineup() {
  const store = useStore()
  const { team, players } = store
  const anyReg = players.some(p => p.registered)
  const avail = anyReg ? players.filter(p => p.registered) : players
  return (
    <section>
      <div className="sec-title"><h2>Prva postava</h2><span className="eyebrow">podrazumevana — kopira se u svaku novu utakmicu</span></div>
      <div className="card"><div className="card-b">
        <FormationBoard data={team.lineup || {}} players={players} available={avail} onChange={patch => store.updateTeamLineup(patch)} />
      </div></div>
      <p className="mock-note">Ovo je tvoja podrazumevana postava. Kad napraviš novu utakmicu, automatski se prekopira, pa je tamo menjaš za taj meč. {anyReg ? 'Nude se samo registrovani igrači.' : 'Trenutno se nude svi (još niko nije registrovan).'}</p>
    </section>
  )
}

function Registration() {
  const store = useStore()
  const { players } = store
  const [draft, setDraft] = useState(() => new Set(players.filter(p => p.registered).map(p => p.id)))
  const [saved, setSaved] = useState(false)
  const sorted = [...players].sort((a, b) => posRank(a) - posRank(b) || (a.number ?? 99) - (b.number ?? 99) || a.name.localeCompare(b.name, 'sr'))
  const toggle = id => { setSaved(false); setDraft(d => { const n = new Set(d); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function save() {
    players.forEach(p => { const reg = draft.has(p.id); if (!!p.registered !== reg) store.updatePlayer(p.id, { registered: reg }) })
    setSaved(true)
  }
  return (
    <section>
      <div className="sec-title"><h2>Registracija igrača</h2><span className="eyebrow">{draft.size} od {players.length} registrovano</span>
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={save}>✓ Sačuvaj</button></div>
      <div className="card"><div className="card-b">
        <p className="mock-note" style={{ marginTop: 0 }}>Štikliraj registrovane pa „Sačuvaj". Na <b>prvenstvenim</b> utakmicama nude se samo registrovani; na <b>pripremnim</b> svi.</p>
        <div className="reg-list">
          {sorted.map(p => {
            const col = POS_COLORS[posGroup(p.pos) || '_'] || '#868e96'
            return (
              <label key={p.id} className={'reg-item' + (draft.has(p.id) ? ' on' : '')}>
                <input type="checkbox" checked={draft.has(p.id)} onChange={() => toggle(p.id)} />
                <span className="reg-pos" style={{ background: col }}>{p.pos || '–'}</span>
                <span className="reg-name">{p.name}</span>
                {p.number != null && p.number !== '' && <span className="reg-num">#{p.number}</span>}
              </label>
            )
          })}
        </div>
        {saved && <p className="mock-note" style={{ color: 'var(--good)', marginBottom: 0 }}>✓ Sačuvano.</p>}
      </div></div>
    </section>
  )
}

function Roster({ addOpen, onCloseAdd }) {
  const store = useStore()
  const { players, matches, fees } = store
  const [selId, setSelId] = useState(players[0]?.id)
  const [sort, setSort] = useState('pos')
  const [editing, setEditing] = useState(null)
  const [cols, setCols] = useState(loadCols)
  const [colMenu, setColMenu] = useState(false)
  useEffect(() => { try { localStorage.setItem('trenertima_pcols', JSON.stringify(cols)) } catch (e) {} }, [cols])
  const toggleCol = (k) => setCols(c => c.includes(k) ? c.filter(x => x !== k) : [...c, k])
  const visible = COLUMNS.filter(c => cols.includes(c.key))

  const rows = useMemo(() => {
    const withStats = players.map(p => ({ ...p, _st: computeStats(p.id, matches, p) }))
    const byDob = (a, b) => {
      if (!a.dob && !b.dob) return 0
      if (!a.dob) return 1
      if (!b.dob) return -1
      return a.dob < b.dob ? 1 : -1 // veći datum (mlađi) prvi
    }
    const arr = [...withStats]
    if (sort === 'pos') arr.sort((a, b) => posRank(a) - posRank(b) || (a.number ?? 99) - (b.number ?? 99) || a.name.localeCompare(b.name, 'sr'))
    else if (sort === 'dob') arr.sort(byDob)
    else if (sort === 'dobOld') arr.sort((a, b) => -byDob(a, b))
    else if (sort === 'minutes') arr.sort((a, b) => b._st.minutes - a._st.minutes)
    else if (sort === 'apps') arr.sort((a, b) => b._st.apps - a._st.apps)
    else if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'sr'))
    // registrovani gore, neregistrovani dole (stabilno — čuva prethodni poredak unutar grupe)
    if (players.some(p => p.registered)) arr.sort((a, b) => (b.registered ? 1 : 0) - (a.registered ? 1 : 0))
    return arr
  }, [players, matches, sort])

  const sel = players.find(p => p.id === selId) || players[0]

  return (
    <section className="split">
      <div className="card">
        <div className="card-h">
          <h3>Spisak igrača</h3>
          <span className="pill blue">{players.length} igrača</span>
          <select className="input" style={{ width: 'auto', marginLeft: 'auto', padding: '6px 10px', fontSize: 12.5 }}
            value={sort} onChange={e => setSort(e.target.value)} title="Poredak">
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <div className="dropwrap">
            <button className="btn sm" onClick={() => setColMenu(v => !v)}>Kolone ▾</button>
            {colMenu && (
              <div className="dropmenu" onMouseLeave={() => setColMenu(false)}>
                {COLUMNS.map(c => (
                  <label key={c.key}><input type="checkbox" checked={cols.includes(c.key)} onChange={() => toggleCol(c.key)} />{c.label}</label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 14px 0' }}>
          <div className="poslegend">
            <span className="li2"><span className="sw" style={{ background: POS_COLORS.gk }} />Golman</span>
            <span className="li2"><span className="sw" style={{ background: POS_COLORS.def }} />Odbrana</span>
            <span className="li2"><span className="sw" style={{ background: POS_COLORS.mid }} />Vezni</span>
            <span className="li2"><span className="sw" style={{ background: POS_COLORS.att }} />Napad</span>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Igrač</th>{visible.map(c => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const g = posGroup(p.pos)
                const showDiv = i > 0 && rows[i - 1].registered && !p.registered
                return (
                  <Fragment key={p.id}>
                    {showDiv && <tr className="reg-div"><td colSpan={2 + visible.length}>— Neregistrovani —</td></tr>}
                    <tr className={(p.id === sel?.id ? 'sel ' : '') + (g ? 'pg-' + g : '')}
                      style={g ? { '--pgc': POS_COLORS[g] } : undefined} onClick={() => setSelId(p.id)}>
                      <td className="rownum">{i + 1}</td>
                      <td><b>{p.name}</b>{p.registered && <span className="reg-chk" title="Registrovan">✓</span>}</td>
                      {visible.map(c => <td key={c.key} className={numCol(c.key) ? 'num' : ''}>{cellValue(c.key, p, fees)}</td>)}
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sel && <Profile key={sel.id} player={sel} store={store} matches={matches} onEdit={() => setEditing(sel)} />}
      {addOpen && <PlayerForm title="Novi igrač" submitLabel="Sačuvaj"
        initial={{ name: '', number: '', dob: '', foot: 'desna', pos: '', alt: '', hw: '' }}
        onClose={onCloseAdd} onSave={(p) => { store.addPlayer(p); onCloseAdd() }} />}
      {editing && <PlayerForm title="Izmeni igrača" submitLabel="Sačuvaj izmene"
        initial={editing}
        onClose={() => setEditing(null)} onSave={(p) => { store.updatePlayer(editing.id, p); setEditing(null) }} />}
    </section>
  )
}

function Profile({ player, store, matches, onEdit }) {
  const st = computeStats(player.id, matches, player)
  const fee = store.fees[player.id] || {}
  const age = ageFrom(player.dob)
  const exempt = !!player.exempt
  const photoRef = useRef()
  function uploadPhoto(e) {
    const file = e.target.files[0]; if (!file) return
    shrinkImage(file, 320).then(url => store.updatePlayer(player.id, { photo: url }))
  }
  return (
    <div className="card" style={{ alignSelf: 'start' }}>
      <div className="prof-head">
        <button className="prof-av" onClick={() => photoRef.current.click()} title="Postavi sliku igrača"
          style={{ border: 0, cursor: 'pointer', overflow: 'hidden', padding: 0, backgroundImage: player.photo ? `url(${player.photo})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {!player.photo && initials(player.name)}
        </button>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={uploadPhoto} />
        <div>
          <h3>{player.name}</h3>
          <div className="meta">{[player.pos, player.alt].filter(Boolean).join(' / ') || 'bez pozicije'} · {isoToDisp(player.dob) || 'nepoznat datum'}{age != null ? ` (${age})` : ''}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {player.foot && <span className="tag" style={{ textTransform: 'capitalize' }}>{player.foot} noga</span>}
            {player.hw && <span className="tag">{player.hw} cm/kg</span>}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button className="btn ghost sm" title="Izmeni igrača" onClick={onEdit}><Icon.edit /></button>
          <button className="btn ghost sm" title="Obriši igrača"
            onClick={() => { if (confirm(`Obrisati igrača ${player.name}?`)) store.removePlayer(player.id) }}>
            <Icon.trash />
          </button>
        </div>
      </div>

      <div className="kv">
        <div><div className="kk">Datum rođenja</div><div className="vv">{isoToDisp(player.dob) || '—'}</div></div>
        <div><div className="kk">Jača noga</div><div className="vv" style={{ textTransform: 'capitalize' }}>{player.foot || '—'}</div></div>
        <div><div className="kk">Pozicija</div><div className="vv">{posBadge(player.pos)}</div></div>
        <div><div className="kk">Alternativna</div><div className="vv">{player.alt || '—'}</div></div>
      </div>

      <div className="eyebrow" style={{ padding: '16px 18px 0' }}>Statistika sezone</div>
      <div className="statgrid">
        <Stat n={st.apps} l="Nastupi" />
        <Stat n={st.minutes} l="Minuti" />
        <Stat n={st.goals} l="Golovi" />
        <Stat n={st.assists} l="Asist." />
        <Stat n={st.yellow} l="Žuti" />
        <Stat n={st.cs} l="Clean sheet" />
      </div>

      <RatingsBlock player={player} matches={matches} />


      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 18px 8px', gap: 8 }}>
        <span className="eyebrow">Članarina 2026</span>
        <button className={'pill ' + (exempt ? 'bad' : 'good')} style={{ marginLeft: 'auto', cursor: 'pointer', border: 0 }}
          onClick={() => store.updatePlayer(player.id, { exempt: !exempt })}
          title="Da li igrač plaća članarinu">
          {exempt ? 'Ne plaća' : 'Plaća'}
        </button>
      </div>
      {exempt ? (
        <div className="empty" style={{ margin: '0 18px 18px', padding: 18 }}>Igrač je označen da <b>ne plaća</b> članarinu.</div>
      ) : (
        <div className="months">
          {FEE_MONTHS.slice(0, 6).map(m => {
            const paid = fee[m]
            return (
              <button key={m} className={'mo ' + (paid ? 'paid' : 'due')} onClick={() => store.toggleFee(player.id, m)}>
                <small>{m.toUpperCase()}</small>{paid ? '✓' : '✕'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ n, l }) {
  return <div className="stat"><b className="num">{n}</b><span>{l}</span></div>
}

const fmtScore = s => Number(s).toFixed(1).replace('.', ',')
function RatingsBlock({ player, matches }) {
  const { avg, count, perMatch } = computeRatings(player.id, matches)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 18px 0', gap: 8 }}>
        <span className="eyebrow">Ocene (5–10)</span>
        {avg != null && <span className="rate-badge" style={{ marginLeft: 'auto', background: ratingColor(avg) }}>{fmtScore(avg)}</span>}
        <span className="foot-l" style={avg != null ? {} : { marginLeft: 'auto' }}>{count ? `prosek · ${count} ocena` : 'nema ocena'}</span>
      </div>
      {perMatch.length > 0 && (
        <div style={{ padding: '8px 18px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {perMatch.slice(0, 6).map(r => (
            <div key={r.matchId} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
              <span className="rate-badge" style={{ background: ratingColor(r.score) }}>{fmtScore(r.score)}</span>
              <span style={{ flex: 1 }}>vs {r.opp} <span className="foot-l">{fmtDate(r.date)}</span>{r.note && <span style={{ color: 'var(--grey)' }}> — {r.note}</span>}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function PlayerForm({ title, submitLabel, initial, onClose, onSave }) {
  const [f, setF] = useState({
    name: initial.name || '', number: initial.number ?? '',
    foot: initial.foot || 'desna', pos: initial.pos || '', alt: initial.alt || '', hw: initial.hw || '',
  })
  const [dobText, setDobText] = useState(isoToDisp(initial.dob))
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  function save() {
    onSave({ ...f, dob: dispToIso(dobText), number: f.number === '' ? undefined : Number(f.number) })
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>{title}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="row2" style={{ gridTemplateColumns: '1fr 90px' }}>
            <div className="field"><label>Ime i prezime</label><input className="input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="npr. Marko Marković" autoFocus /></div>
            <div className="field"><label>Broj dresa</label><input className="input" inputMode="numeric" value={f.number} onChange={e => set('number', e.target.value)} placeholder="9" /></div>
          </div>
          <div className="row2">
            <div className="field"><label>Datum rođenja</label><input className="input" value={dobText} onChange={e => setDobText(e.target.value)} placeholder="dd/mm/gggg" inputMode="numeric" /></div>
            <div className="field"><label>Jača noga</label>
              <select className="input" value={f.foot} onChange={e => set('foot', e.target.value)}>
                <option value="desna">desna</option><option value="leva">leva</option><option value="obe">obe</option>
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field"><label>Pozicija</label><input className="input" value={f.pos} onChange={e => set('pos', e.target.value)} placeholder="npr. CM" /></div>
            <div className="field"><label>Alternativna</label><input className="input" value={f.alt} onChange={e => set('alt', e.target.value)} placeholder="npr. DM" /></div>
          </div>
          <div className="field"><label>Visina/težina (opciono)</label><input className="input" value={f.hw} onChange={e => set('hw', e.target.value)} placeholder="npr. 182/74" /></div>
        </div>
        <div className="modal-f">
          <button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!f.name.trim()} onClick={save}>{submitLabel}</button>
        </div>
      </div>
    </div>
  )
}
