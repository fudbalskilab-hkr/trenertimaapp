import { useState, useRef } from 'react'
import { useStore, fmtDate } from '../data/store'
import { INTENSITY, intensityColor } from '../data/seed'
import { Icon } from '../components/Icons'
import { shrinkImage } from '../utils/img'

const MONTHS_SR = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']
const CYCLE = [null, 'match', '80', '50', '30', 'regen', 'free']
const tint = k => { const c = intensityColor(k); return c === 'transparent' ? 'var(--surface)' : `color-mix(in srgb, ${c} 32%, var(--surface))` }

function weekLabel(w, i) {
  const s = new Date(w.start)
  const e = new Date(w.start); e.setDate(e.getDate() + 6)
  const mm = s.getMonth() === e.getMonth() ? MONTHS_SR[e.getMonth()] : `${MONTHS_SR[s.getMonth()]}/${MONTHS_SR[e.getMonth()]}`
  return `Nedelja ${i + 1} · ${s.getDate()}. – ${e.getDate()}. ${mm}`
}

export default function Calendar() {
  const store = useStore()
  const { calendar, matches } = store
  const [edit, setEdit] = useState(null)
  const drag = useRef(null)

  return (
    <section>
      <div className="sec-title"><h2>Plan pripremnog perioda</h2><span className="eyebrow">06.07 – 16.08 · jedan red = nedelja</span></div>

      <div className="int-legend">
        {INTENSITY.map(i => (
          <span className="li2" key={i.key}><span className="sw" style={{ background: i.color }} />{i.label}</span>
        ))}
      </div>
      <p className="mock-note" style={{ margin: '-6px 0 14px' }}>Klik na kvadratić u danu = intenzitet (cela ćelija se oboji). Prevuci zaglavlje dana na drugi dan da zameniš termine (npr. kad se pomeri utakmica).</p>

      {calendar.map((w, wi) => (
        <div className="cal-week" key={w.start}>
          <div className="wk-lab">{weekLabel(w, wi)}</div>
          <div className="days">
            {w.days.map((d, di) => {
              const match = d.matchId ? matches.find(m => m.id === d.matchId) : null
              return (
                <div className={'day' + (match ? ' match' : '')} key={di} style={{ background: tint(match ? 'match' : d.intensity) }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (drag.current) { store.swapCalendarDays(drag.current, { wi, di }); drag.current = null } }}>
                  <div className="int-stripe" style={{ background: intensityColor(match ? 'match' : d.intensity) }} />
                  <div className="day-h" draggable
                    onDragStart={() => { drag.current = { wi, di } }}
                    title="Prevuci da zameniš dan" style={{ cursor: 'grab' }}>
                    <b>{d.day.toUpperCase()}</b>
                    <span className="dt">{fmtDate(d.date)}</span>
                    {!match && (
                      <button className="int-swatch" style={{ background: intensityColor(d.intensity) || 'rgba(255,255,255,.15)' }}
                        title={'Intenzitet: ' + (INTENSITY.find(x => x.key === d.intensity)?.label || 'nije označen')}
                        onClick={() => { const cur = CYCLE.indexOf(d.intensity); store.setDayIntensity(wi, di, CYCLE[(cur + 1) % CYCLE.length]) }} />
                    )}
                  </div>
                  {match ? (
                    <MatchCell match={match} store={store} />
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
      ))}

      {edit && <EditSlot data={edit} onClose={() => setEdit(null)}
        onSave={(v) => { store.setCalendarCell(edit.wi, edit.di, edit.part, v.trim() || '/'); setEdit(null) }} />}
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

function MatchCell({ match, store }) {
  const fileRef = useRef()
  function upload(e) {
    const file = e.target.files[0]; if (!file) return
    shrinkImage(file, 256, true).then(url => store.updateMatch(match.id, { crest: url }))
  }
  return (
    <div className="match-cell">
      <button className="match-crest" onClick={() => fileRef.current.click()} title="Dodaj grb protivnika">
        {match.crest ? <img src={match.crest} alt="grb" /> : <span>grb +</span>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      <b>{match.opp}</b>
      <small>{match.home ? 'domaćin' : 'gost'} · {match.time}</small>
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
            <textarea className="input" rows={5} value={v} autoFocus
              onChange={e => setV(e.target.value)}
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
