import { useState, useRef, useEffect } from 'react'
import { useStore, fmtDate, shortName } from '../data/store'
import { Icon, Crest } from '../components/Icons'
import FormationBoard from '../components/FormationBoard'
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
      <div className="mc-tabs">
        {matches.map(x => (
          <button key={x.id} className={'mc-tab' + (x.id === activeId ? ' on' : '') + (x.kind === 'league' ? ' comp' : '')} onClick={() => setActiveId(x.id)}>
            {needsFilling(x) && <span className="match-flag" title="Treba popuniti">!</span>}
            vs {x.opp}<small>{x.date ? fmtDate(x.date) + ' · ' : ''}{x.home ? 'dom' : 'gost'}</small>
          </button>
        ))}
        <button className="btn primary sm" onClick={() => setActiveId(store.addMatch())}><Icon.plus /> Nova utakmica</button>
      </div>
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
          <div className="rm-meta">{fmtDate(m.date)}{m.date?.slice(0, 4)} · {m.time}<br />{m.comp} · {m.home ? 'domaćin' : 'gost'}</div>
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
        <div className="card-b"><FormationBoard match={m} players={players} store={store} /></div>
      </div>

      {/* Minutaža i učinak */}
      <MinutesCard m={m} players={players} store={store} />


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

      {/* Ocene igrača (5–10) + beleške */}
      <RatingsCard m={m} players={players} store={store} />

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

const RATING_COLORS = { 5: '#D64545', 6: '#E8862B', 7: '#E4B62B', 8: '#7FB83E', 9: '#2FA36B', 10: '#1E9E6A' }
function RatingsCard({ m, players, store }) {
  const lineup = m.lineup || []
  const events = m.events || []
  const minutes = m.minutes || {}
  const ratings = m.ratings || {}
  const involved = players.filter(p =>
    lineup.includes(p.id) || events.some(e => (e.type === 'sub' && e.inId === p.id) || e.playerId === p.id) || minutes[p.id] != null || ratings[p.id])

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-h"><h3>Ocene igrača</h3><span className="pill blue" style={{ marginLeft: 'auto' }}>skala 5–10 (5 najgore)</span></div>
      <div className="card-b">
        {involved.length === 0 ? <div className="empty">Postavi prvu postavu pa oceni igrače.</div> : (
          <div className="ratings">
            {involved.map(p => {
              const r = ratings[p.id] || {}
              return (
                <div className="rate-row" key={p.id}>
                  <div className="rate-name">{shortName(p.name)} {p.pos && <span className="pos">{p.pos}</span>}</div>
                  <div className="rate-scale">
                    {[5, 6, 7, 8, 9, 10].map(n => (
                      <button key={n} className={'rate-dot' + (Number(r.score) === n ? ' on' : '')}
                        style={Number(r.score) === n ? { background: RATING_COLORS[n], borderColor: RATING_COLORS[n], color: '#fff' } : undefined}
                        onClick={() => store.setMatchRating(m.id, p.id, { score: Number(r.score) === n ? undefined : n })}>{n}</button>
                    ))}
                  </div>
                  <input className="input rate-note" defaultValue={r.note || ''} placeholder="beleška o igraču…"
                    onBlur={e => store.setMatchRating(m.id, p.id, { note: e.target.value })} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MinutesCard({ m, players, store }) {
  const lineup = m.lineup || []
  const events = m.events || []
  const minutes = m.minutes || {}
  // igrači koji su učestvovali: postava + ušli kao izmena + oni sa unetim minutima
  const involved = players.filter(p =>
    lineup.includes(p.id) ||
    events.some(e => (e.type === 'sub' && e.inId === p.id) || e.playerId === p.id) ||
    minutes[p.id] != null)
  const cnt = (pid, type) => events.filter(e => e.playerId === pid && e.type === type).length
  const setMin = (pid, v) => store.updateMatch(m.id, { minutes: { ...minutes, [pid]: v === '' ? undefined : Math.max(0, Math.min(120, parseInt(v) || 0)) } })
  const fill90 = () => { const nm = { ...minutes }; lineup.forEach(pid => { if (nm[pid] == null) nm[pid] = 90 }); store.updateMatch(m.id, { minutes: nm }) }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-h"><h3>Minutaža i učinak</h3>
        <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={fill90}>Postavi 90′ startnima</button></div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Igrač</th><th>Minuti</th><th>⚽</th><th>🅰</th><th>🟨</th><th>🟥</th></tr></thead>
          <tbody>
            {involved.length === 0 && <tr><td colSpan={6} style={{ cursor: 'default' }}><div className="empty" style={{ padding: 18 }}>Postavi prvu postavu (gore) pa se igrači pojave ovde.</div></td></tr>}
            {involved.map(p => (
              <tr key={p.id} style={{ cursor: 'default' }}>
                <td><b>{p.name}</b> {p.pos && <span className="pos">{p.pos}</span>}</td>
                <td><input className="input" style={{ width: 74, padding: '5px 8px' }} inputMode="numeric"
                  value={minutes[p.id] ?? ''} onChange={e => setMin(p.id, e.target.value)} placeholder="—" /></td>
                <td className="num">{cnt(p.id, 'goal') || ''}</td>
                <td className="num">{cnt(p.id, 'assist') || ''}</td>
                <td className="num">{cnt(p.id, 'yellow') || ''}</td>
                <td className="num">{cnt(p.id, 'red') || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-b" style={{ paddingTop: 12 }}><p className="mock-note" style={{ margin: 0 }}>Minute upisuješ ručno (ili „Postavi 90′"). Golovi/asist./kartoni dolaze iz „Tok meča" i sabiraju se u statistiku igrača.</p></div>
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
