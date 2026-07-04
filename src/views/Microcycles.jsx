import { useState } from 'react'
import { useStore } from '../data/store'
import { SECTIONS, INTENSITY, intensityColor } from '../data/seed'
import { Icon } from '../components/Icons'

const DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']
const DAYS_SHORT = ['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED']
const CYCLE = [null, 'match', '80', '50', '30', 'regen', 'free']
const tint = k => { const c = intensityColor(k); return c === 'transparent' ? 'var(--surface-2)' : `color-mix(in srgb, ${c} 18%, var(--surface))` }

export default function Microcycles() {
  const store = useStore()
  const { microcycles } = store
  const [active, setActive] = useState(microcycles[0]?.id)
  const [edit, setEdit] = useState(null)

  const mc = microcycles.find(m => m.id === active) || microcycles[0]
  const prep = microcycles.filter(m => m.type !== 'Takmičarski')
  const comp = microcycles.filter(m => m.type === 'Takmičarski')

  if (!mc) return <section><div className="card"><div className="empty">Nema mikrociklusa. Klikni „+ Nov mikrociklus".</div></div></section>

  const dayMeta = mc.dayMeta || {}
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
          <button key={m.id} className={'mc-tab' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>MC {m.n}<small>{m.type}</small></button>
        ))}
        {comp.length > 0 && <>
          <span className="mc-sep" />
          <span className="mc-period-lab" style={{ color: '#B23B3B' }}>Takmičarski</span>
          {comp.map(m => (
            <button key={m.id} className={'mc-tab comp' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>MC {m.n}<small>{m.type}</small></button>
          ))}
        </>}
        <button className="btn primary sm" style={{ marginLeft: 8 }} onClick={() => store.addMicrocycle()}><Icon.plus /> Nov mikrociklus</button>
      </div>

      <div className="sec-title">
        <h2>Mikrociklus {mc.n} — {mc.type.toLowerCase()}</h2>
        <select className="input" style={{ width: 'auto', padding: '5px 9px', fontSize: 12 }} value={mc.type}
          onChange={e => store.updateMicrocycle(mc.id, { type: e.target.value })} title="Tip mikrociklusa">
          <option>Pripremni</option><option>Takmičarski</option>
        </select>
        <input className="input" style={{ width: 150, padding: '5px 9px', fontSize: 12 }} placeholder="npr. 06.07 – 13.07"
          value={mc.range || ''} onChange={e => store.updateMicrocycle(mc.id, { range: e.target.value })} title="Period" />
        {microcycles.length > 1 && (
          <button className="btn ghost sm" style={{ marginLeft: 'auto' }} title="Obriši mikrociklus"
            onClick={() => { if (confirm(`Obrisati Mikrociklus ${mc.n}?`)) { store.removeMicrocycle(mc.id); setActive(microcycles.find(x => x.id !== mc.id)?.id) } }}><Icon.trash /></button>
        )}
      </div>

      <div className="tbl-wrap">
        <div className={'mc-board' + (isComp ? ' comp-theme' : '')}>
          {DAYS.map((day, i) => {
            const dm = dayMeta[day] || {}
            const single = !!dm.single
            const parts = single ? [['am', 'Trening']] : [['am', 'Prepodne'], ['pm', 'Popodne']]
            return (
              <div className="mc-day" key={day}>
                <div className="mc-day-h" style={{ background: tint(dm.intensity) }}>
                  {DAYS_SHORT[i]}
                  <button className="int-swatch" style={{ background: intensityColor(dm.intensity) || 'rgba(0,0,0,.12)' }}
                    title={'Intenzitet: ' + (INTENSITY.find(x => x.key === dm.intensity)?.label || 'nije označen')}
                    onClick={() => { const cur = CYCLE.indexOf(dm.intensity); store.setMcDay(mc.id, day, { intensity: CYCLE[(cur + 1) % CYCLE.length] }) }} />
                </div>
                <div className="mc-day-ctrl">
                  <input value={dm.time || ''} placeholder="vreme" onChange={e => store.setMcDay(mc.id, day, { time: e.target.value })} title="Vreme treninga" />
                  <button className="btn sm" onClick={() => store.setMcDay(mc.id, day, { single: !single })} title="Jedan ili dva treninga">{single ? '1×' : '2×'}</button>
                </div>
                {parts.map(([part, plabel]) => {
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
            )
          })}
        </div>
      </div>
      <p className="mock-note">Cela nedelja u jednom prikazu. Klik na segment da upišeš sadržaj. Kvadratić u zaglavlju = intenzitet dana (boje kao u kalendaru). „1×/2×" prebacuje na jedan trening dnevno (bez prepodne/popodne).</p>

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
