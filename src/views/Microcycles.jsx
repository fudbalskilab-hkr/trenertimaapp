import { useState } from 'react'
import { useStore } from '../data/store'
import { SECTIONS } from '../data/seed'
import { Icon } from '../components/Icons'

const DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']
const DAYS_SHORT = ['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED']
const PARTS = [['am', 'Prepodne'], ['pm', 'Popodne']]

export default function Microcycles() {
  const store = useStore()
  const { microcycles } = store
  const [active, setActive] = useState('mc1')
  const [edit, setEdit] = useState(null)   // {day, part, section, value}

  const mc = microcycles.find(m => m.id === active)
  const prep = microcycles.filter(m => m.type !== 'Takmičarski')
  const comp = microcycles.filter(m => m.type === 'Takmičarski')

  const getSession = (day, part) => mc.sessions.find(s => s.day === day && s.part === part)
  function saveSection(day, part, section, value) {
    const idx = mc.sessions.findIndex(s => s.day === day && s.part === part)
    let sessions
    if (idx === -1) sessions = [...mc.sessions, { day, part, sections: { [section]: value } }]
    else sessions = mc.sessions.map((s, i) => i !== idx ? s : { ...s, sections: { ...s.sections, [section]: value } })
    store.updateMicrocycle(mc.id, { sessions })
    setEdit(null)
  }

  const isComp = mc.type === 'Takmičarski'

  return (
    <section>
      <div className="mc-tabs">
        <span className="mc-period-lab">Pripremni</span>
        {prep.map(m => (
          <button key={m.id} className={'mc-tab' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>
            MC {m.n}<small>{m.type}</small>
          </button>
        ))}
        <span className="mc-sep" />
        <span className="mc-period-lab" style={{ color: '#B23B3B' }}>Takmičarski</span>
        {comp.map(m => (
          <button key={m.id} className={'mc-tab comp' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>
            MC {m.n}<small>{m.type}</small>
          </button>
        ))}
      </div>

      <div className="sec-title">
        <h2>Mikrociklus {mc.n} — {mc.type.toLowerCase()}</h2>
        <span className="pill" style={{ marginLeft: 8, background: isComp ? 'var(--bad-bg)' : 'var(--blue-100)', color: isComp ? '#B23B3B' : 'var(--blue-600)' }}>
          {isComp ? 'Takmičarski period — drugačiji princip rada' : 'Pripremni period'}
        </span>
      </div>

      <div className="tbl-wrap">
        <div className={'mc-board' + (isComp ? ' comp-theme' : '')}>
          {DAYS.map((day, i) => (
            <div className="mc-day" key={day}>
              <div className="mc-day-h">{DAYS_SHORT[i]}</div>
              {PARTS.map(([part, plabel]) => {
                const sess = getSession(day, part)
                return (
                  <div className="mc-part" key={part}>
                    <div className="mc-part-h">{plabel}</div>
                    {SECTIONS.map((sec, k) => {
                      const val = sess?.sections?.[sec] || ''
                      return (
                        <button className="mc-seg" key={sec} onClick={() => setEdit({ day, part, section: sec, value: val, plabel })}>
                          <div className="sg-lab">{k + 1} · {sec}</div>
                          <div className={'sg-val' + (val ? '' : ' empty2')}>{val || '—'}</div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mock-note">Cela nedelja u jednom prikazu. Klik na segment da upišeš sadržaj (za prepodne i popodne, svih 7 dana). Skrol levo/desno na užem ekranu.</p>

      {edit && <EditModal title={`${edit.day} · ${edit.plabel} · ${edit.section}`} value={edit.value}
        onClose={() => setEdit(null)} onSave={v => saveSection(edit.day, edit.part, edit.section, v)} />}
    </section>
  )
}

function EditModal({ title, value, onClose, onSave }) {
  const [v, setV] = useState(value)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3 style={{ fontSize: 14 }}>{title}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b"><div className="field"><label>Sadržaj</label>
          <textarea className="input" rows={4} value={v} autoFocus onChange={e => setV(e.target.value)} placeholder="npr. Rondo 5v2, 2 serije" /></div></div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button><button className="btn primary" onClick={() => onSave(v)}>Sačuvaj</button></div>
      </div>
    </div>
  )
}
