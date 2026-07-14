import { useState, useRef } from 'react'
import { useStore } from '../data/store'
import { SECTIONS, INTENSITY, intensityColor } from '../data/seed'
import { Icon } from '../components/Icons'
import TrainingEditor, { trainingOverview } from '../components/TrainingEditor'
import { exportNodeAsImage } from '../utils/exportImage'

const DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']
const DAYS_SHORT = ['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED']
const CYCLE = [null, 'match', '80', '50', '30', 'regen', 'free']
const tint = k => { const c = intensityColor(k); return c === 'transparent' ? 'var(--surface-2)' : `color-mix(in srgb, ${c} 18%, var(--surface))` }

export default function Microcycles() {
  const store = useStore()
  const { microcycles, calendar } = store
  const [active, setActive] = useState(microcycles[0]?.id)
  const [edit, setEdit] = useState(null)
  const [trDetail, setTrDetail] = useState(null) // {day, part}
  const [calPick, setCalPick] = useState(false) // modal „ubaci u kalendar"
  const boardRef = useRef()

  const mc = microcycles.find(m => m.id === active) || microcycles[0]
  const prep = microcycles.filter(m => m.type !== 'Takmičarski')
  const comp = microcycles.filter(m => m.type === 'Takmičarski')

  if (!mc) return (
    <section>
      <div className="sec-title"><h2>Mikrociklusi</h2></div>
      <div className="card"><div className="empty" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <span>Još nema mikrociklusa.</span>
        <button className="btn primary" onClick={() => store.addMicrocycle()}><Icon.plus /> Nov mikrociklus</button>
      </div></div>
    </section>
  )

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
  const locked = !!mc.locked
  const linkedWeek = calendar.find(w => w.mcId === mc.id)

  return (
    <section>
      <div className="mc-tabs">
        <span className="mc-period-lab">Pripremni</span>
        {prep.map(m => (
          <button key={m.id} className={'mc-tab' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>MC {m.n}<small>{m.range || m.type}</small></button>
        ))}
        {comp.length > 0 && <>
          <span className="mc-sep" />
          <span className="mc-period-lab" style={{ color: '#B23B3B' }}>Takmičarski</span>
          {comp.map(m => (
            <button key={m.id} className={'mc-tab comp' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>MC {m.n}<small>{m.range || m.type}</small></button>
          ))}
        </>}
        <button className="btn primary sm" style={{ marginLeft: 8 }} onClick={() => store.addMicrocycle()}><Icon.plus /> Nov mikrociklus</button>
      </div>

      <div className="sec-title">
        <h2>Mikrociklus {mc.n}{mc.range ? ' · ' + mc.range : ''}</h2>
        <select className="input" style={{ width: 'auto', padding: '5px 9px', fontSize: 12 }} value={mc.type} disabled={locked}
          onChange={e => store.updateMicrocycle(mc.id, { type: e.target.value })} title="Tip mikrociklusa">
          <option>Pripremni</option><option>Takmičarski</option>
        </select>
        <input className="input" style={{ width: 150, padding: '5px 9px', fontSize: 12 }} placeholder="datum, npr. 06.07 – 13.07"
          value={mc.range || ''} disabled={locked} onChange={e => store.updateMicrocycle(mc.id, { range: e.target.value })} title="Datum / period" />
        {linkedWeek
          ? <button className="btn sm on" style={{ marginLeft: 'auto' }} title={'U kalendaru od ' + linkedWeek.start + ' — klikni da ukloniš'} onClick={() => store.unlinkMcFromWeek(linkedWeek.start)}><Icon.cal /> U kalendaru ✓</button>
          : <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setCalPick(true)}><Icon.cal /> Ubaci u kalendar</button>}
        <button className="btn sm" onClick={() => exportNodeAsImage(boardRef.current, `MC${mc.n}${mc.range ? '-' + mc.range.replace(/[^\w]+/g, '_') : ''}.png`)}><Icon.download /> Slika</button>
        {locked
          ? <button className="btn" onClick={() => store.updateMicrocycle(mc.id, { locked: false })}><Icon.edit /> Izmeni</button>
          : <button className="btn primary" onClick={() => store.updateMicrocycle(mc.id, { locked: true })}>✓ Snimi MC</button>}
        {microcycles.length > 1 && (
          <button className="btn ghost sm" title="Obriši mikrociklus"
            onClick={() => { if (confirm(`Obrisati Mikrociklus ${mc.n}?`)) { store.removeMicrocycle(mc.id); setActive(microcycles.find(x => x.id !== mc.id)?.id) } }}><Icon.trash /></button>
        )}
      </div>
      {locked && <p className="mock-note" style={{ margin: '-8px 0 14px' }}>🔒 Snimljeno — zaključano da se ne dira slučajno. Klikni „Izmeni" da menjaš.</p>}

      <div className="tbl-wrap">
        <div className={'mc-board' + (isComp ? ' comp-theme' : '')} ref={boardRef}>
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
                    onClick={() => { if (locked) return; const cur = CYCLE.indexOf(dm.intensity); store.setMcDay(mc.id, day, { intensity: CYCLE[(cur + 1) % CYCLE.length] }) }} />
                </div>
                {!locked && <div className="mc-day-ctrl">
                  <button className="btn sm" style={{ width: '100%' }} onClick={() => store.setMcDay(mc.id, day, { single: !single })} title="Jedan ili dva treninga dnevno">{single ? '1 trening' : '2 treninga'}</button>
                </div>}
                {parts.map(([part, plabel]) => {
                  const sess = getSession(day, part)
                  const training = dm[part + 'Training']
                  return (
                    <div className="mc-part" key={part}>
                      <div className="mc-part-h">
                        <span style={{ flex: 1 }}>{plabel}</span>
                        <input className="mc-time" value={dm[part + 'Time'] || ''} placeholder="—:—" readOnly={locked}
                          onChange={e => store.setMcDay(mc.id, day, { [part + 'Time']: e.target.value })} title="Vreme treninga" />
                      </div>
                      {training ? (
                        <button className="mc-has-train" style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer' }}
                          onClick={() => setTrDetail({ day, part })}>
                          <div className="mc-train-badge">📋 trening — klik za detalje</div>
                          {(() => { const ov = trainingOverview(training); return <>
                            {ov.goal && <div className="mht-goal">{ov.goal}</div>}
                            {ov.parts.map(p => <div className="mht-line" key={p.sec}><b>{p.sec.replace(' deo', '')}:</b> {p.txt}</div>)}
                            {!ov.goal && ov.parts.length === 0 && <div className="mht-line">Prazan trening — klik za unos.</div>}
                          </> })()}
                        </button>
                      ) : (
                        SECTIONS.map((sec, k) => {
                          const val = sess?.sections?.[sec] || ''
                          return (
                            <button className="mc-seg" key={sec} style={{ cursor: locked ? 'default' : 'pointer' }}
                              onClick={locked ? undefined : () => setEdit({ day, part, section: sec, value: val, plabel })}>
                              <div className="sg-lab">{k + 1} · {sec}</div>
                              <div className={'sg-val' + (val ? '' : ' empty2')}>{val || '—'}</div>
                            </button>
                          )
                        })
                      )}
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

      {trDetail && (() => {
        const tr = (mc.dayMeta?.[trDetail.day] || {})[trDetail.part + 'Training']
        if (!tr) return null
        // koliko dana ima isti izvorni trening (za „primeni na ostale")
        let siblings = 0
        Object.keys(mc.dayMeta || {}).forEach(d => ['am', 'pm'].forEach(p => {
          const x = mc.dayMeta[d][p + 'Training']
          if (x && tr.sourceId && x.sourceId === tr.sourceId && !(d === trDetail.day && p === trDetail.part)) siblings++
        }))
        return <TrainingDetailModal training={tr} siblings={siblings} locked={locked}
          onClose={() => setTrDetail(null)}
          onChange={(patch, applyAll) => store.updateMcTraining(mc.id, trDetail.day, trDetail.part, patch, applyAll)}
          onRemove={() => { store.removeMcTraining(mc.id, trDetail.day, trDetail.part); setTrDetail(null) }} />
      })()}

      {calPick && <CalPickModal mcN={mc.n} range={mc.range} onClose={() => setCalPick(false)}
        onPick={mondayISO => { store.linkMcToWeek(mondayISO, mc.id); setCalPick(false) }} />}
    </section>
  )
}

function mondayOf(iso) { const x = new Date(iso); const dw = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dw); return x.toISOString().slice(0, 10) }

function CalPickModal({ mcN, range, onClose, onPick }) {
  const [date, setDate] = useState('')
  const monday = date ? mondayOf(date) : ''
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-h"><h3>Ubaci MC {mcN} u kalendar</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Prvi dan nedelje (bilo koji datum te nedelje)</label>
            <input className="input" type="date" value={date} autoFocus onChange={e => setDate(e.target.value)} /></div>
          {monday && <p className="mock-note">Ponedeljak → Nedelja te nedelje ({monday}). Ako nedelja ne postoji u kalendaru, napraviću je. Kalendar prikazuje SAŽETAK (uređuješ ovde u Mikrociklusima).</p>}
          {range && <p className="mock-note" style={{ opacity: .8 }}>Period MC-a: {range}</p>}
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!monday} onClick={() => onPick(monday)}>Ubaci</button></div>
      </div>
    </div>
  )
}

function TrainingDetailModal({ training, siblings, locked, onClose, onChange, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(training)
  const areaRef = useRef()
  function done() {
    let applyAll = false
    if (siblings > 0) applyAll = confirm(`Ovaj trening je u još ${siblings} dan(a). Primeniti izmene i na njih?\n\nOK = na sve · Otkaži = samo ovaj dan`)
    onChange(draft, applyAll)
    setEditing(false)
  }
  const view = editing ? draft : training
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <div className="modal-h">
          <h3>{view.name || 'Trening'}</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn sm" onClick={() => exportNodeAsImage(areaRef.current, `trening-${(view.name || 'trening').replace(/\s+/g, '_')}.png`)}><Icon.download /> Slika</button>
            {!locked && (editing
              ? <button className="btn primary sm" onClick={done}>✓ Gotovo</button>
              : <button className="btn sm" onClick={() => { setDraft(training); setEditing(true) }}><Icon.edit /> Izmeni</button>)}
            {!locked && <button className="btn ghost sm" title="Ukloni iz dana" onClick={onRemove}><Icon.trash /></button>}
            <button className="btn ghost sm" onClick={onClose}><Icon.close /></button>
          </div>
        </div>
        <div className="modal-b" ref={areaRef}>
          <TrainingEditor key={editing ? 'edit' : 'view'} value={view} onChange={patch => setDraft(d => ({ ...d, ...patch }))} readOnly={!editing} />
        </div>
      </div>
    </div>
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
