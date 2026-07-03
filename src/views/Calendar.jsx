import { useState, useRef } from 'react'
import { useStore, fmtDate } from '../data/store'
import { Icon } from '../components/Icons'

const MONTHS_SR = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

function weekLabel(w, i) {
  const s = new Date(w.start)
  const e = new Date(w.start); e.setDate(e.getDate() + 6)
  return `Nedelja ${i + 1} · ${s.getDate()}. – ${e.getDate()}. ${MONTHS_SR[e.getMonth()]}`
}

export default function Calendar() {
  const store = useStore()
  const { calendar, matches } = store
  const [edit, setEdit] = useState(null) // {wi,di,part,value,day}

  return (
    <section>
      <div className="sec-title"><h2>Plan pripremnog perioda</h2><span className="eyebrow">06.07 – 16.08 · jedan red = nedelja</span></div>

      {calendar.map((w, wi) => (
        <div className="cal-week" key={w.start}>
          <div className="wk-lab">{weekLabel(w, wi)}</div>
          <div className="days">
            {w.days.map((d, di) => {
              const match = d.matchId ? matches.find(m => m.id === d.matchId) : null
              return (
                <div className={'day' + (match ? ' match' : '') + (!match && d.am === '/' && d.pm === '/' ? ' free' : '')} key={di}>
                  <div className="day-h"><b>{d.day.toUpperCase()}</b><span>{fmtDate(d.date)}</span></div>
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
      <p className="mock-note">Klik na termin (Prepodne / Popodne) da upišeš aktivnost. Slobodan termin = „/". Kod utakmice klikni „grb +" da dodaš grb protivnika.</p>

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
    const r = new FileReader()
    r.onload = () => store.updateMatch(match.id, { crest: r.result })
    r.readAsDataURL(file)
  }
  return (
    <div className="match-cell">
      <button className="badge-sm" onClick={() => fileRef.current.click()} title="Dodaj grb protivnika"
        style={{ cursor: 'pointer', padding: match.crest ? 0 : 3, overflow: 'hidden' }}>
        {match.crest ? <img src={match.crest} alt="grb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>grb +</span>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      <b>vs {match.opp}</b>
      <small>{match.time} · {match.home ? 'dom' : 'gost'}</small>
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
