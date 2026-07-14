import { useState, useRef } from 'react'
import { useStore, fmtDate } from '../data/store'
import { INTENSITY, intensityColor } from '../data/seed'
import { Icon, Crest } from '../components/Icons'
import { exportNodeAsImage } from '../utils/exportImage'
import { mcDayOverview } from '../utils/mcOverview'

const MONTHS_SR = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']
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
  const { calendar, matches, microcycles } = store
  const [edit, setEdit] = useState(null)
  const [popup, setPopup] = useState(null)      // utakmica za popup
  const [newMatch, setNewMatch] = useState(null) // {date}
  const [dayOpt, setDayOpt] = useState(null)     // {wi, di} — opcije dana
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
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => setNewMatch({ date: firstStart || today })}><Icon.match /> Dodaj utakmicu</button>
      </div>

      <div ref={areaRef} className="export-area">
      {calendar.length === 0 && (
        <div className="card"><div className="empty" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <span>Kalendar je prazan.</span>
          <button className="btn primary" onClick={() => store.addCalendarWeek(mondayOf(today))}><Icon.plus /> Napravi prvu nedelju</button>
        </div></div>
      )}

      {calendar.map((w, wi) => {
        const linkedMc = w.mcId ? microcycles.find(m => m.id === w.mcId) : null
        return (
        <div className={'cal-week' + (linkedMc ? ' mc-linked' : '')} key={w.start}>
          <div className="wk-lab">{weekLabel(w, wi)}
            {linkedMc && (
              <span className="mc-link-badge" title="Nedelja je vezana za mikrociklus — prikaz je sažetak, uređuješ u Mikrociklusima">
                <Icon.mc /> MC {linkedMc.n} · pregled
                <button className="mc-link-off" title="Isključi (vrati na uređivanje u kalendaru)"
                  onClick={() => store.unlinkMcFromWeek(w.start)}>isključi</button>
              </span>
            )}
            <button className="btn ghost sm wk-del" title="Ukloni nedelju"
              onClick={() => { if (confirm('Ukloniti ovu nedelju iz kalendara?')) store.removeCalendarWeek(w.start) }}><Icon.trash /></button>
          </div>
          <div className="days">
            {w.days.map((d, di) => {
              const match = byDate[d.date] || (d.matchId ? matches.find(m => m.id === d.matchId) : null)
              const mcOv = linkedMc && !match ? mcDayOverview(linkedMc, di) : null
              const dayInt = match ? 'match' : (mcOv ? mcOv.intensity : d.intensity)
              const isToday = d.date === today
              const isOff = !match && dayInt === 'free'
              return (
                <div className={'day' + (match ? ' match' : '') + (isToday ? ' today' : '') + (isOff ? ' off' : '')} key={di} style={{ background: tint(dayInt) }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (drag.current && !linkedMc) { store.swapCalendarDays(drag.current, { wi, di }); drag.current = null } }}>
                  {isToday && <span className="today-flag">DANAS</span>}
                  <div className="int-stripe" style={{ background: intensityColor(dayInt) }} />
                  <div className={'day-h' + (!linkedMc && !match ? ' clickable' : '')} draggable={!linkedMc}
                    onDragStart={() => { if (!linkedMc) drag.current = { wi, di } }}
                    onClick={() => { if (!linkedMc && !match) setDayOpt({ wi, di }) }}
                    title={linkedMc || match ? '' : 'Klikni za opcije dana — intenzitet / OFF / utakmica'}
                    style={{ cursor: linkedMc || match ? 'default' : 'pointer' }}>
                    <b>{d.day.toUpperCase()}</b>
                    <span className="dt">{fmtDate(d.date)}</span>
                    {!match && !mcOv && <span className="int-swatch" style={{ background: intensityColor(d.intensity) || 'rgba(255,255,255,.15)' }} />}
                    {!match && !mcOv && <Icon.gear />}
                  </div>
                  {match ? (
                    <button className="match-cell" style={{ border: 0, background: 'transparent', cursor: 'pointer', width: '100%' }} onClick={() => setPopup(match)}>
                      <div className="match-crest">{match.crest ? <img src={match.crest} alt="grb" /> : <span>grb</span>}</div>
                      <b>{match.opp}</b>
                      {match.played
                        ? <small><b className="num" style={{ fontSize: 14 }}>{match.gf ?? '–'}:{match.ga ?? '–'}</b></small>
                        : <small>{match.home ? 'domaćin' : 'gost'} · {match.time}</small>}
                    </button>
                  ) : isOff ? (
                    <div className="off-cell" onClick={linkedMc ? undefined : () => setDayOpt({ wi, di })}
                      style={{ cursor: linkedMc ? 'default' : 'pointer' }} title={linkedMc ? '' : 'Klikni za opcije dana'}>
                      <span className="off-ico"><Icon.moon /></span>
                      <b>SLOBODNO</b>
                      <small>OFF · odmor</small>
                    </div>
                  ) : mcOv ? (
                    mcOv.slots.map((sl, k) => (
                      <div className="slot mc-slot" key={k}>
                        <div className="sl-lab">{sl.label}{sl.time ? ' · ' + sl.time : ''}</div>
                        {sl.text ? <div className="mc-slot-txt">{sl.text}</div> : <span className="free-mark">/</span>}
                      </div>
                    ))
                  ) : (
                    <>
                      <Slot label="Prepodne" value={d.am} onClick={() => setEdit({ wi, di, part: 'am', value: d.am, day: d.day })} />
                      <Slot label="Popodne" value={d.pm} onClick={() => setEdit({ wi, di, part: 'pm', value: d.pm, day: d.day })} />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        )
      })}
      </div>

      {edit && <EditSlot data={edit} onClose={() => setEdit(null)}
        onSave={(v) => { store.setCalendarCell(edit.wi, edit.di, edit.part, v.trim() || '/'); setEdit(null) }} />}
      {popup && <MatchPopup m={popup} onClose={() => setPopup(null)} onOpen={() => { setPopup(null); openMatch && openMatch(popup.id) }} />}
      {newMatch && <NewMatch date={newMatch.date} store={store} onClose={() => setNewMatch(null)}
        onCreated={id => { setNewMatch(null); openMatch && openMatch(id) }} />}
      {dayOpt && (() => {
        const d = calendar[dayOpt.wi]?.days[dayOpt.di]; if (!d) return null
        const exMatch = byDate[d.date] || (d.matchId ? matches.find(m => m.id === d.matchId) : null)
        return <DayOptions d={d} existingMatch={exMatch} onClose={() => setDayOpt(null)}
          onIntensity={k => store.setDayIntensity(dayOpt.wi, dayOpt.di, k)}
          onAddMatch={() => { const dt = d.date; setDayOpt(null); setNewMatch({ date: dt }) }}
          onOpenMatch={m => { setDayOpt(null); openMatch && openMatch(m.id) }} />
      })()}
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
  const [f, setF] = useState({ opp: '', date: date || '', time: '17:00', home: true, kind: 'friendly', comp: 'Prijateljska' })
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  function create() {
    const id = store.addMatch()
    store.updateMatch(id, { ...f })
    onCreated(id)
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Nova utakmica</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Protivnik</label><input className="input" value={f.opp} autoFocus onChange={e => set('opp', e.target.value)} placeholder="npr. Partizan" /></div>
          <div className="row2">
            <div className="field"><label>Datum</label><input className="input" type="date" value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="field"><label>Vreme</label><input className="input" value={f.time} onChange={e => set('time', e.target.value)} placeholder="17:00" /></div>
          </div>
          <div className="row2">
            <div className="field"><label>Mesto</label><select className="input" value={f.home ? '1' : '0'} onChange={e => set('home', e.target.value === '1')}><option value="1">Domaćin</option><option value="0">Gost</option></select></div>
            <div className="field"><label>Tip</label><select className="input" value={f.kind}
              onChange={e => { const k = e.target.value; setF(s => ({ ...s, kind: k, comp: k === 'league' ? 'Omladinska liga' : 'Prijateljska' })) }}>
              <option value="friendly">Prijateljska</option><option value="league">Prvenstvena</option></select></div>
          </div>
          <div className="field"><label>Takmičenje</label><input className="input" value={f.comp} onChange={e => set('comp', e.target.value)} /></div>
          <p className="mock-note">Grb protivnika dodaješ posle (klik na utakmicu). Pojaviće se automatski u kalendaru na tom datumu.</p>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!f.opp.trim()} onClick={create}>Napravi i otvori</button></div>
      </div>
    </div>
  )
}

function DayOptions({ d, existingMatch, onClose, onIntensity, onAddMatch, onOpenMatch }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-h"><h3>{d.day} · {fmtDate(d.date)}</h3>
          <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Intenzitet / tip dana</label>
            <div className="int-choose">
              <button className={'int-opt' + (!d.intensity ? ' on' : '')} onClick={() => onIntensity(null)}>
                <span className="sw" style={{ background: 'rgba(128,128,128,.3)' }} />Bez oznake</button>
              {INTENSITY.map(i => (
                <button key={i.key} className={'int-opt' + (d.intensity === i.key ? ' on' : '')} onClick={() => onIntensity(i.key)}>
                  <span className="sw" style={{ background: i.color }} />{i.label}{i.key === 'free' ? ' (OFF)' : ''}</button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}><label>Utakmica</label>
            {existingMatch
              ? <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onOpenMatch(existingMatch)}><Icon.match /> Otvori utakmicu ({existingMatch.opp || 'protivnik'})</button>
              : <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onAddMatch}><Icon.match /> Dodaj utakmicu na ovaj dan</button>}
          </div>
        </div>
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
