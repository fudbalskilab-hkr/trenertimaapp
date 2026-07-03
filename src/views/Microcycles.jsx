import { useState } from 'react'
import { useStore, fmtDate } from '../data/store'
import { SECTIONS } from '../data/seed'
import { Icon } from '../components/Icons'

const LABCLASS = ['a', 'b', 'c', 'd', 'e']

export default function Microcycles() {
  const store = useStore()
  const { microcycles } = store
  const [active, setActive] = useState('mc1')
  const [edit, setEdit] = useState(null)   // {si, section, value}
  const [adding, setAdding] = useState(false)

  const mc = microcycles.find(m => m.id === active)

  function saveSection(si, section, value) {
    const sessions = mc.sessions.map((s, i) => i !== si ? s : { ...s, sections: { ...s.sections, [section]: value } })
    store.updateMicrocycle(mc.id, { sessions })
    setEdit(null)
  }
  function addSession(day, part) {
    const sections = Object.fromEntries(SECTIONS.map(s => [s, '']))
    store.updateMicrocycle(mc.id, { sessions: [...mc.sessions, { day, date: '', part, sections }] })
    setAdding(false)
  }

  return (
    <section>
      <div className="mc-tabs">
        {microcycles.map(m => (
          <button key={m.id} className={'mc-tab' + (m.id === active ? ' on' : '') + (m.type === 'Takmičarski' ? ' comp' : '')}
            onClick={() => setActive(m.id)}>
            MC {m.n}<small>{m.type}</small>
          </button>
        ))}
      </div>

      <div className="sec-title">
        <h2>Mikrociklus {mc.n} — {mc.type.toLowerCase()}</h2>
        <span className="eyebrow">prepodne / popodne · 5 segmenata</span>
        <button className="btn primary sm" style={{ marginLeft: 8 }} onClick={() => setAdding(true)}><Icon.plus /> Termin</button>
      </div>

      {mc.sessions.length === 0 ? (
        <div className="card"><div className="empty">Još nema unetih termina za ovaj mikrociklus.<br />Klikni „+ Termin" da dodaš prepodne/popodne.</div></div>
      ) : (
        <div className="tbl-wrap">
          <div className="mc-grid" style={{ gridTemplateColumns: `130px repeat(${mc.sessions.length}, minmax(190px, 1fr))` }}>
            <div className="mc-corner">Segment</div>
            {mc.sessions.map((s, i) => (
              <div className="mc-dayhead" key={i}><b>{s.day || 'Dan'}</b><small>{s.date ? fmtDate(s.date) + ' · ' : ''}{s.part === 'am' ? 'Prepodne' : 'Popodne'}</small></div>
            ))}

            <div className="mc-sesshead">Sadržaj</div>
            {mc.sessions.map((s, si) => (
              <div key={si}>
                {SECTIONS.map((sec, k) => (
                  <button key={sec} className="mc-sect" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}
                    onClick={() => setEdit({ si, section: sec, value: s.sections[sec] || '' })}>
                    <div className={'s-lab ' + LABCLASS[k]}>{k + 1} · {sec}</div>
                    {s.sections[sec] || <span style={{ color: 'var(--grey-2)' }}>—</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mock-note">Skrol levo/desno za ostale termine. Klik na segment da upišeš sadržaj.</p>

      {edit && <EditModal title={SECTIONS[SECTIONS.indexOf(edit.section)]} value={edit.value}
        onClose={() => setEdit(null)} onSave={v => saveSection(edit.si, edit.section, v)} />}
      {adding && <AddSession onClose={() => setAdding(false)} onSave={addSession} />}
    </section>
  )
}

function EditModal({ title, value, onClose, onSave }) {
  const [v, setV] = useState(value)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>{title}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b"><div className="field"><label>Sadržaj</label>
          <textarea className="input" rows={4} value={v} autoFocus onChange={e => setV(e.target.value)} /></div></div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button><button className="btn primary" onClick={() => onSave(v)}>Sačuvaj</button></div>
      </div>
    </div>
  )
}

function AddSession({ onClose, onSave }) {
  const [day, setDay] = useState('Ponedeljak')
  const [part, setPart] = useState('am')
  const DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Novi termin</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="row2">
            <div className="field"><label>Dan</label><select className="input" value={day} onChange={e => setDay(e.target.value)}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div className="field"><label>Deo dana</label><select className="input" value={part} onChange={e => setPart(e.target.value)}><option value="am">Prepodne</option><option value="pm">Popodne</option></select></div>
          </div>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button><button className="btn primary" onClick={() => onSave(day, part)}>Dodaj</button></div>
      </div>
    </div>
  )
}
