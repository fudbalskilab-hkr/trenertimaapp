import { useState, useRef } from 'react'
import { useStore, fmtDate } from '../data/store'
import { INTENSITY, intensityColor } from '../data/seed'
import { Icon, Crest } from '../components/Icons'
import { exportNodeAsImage } from '../utils/exportImage'

const MONTHS_SR = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']
const CYCLE = [null, 'match', '80', '50', '30', 'regen', 'free']
const tint = k => { const c = intensityColor(k); return c === 'transparent' ? 'var(--surface)' : `color-mix(in srgb, ${c} 32%, var(--surface))` }

function mondayOf(d) { const x = new Date(d); const dw = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dw); return x.toISOString().slice(0, 10) }
function addDays(iso, n) { const x = new Date(iso); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
function weekLabel(w, i) {
  const s = new Date(w.start), e = new Date(w.start); e.setDate(e.getDate() + 6)
  const mm = s.getMonth() === e.getMonth() ? MONTHS_SR[e.getMonth()] : `${MONTHS_SR[s.getMonth()]}/${MONTHS_SR[e.getMonth()]}`
  return `Nedelja ${i + 1} · ${s.getDate()}. – ${e.getDate()}. ${mm} ${e.getFullYear()}`
}

export default function Calendar({ openMatch }) {
  const store = useStore()
  const { calendar, matches } = store
  const [edit, setEdit] = useState(null)
  const [popup, setPopup] = useState(null)      // utakmica za popup
  const [newMatch, setNewMatch] = useState(null) // {date}
  const drag = useRef(null)
  const areaRef = useRef()

  // mapiraj utakmice po datumu (auto prikaz u kalendaru)
  const byDate = {}
  matches.forEach(m => { if (m.date) byDate[m.date] = m })

  const firstStart = calendar[0]?.start
  const lastStart = calendar[calendar.length - 1]?.start
  const today = new Date().toISOString().slice(0, 10)

  return (
    <section>
      <div className="sec-title"><h2>Kalendar aktivnosti</h2><span className="eyebrow">jedan red = nedelja</span>
        <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => exportNodeAsImage(areaRef.current, 'kalendar-aktivnosti.png')}><Icon.download /> Izvoz kao slika</button>
      </div>

      <div className="int-legend">
        {INTENSITY.map(i => (<span className="li2" key={i.key}><span className="sw" style={{ background: i.color }} />{i.label}</span>))}
      </div>
      <p className="mock-note" style={{ margin: '-6px 0 12px' }}>Utakmice se same pojave po datumu (napraviš ih u „Utakmice" ili klikom na dan → „Dodaj utakmicu"). Klik na kvadratić = intenzitet. Prevuci zaglavlje dana da zameniš termine.</p>

      <div className="week-add">
        <button className="btn sm" onClick={() => store.addCalendarWeek(firstStart ? addDays(firstStart, -7) : mondayOf(today))}><Icon.plus /> Nedelja pre</button>
        <button className="btn sm" onClick={() => store.addCalendarWeek(lastStart ? addDays(lastStart, 7) : mondayOf(today))}><Icon.plus /> Nedelja posle</button>
      </div>

      <div ref={areaRef} className="export-area">
      {calendar.length === 0 && (
        <div className="card"><div className="empty" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <span>Kalendar je prazan.</span>
          <button className="btn primary" onClick={() => store.addCalendarWeek(mondayOf(today))}><Icon.plus /> Napravi prvu nedelju</button>
        </div></div>
      )}

      {calendar.map((w, wi) => (
        <div className="cal-week" key={w.start}>
          <div className="wk-lab">{weekLabel(w, wi)}
            <button className="btn ghost sm wk-del" title="Ukloni nedelju"
              onClick={() => { if (confirm('Ukloniti ovu nedelju iz kalendara?')) store.removeCalendarWeek(w.start) }}><Icon.trash /></button>
          </div>
          <div className="days">
            {w.days.map((d, di) => {
              const match = byDate[d.date] || (d.matchId ? matches.find(m => m.id === d.matchId) : null)
              return (
                <div className={'day' + (match ? ' match' : '')} key={di} style={{ background: tint(match ? 'match' : d.intensity) }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (drag.current) { store.swapCalendarDays(drag.current, { wi, di }); drag.current = null } }}>
                  <div className="int-stripe" style={{ background: intensityColor(match ? 'match' : d.intensity) }} />
                  <div className="day-h" draggable onDragStart={() => { drag.current = { wi, di } }} title="Prevuci da zameniš dan" style={{ cursor: 'grab' }}>
                    <b>{d.day.toUpperCase()}</b>
                    <span className="dt">{fmtDate(d.date)}</span>
                    {!match && (
                      <button className="int-swatch" style={{ background: intensityColor(d.intensity) || 'rgba(255,255,255,.15)' }}
                        title={'Intenzitet: ' + (INTENSITY.find(x => x.key === d.intensity)?.label || 'nije označen')}
                        onClick={() => { const cur = CYCLE.indexOf(d.intensity); store.setDayIntensity(wi, di, CYCLE[(cur + 1) % CYCLE.length]) }} />
                    )}
                  </div>
                  {match ? (
                    <button className="match-cell" style={{ border: 0, background: 'transparent', cursor: 'pointer', width: '100%' }} onClick={() => setPopup(match)}>
                      <div className="match-crest">{match.crest ? <img src={match.crest} alt="grb" /> : <span>grb</span>}</div>
                      <b>{match.opp}</b>
                      {match.played
                        ? <small><b className="num" style={{ fontSize: 14 }}>{match.gf ?? '–'}:{match.ga ?? '–'}</b></small>
                        : <small>{match.home ? 'domaćin' : 'gost'} · {match.time}</small>}
                    </button>
                  ) : (
                    <>
                      <Slot label="Prepodne" value={d.am} onClick={() => setEdit({ wi, di, part: 'am', value: d.am, day: d.day })} />
                      <Slot label="Popodne" value={d.pm} onClick={() => setEdit({ wi, di, part: 'pm', value: d.pm, day: d.day })} />
                      <button className="add-match-mini" onClick={() => setNewMatch({ date: d.date })} title="Dodaj utakmicu na ovaj dan">+ utakmica</button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      </div>

      {edit && <EditSlot data={edit} onClose={() => setEdit(null)}
        onSave={(v) => { store.setCalendarCell(edit.wi, edit.di, edit.part, v.trim() || '/'); setEdit(null) }} />}
      {popup && <MatchPopup m={popup} onClose={() => setPopup(null)} onOpen={() => { setPopup(null); openMatch && openMatch(popup.id) }} />}
      {newMatch && <NewMatch date={newMatch.date} store={store} onClose={() => setNewMatch(null)}
        onCreated={id => { setNewMatch(null); openMatch && openMatch(id) }} />}
    </section>
  )
}

function Slot({ label, value, onClick }) {
  const lines = value && value !== '/' ? value.split('\n').filter(Boolean) : null
  return (
    <button className="slot" onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer' }}>
      <div className="sl-lab">{label}</div>
      {lines ? <ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul> : <span className="free-mark">/</span>}
    </button>
  )
}

function MatchPopup({ m, onClose, onOpen }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-h"><h3>{m.played ? 'Odigrana utakmica' : 'Zakazana utakmica'}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
            <Crest size={44} />
            {m.played ? <div className="num" style={{ fontSize: 26, fontWeight: 800 }}>{m.gf ?? '–'}:{m.ga ?? '–'}</div> : <span style={{ fontWeight: 800, color: 'var(--grey)' }}>VS</span>}
            {m.crest ? <Crest size={44} url={m.crest} /> : <div className="badge-lg" style={{ width: 44, height: 44 }}>grb</div>}
          </div>
          <div style={{ fontWeight: 700 }}>{m.home ? 'Brodarac' : m.opp} — {m.home ? m.opp : 'Brodarac'}</div>
          <div className="foot-l" style={{ marginTop: 4 }}>{fmtDate(m.date)}{m.date?.slice(0, 4)} · {m.time} · {m.home ? 'domaćin' : 'gost'}</div>
          <div className="foot-l">{m.comp}</div>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Zatvori</button>
          <button className="btn primary" onClick={onOpen}>Otvori utakmicu →</button></div>
      </div>
    </div>
  )
}

function NewMatch({ date, store, onClose, onCreated }) {
  const [f, setF] = useState({ opp: '', time: '17:00', home: true, kind: 'friendly', comp: 'Prijateljska' })
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  function create() {
    const id = store.addMatch()
    store.updateMatch(id, { ...f, date })
    onCreated(id)
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Nova utakmica · {fmtDate(date)}{date?.slice(0, 4)}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Protivnik</label><input className="input" value={f.opp} autoFocus onChange={e => set('opp', e.target.value)} placeholder="npr. Partizan" /></div>
          <div className="row2">
            <div className="field"><label>Vreme</label><input className="input" value={f.time} onChange={e => set('time', e.target.value)} placeholder="17:00" /></div>
            <div className="field"><label>Mesto</label><select className="input" value={f.home ? '1' : '0'} onChange={e => set('home', e.target.value === '1')}><option value="1">Domaćin</option><option value="0">Gost</option></select></div>
          </div>
          <div className="row2">
            <div className="field"><label>Tip</label><select className="input" value={f.kind}
              onChange={e => { const k = e.target.value; setF(s => ({ ...s, kind: k, comp: k === 'league' ? 'Omladinska liga' : 'Prijateljska' })) }}>
              <option value="friendly">Prijateljska</option><option value="league">Prvenstvena</option></select></div>
            <div className="field"><label>Takmičenje</label><input className="input" value={f.comp} onChange={e => set('comp', e.target.value)} /></div>
          </div>
          <p className="mock-note">Grb protivnika dodaješ posle (klik na utakmicu). Pojaviće se automatski na ovom danu.</p>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!f.opp.trim()} onClick={create}>Napravi i otvori</button></div>
      </div>
    </div>
  )
}

function EditSlot({ data, onClose, onSave }) {
  const [v, setV] = useState(data.value === '/' ? '' : data.value)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>{data.day} · {data.part === 'am' ? 'Prepodne' : 'Popodne'}</h3>
          <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field">
            <label>Aktivnosti (svaka u novom redu)</label>
            <textarea className="input" rows={5} value={v} autoFocus onChange={e => setV(e.target.value)}
              placeholder={'npr.\nSnaga — donji ekst.\nPassing drill\nBuild-up + press'} />
          </div>
          <p className="mock-note">Ostavi prazno za slobodan termin (/).</p>
        </div>
        <div className="modal-f">
          <button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" onClick={() => onSave(v)}>Sačuvaj</button>
        </div>
      </div>
    </div>
  )
}
