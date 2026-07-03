import { useState, useRef } from 'react'
import { useStore, fmtDate, shortName } from '../data/store'
import { Icon, Crest } from '../components/Icons'

const EVENT_TYPES = [
  { type: 'goal', label: 'Gol', ico: '⚽', cls: 'g' },
  { type: 'assist', label: 'Asistencija', ico: '🅰', cls: 'a' },
  { type: 'yellow', label: 'Žuti', ico: 'Y', cls: 'y' },
  { type: 'red', label: 'Crveni', ico: 'R', cls: 'y' },
  { type: 'sub', label: 'Izmena', ico: '🔄', cls: 'sub' },
]

export default function Matches() {
  const store = useStore()
  const { matches, players, team } = store
  const [activeId, setActiveId] = useState(matches[0]?.id)
  const [addEv, setAddEv] = useState(null)  // event type being added
  const fileRef = useRef()

  const m = matches.find(x => x.id === activeId) || matches[0]
  const pName = id => { const p = players.find(x => x.id === id); return p ? shortName(p.name) : '—' }

  function setScore(field, val) {
    const n = val === '' ? null : Math.max(0, parseInt(val) || 0)
    store.updateMatch(m.id, { [field]: n })
  }
  function toggleLineup(pid) {
    const cur = m.lineup || []
    const next = cur.includes(pid) ? cur.filter(x => x !== pid) : (cur.length >= 11 ? cur : [...cur, pid])
    store.updateMatch(m.id, { lineup: next })
  }
  function addEvent(ev) {
    store.updateMatch(m.id, { events: [...(m.events || []), { ...ev, id: 'ev' + Date.now() }] })
    setAddEv(null)
  }
  function removeEvent(id) {
    store.updateMatch(m.id, { events: (m.events || []).filter(e => e.id !== id) })
  }
  function uploadCrest(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader(); r.onload = () => store.updateMatch(m.id, { crest: r.result }); r.readAsDataURL(file)
  }

  const events = [...(m.events || [])].sort((a, b) => (a.minute || 0) - (b.minute || 0))
  const lineup = m.lineup || []

  return (
    <section>
      <div className="mc-tabs">
        {matches.map(x => (
          <button key={x.id} className={'mc-tab' + (x.id === activeId ? ' on' : '')} onClick={() => setActiveId(x.id)}>
            vs {x.opp}<small>{fmtDate(x.date)} · {x.home ? 'dom' : 'gost'}</small>
          </button>
        ))}
      </div>

      <div className="sec-title"><h2>Unos utakmice</h2><span className="eyebrow">{fmtDate(m.date)} · {m.comp} · {m.home ? 'domaćin' : 'gost'}</span></div>

      <div className="mt-score">
        <div className="team"><Crest size={44} /><b>{team.name}</b></div>
        <div className="sc">
          <input className="sc-box num" value={m.gf ?? ''} onChange={e => setScore('gf', e.target.value)}
            inputMode="numeric" style={{ border: 0, textAlign: 'center', color: '#fff' }} placeholder="–" />
          <span style={{ opacity: .6 }}>:</span>
          <input className="sc-box num" value={m.ga ?? ''} onChange={e => setScore('ga', e.target.value)}
            inputMode="numeric" style={{ border: 0, textAlign: 'center', color: '#fff' }} placeholder="–" />
        </div>
        <div className="team">
          <button className="badge-lg" onClick={() => fileRef.current.click()} style={{ cursor: 'pointer', overflow: 'hidden', padding: m.crest ? 0 : undefined }}>
            {m.crest ? <img src={m.crest} alt="grb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'grb +'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadCrest} />
          <b>{m.opp}</b>
        </div>
      </div>

      <div className="pitch-wrap">
        <div className="card">
          <div className="card-h"><h3>Prva postava</h3><span className="pill blue" style={{ marginLeft: 'auto' }}>{lineup.length}/11</span></div>
          <div className="card-b" style={{ maxHeight: 460, overflow: 'auto' }}>
            {players.map(p => {
              const on = lineup.includes(p.id)
              return (
                <label key={p.id} className="li" style={{ cursor: 'pointer', opacity: on ? 1 : .6 }}>
                  <input type="checkbox" checked={on} onChange={() => toggleLineup(p.id)} style={{ accentColor: 'var(--blue-600)' }} />
                  <div className="nm">{p.name}</div>
                  {p.pos && <span className="pos">{p.pos}</span>}
                </label>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Događaji na meču</h3></div>
          <div className="card-b">
            <div className="goal-log">
              {events.length === 0 && <div className="empty">Nema događaja. Dodaj gol, asistenciju, karton ili izmenu ↓</div>}
              {events.map(e => (
                <div className="ge" key={e.id}>
                  <span className="min num">{e.minute ? e.minute + "'" : "—"}</span>
                  <EvIcon type={e.type} />
                  {e.type === 'sub'
                    ? <><b>{pName(e.inId)}</b><span style={{ color: 'var(--grey)' }}>← {pName(e.outId)}</span></>
                    : <><b>{pName(e.playerId)}</b><span style={{ color: 'var(--grey)' }}>{evName(e.type)}</span></>}
                  <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => removeEvent(e.id)}><Icon.trash /></button>
                </div>
              ))}
            </div>
            <div className="evbtns">
              {EVENT_TYPES.map(t => (
                <button key={t.type} className="btn" onClick={() => setAddEv(t.type)}>
                  <EvIcon type={t.type} /> {t.label}
                </button>
              ))}
            </div>
            <p className="mock-note">Golovi, asistencije i kartoni se automatski upisuju u statistiku igrača. Clean sheet ide igračima iz prve postave kad je primljeno 0 golova.</p>
          </div>
        </div>
      </div>

      {addEv && <AddEvent type={addEv} players={players} lineup={lineup}
        onClose={() => setAddEv(null)} onSave={addEvent} />}
    </section>
  )
}

function evName(type) {
  return { goal: 'gol', assist: 'asistencija', yellow: 'žuti karton', red: 'crveni karton' }[type] || ''
}
function EvIcon({ type }) {
  if (type === 'goal') return <span className="ic g">⚽</span>
  if (type === 'assist') return <span className="ic a">🅰</span>
  if (type === 'yellow') return <span className="ic y"><span className="cardico" style={{ background: 'var(--warn)' }} /></span>
  if (type === 'red') return <span className="ic y"><span className="cardico" style={{ background: 'var(--bad)' }} /></span>
  return <span className="ic sub">🔄</span>
}

function AddEvent({ type, players, lineup, onClose, onSave }) {
  const [pid, setPid] = useState('')
  const [inId, setInId] = useState('')
  const [outId, setOutId] = useState('')
  const [minute, setMinute] = useState('')
  const isSub = type === 'sub'
  const title = { goal: 'Gol', assist: 'Asistencija', yellow: 'Žuti karton', red: 'Crveni karton', sub: 'Izmena' }[type]

  const ok = isSub ? (inId && outId) : pid
  function save() {
    if (isSub) onSave({ type, inId, outId, minute: Number(minute) || null })
    else onSave({ type, playerId: pid, minute: Number(minute) || null })
  }
  const onField = players.filter(p => lineup.includes(p.id))
  const offField = players.filter(p => !lineup.includes(p.id))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>{title}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          {isSub ? (
            <div className="row2">
              <div className="field"><label>Ulazi</label>
                <select className="input" value={inId} onChange={e => setInId(e.target.value)}>
                  <option value="">— izaberi —</option>
                  {offField.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div className="field"><label>Izlazi</label>
                <select className="input" value={outId} onChange={e => setOutId(e.target.value)}>
                  <option value="">— izaberi —</option>
                  {onField.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
            </div>
          ) : (
            <div className="field"><label>Igrač</label>
              <select className="input" value={pid} onChange={e => setPid(e.target.value)} autoFocus>
                <option value="">— izaberi —</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
