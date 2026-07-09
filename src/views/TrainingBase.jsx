import { useState, useRef } from 'react'
import { useStore, fmtDate } from '../data/store'
import { Icon } from '../components/Icons'
import TrainingEditor from '../components/TrainingEditor'
import { exportNodeAsImage } from '../utils/exportImage'
import Exercises from './Exercises'

const SUBS = [
  { key: 'ex', label: 'Vežbe' },
  { key: 'concept', label: 'Koncept treninga' },
  { key: 'archive', label: 'Arhiva treninga' },
]

export default function TrainingBase({ sub: subProp, setSub: setSubProp }) {
  const store = useStore()
  const [subLocal, setSubLocal] = useState('ex')
  const sub = subProp ?? subLocal
  const setSub = setSubProp ?? setSubLocal
  const [selId, setSelId] = useState(store.trainings[0]?.id || null)

  const openInConcept = id => { setSelId(id); setSub('concept') }

  return (
    <section>
      {/* horizontalni podtabovi — samo na telefonu (na desktopu su u levom meniju) */}
      <div className="subtabs mobile-only">
        {SUBS.map(s => (
          <button key={s.key} className={'subtab' + (s.key === sub ? ' on' : '')} onClick={() => setSub(s.key)}>{s.label}</button>
        ))}
      </div>

      {sub === 'ex' && <Exercises embedded />}
      {sub === 'concept' && <Concept store={store} selId={selId} setSelId={setSelId} />}
      {sub === 'archive' && <Archive store={store} onOpen={openInConcept} onNew={() => { const id = store.addTraining('Novi trening'); openInConcept(id) }} />}
    </section>
  )
}

/* ---------- Koncept treninga (editor jednog treninga) ---------- */
function Concept({ store, selId, setSelId }) {
  const editRef = useRef()
  const t = store.trainings.find(x => x.id === selId) || store.trainings[0]
  const [mcOpen, setMcOpen] = useState(false)

  if (!t) {
    return (
      <div className="card"><div className="empty" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <span>Još nema treninga.</span>
        <button className="btn primary" onClick={() => setSelId(store.addTraining('Novi trening'))}><Icon.plus /> Napravi trening</button>
      </div></div>
    )
  }

  return (
    <div>
      <div className="concept-bar">
        <select className="input" style={{ width: 'auto', maxWidth: 220 }} value={t.id} onChange={e => setSelId(e.target.value)} title="Izaberi trening">
          {store.trainings.map(x => <option key={x.id} value={x.id}>{x.name || 'bez naziva'}</option>)}
        </select>
        <button className="btn sm" onClick={() => setSelId(store.addTraining('Novi trening'))}><Icon.plus /> Nov</button>
        <div className="spacer" />
        <button className="btn sm" onClick={() => { const n = prompt('Naziv treninga:', t.name || ''); if (n != null) store.updateTraining(t.id, { name: n.trim() || t.name }) }}><Icon.edit /> Preimenuj</button>
        <button className="btn sm" onClick={() => setSelId(store.duplicateTraining(t.id))}>Dupliraj</button>
        <button className="btn sm" onClick={() => exportNodeAsImage(editRef.current, `trening-${(t.name || 'trening').replace(/\s+/g, '_')}.png`)}><Icon.download /> Slika</button>
        <button className="btn primary sm" onClick={() => setMcOpen(true)}>Ubaci u MC</button>
        <button className="btn ghost sm" title="Obriši trening" onClick={() => { if (confirm(`Obrisati trening „${t.name}"?`)) { store.removeTraining(t.id); setSelId(store.trainings.find(x => x.id !== t.id)?.id || null) } }}><Icon.trash /></button>
      </div>

      <div ref={editRef} className="export-area">
        <div className="sec-title" style={{ marginBottom: 12 }}><h2>{t.name || 'Trening'}</h2><span className="eyebrow">{fmtDate(t.date) || ''} {t.time}</span></div>
        <TrainingEditor value={t} onChange={patch => store.updateTraining(t.id, patch)} />
      </div>

      {mcOpen && <McPicker store={store} training={t} onClose={() => setMcOpen(false)} />}
    </div>
  )
}

/* ---------- Arhiva treninga ---------- */
function Archive({ store, onOpen, onNew }) {
  const list = store.trainings
  return (
    <div>
      <div className="sec-title"><h2>Arhiva treninga</h2><span className="pill blue">{list.length}</span>
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={onNew}><Icon.plus /> Nov trening</button></div>
      {list.length === 0
        ? <div className="card"><div className="empty">Još nema sačuvanih treninga. Klikni „Nov trening".</div></div>
        : <div className="arch-grid">
            {list.map(t => (
              <button key={t.id} className="arch-card" onClick={() => onOpen(t.id)}>
                <div className="ac-name">{t.name || 'bez naziva'}</div>
                <div className="ac-goal">{t.goal || 'bez cilja'}</div>
                <div className="ac-meta">{[fmtDate(t.date), t.time, t.duration].filter(Boolean).join(' · ') || '—'}</div>
              </button>
            ))}
          </div>}
    </div>
  )
}

/* ---------- Ubaci u MC (izbor MC + dan + termin) ---------- */
const DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']
function McPicker({ store, training, onClose }) {
  const mcs = store.microcycles
  const [mcId, setMcId] = useState(mcs[0]?.id || '')
  const [day, setDay] = useState('Ponedeljak')
  const [part, setPart] = useState('am')
  const mc = mcs.find(m => m.id === mcId)
  const single = !!(mc?.dayMeta?.[day]?.single)

  function confirm2() {
    store.insertTrainingToMc(mcId, day, single ? 'am' : part, training)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Ubaci trening u mikrociklus</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          {mcs.length === 0
            ? <div className="empty">Nema mikrociklusa. Prvo napravi mikrociklus u tabu „Mikrociklusi".</div>
            : <>
              <div className="field"><label>Mikrociklus</label>
                <select className="input" value={mcId} onChange={e => setMcId(e.target.value)}>
                  {mcs.map(m => <option key={m.id} value={m.id}>MC {m.n}{m.range ? ' · ' + m.range : ''}</option>)}
                </select></div>
              <div className="field"><label>Dan</label>
                <select className="input" value={day} onChange={e => setDay(e.target.value)}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></div>
              {!single && (
                <div className="field"><label>Termin</label>
                  <select className="input" value={part} onChange={e => setPart(e.target.value)}>
                    <option value="am">Prepodne</option><option value="pm">Popodne</option>
                  </select></div>
              )}
              {single && <p className="mock-note">Ovaj dan ima samo jedan trening — nema izbora termina.</p>}
              <p className="mock-note">Trening ostaje i u arhivi. U MC se stavlja nezavisna kopija (izmene tamo ne diraju arhivu).</p>
            </>}
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!mcId} onClick={confirm2}>Ubaci</button></div>
      </div>
    </div>
  )
}
