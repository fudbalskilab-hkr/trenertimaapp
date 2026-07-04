import { useState, useRef } from 'react'
import { useStore, fmtDate, shortName } from '../data/store'
import { Icon, Crest } from '../components/Icons'
import FormationBoard from '../components/FormationBoard'

const EVENT_TYPES = [
  { type: 'goal', label: 'Gol' },
  { type: 'assist', label: 'Asistencija' },
  { type: 'yellow', label: 'Žuti' },
  { type: 'red', label: 'Crveni' },
  { type: 'sub', label: 'Izmena' },
]

export default function Matches() {
  const store = useStore()
  const { matches, players, team } = store
  const [activeId, setActiveId] = useState(matches[0]?.id)
  const [addEv, setAddEv] = useState(null)
  const crestRef = useRef()

  const m = matches.find(x => x.id === activeId) || matches[0]
  const pName = id => { const p = players.find(x => x.id === id); return p ? shortName(p.name) : '—' }

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
  function uploadCrest(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader(); r.onload = () => store.updateMatch(m.id, { crest: r.result }); r.readAsDataURL(file)
  }

  const events = [...(m.events || [])].sort((a, b) => (a.minute || 0) - (b.minute || 0))
  const lineup = m.lineup || []
  const ourGoals = events.filter(e => e.type === 'goal')

  return (
    <section>
      <div className="mc-tabs">
        {matches.map(x => (
          <button key={x.id} className={'mc-tab' + (x.id === activeId ? ' on' : '')} onClick={() => setActiveId(x.id)}>
            vs {x.opp}<small>{fmtDate(x.date)} · {x.home ? 'dom' : 'gost'}</small>
          </button>
        ))}
      </div>

      {/* Izveštaj / rezultat */}
      <div className="report">
        <div className="report-side">
          <Crest size={54} url={m.home ? team.logo : m.crest} />
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
          <span className="status">{m.gf === null && m.ga === null ? 'Nije odigrano' : 'Završeno'}</span>
          <div className="rm-meta">{fmtDate(m.date)}{m.date?.slice(0, 4)} · {m.time}<br />{m.comp} · {m.home ? 'domaćin' : 'gost'}</div>
        </div>

        <div className="report-side">
          {m.home
            ? (m.crest ? <Crest size={54} url={m.crest} /> : <button className="report-badge" onClick={() => crestRef.current.click()}>grb +</button>)
            : <Crest size={54} url={team.logo} />}
          <input ref={crestRef} type="file" accept="image/*" hidden onChange={uploadCrest} />
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
        <div className="card-b"><FormationBoard match={m} players={players} store={store} /></div>
      </div>

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

      {addEv && <AddEvent type={addEv} players={players} lineup={lineup} onClose={() => setAddEv(null)} onSave={addEvent} />}
    </section>
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
