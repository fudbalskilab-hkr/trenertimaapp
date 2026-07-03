import { useState, useEffect, useRef } from 'react'
import { useStore } from '../data/store'
import { SECTIONS } from '../data/seed'
import { Icon } from '../components/Icons'
import Pitch from '../components/Pitch'

const FILTERS = ['Sve', ...SECTIONS.slice(0, 4), 'Snaga', 'Presing', 'Posed', 'Build-up', 'Fizika']
const DEMO = [
  { markers: [{ x: 60, y: 45 }, { x: 240, y: 45 }, { x: 150, y: 120, team: 'away' }], arrows: [{ x1: 72, y1: 48, x2: 228, y2: 48 }] },
  { boxes: true, markers: [{ x: 55, y: 60 }, { x: 145, y: 45, team: 'away' }, { x: 145, y: 75, team: 'away' }], arrows: [] },
  { markers: [{ x: 80, y: 60 }, { x: 160, y: 90, team: 'away' }], arrows: [{ x1: 88, y1: 62, x2: 152, y2: 88, dash: true }] },
]

export default function Exercises({ addSignal }) {
  const store = useStore()
  const { exercises } = store
  const [filter, setFilter] = useState('Sve')
  const [adding, setAdding] = useState(false)
  useEffect(() => { if (addSignal) setAdding(true) }, [addSignal])

  const shown = exercises.filter(e => filter === 'Sve' || e.section === filter || (e.tags || []).includes(filter))

  return (
    <section>
      <div className="sec-title"><h2>Skladište vežbi</h2><span className="eyebrow">{exercises.length} vežbi u biblioteci</span></div>
      <div className="filters">
        {FILTERS.map(f => (
          <button key={f} className={'chip' + (f === filter ? ' on' : '')} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card"><div className="empty">Nema vežbi za ovaj filter.</div></div>
      ) : (
        <div className="ex-grid">
          {shown.map((e, i) => (
            <div className="ex-card" key={e.id}>
              <div className="ex-thumb">
                {e.image ? <img src={e.image} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Pitch {...DEMO[i % DEMO.length]} height={120} />}
              </div>
              <div className="ex-b">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h4 style={{ flex: 1 }}>{e.name}</h4>
                  <button className="btn ghost sm" title="Obriši" onClick={() => store.removeExercise(e.id)}><Icon.trash /></button>
                </div>
                <p>{e.desc}</p>
                <div className="ex-tags">
                  {e.section && <span className="tag">{e.section}</span>}
                  {(e.tags || []).map(t => <span className="tag" key={t}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mock-note" style={{ marginTop: 16 }}>Svaka vežba: naziv, opis, skica (crtež ili slika), tema/sekcija. Interaktivni editor terena stiže u sledećoj fazi.</p>

      {adding && <AddExercise onClose={() => setAdding(false)} onSave={e => { store.addExercise(e); setAdding(false) }} />}
    </section>
  )
}

function AddExercise({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', desc: '', section: 'Uvodni deo', tags: '', image: '' })
  const fileRef = useRef()
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  function upload(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader(); r.onload = () => set('image', r.result); r.readAsDataURL(file)
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Nova vežba</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Naziv</label><input className="input" value={f.name} autoFocus onChange={e => set('name', e.target.value)} placeholder="npr. Rondo 6v2" /></div>
          <div className="field"><label>Opis</label><textarea className="input" rows={2} value={f.desc} onChange={e => set('desc', e.target.value)} /></div>
          <div className="row2">
            <div className="field"><label>Sekcija</label><select className="input" value={f.section} onChange={e => set('section', e.target.value)}>{SECTIONS.slice(0, 4).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Teme (zapeta)</label><input className="input" value={f.tags} onChange={e => set('tags', e.target.value)} placeholder="Posed, Presing" /></div>
          </div>
          <div className="field"><label>Skica / slika (opciono)</label>
            <button className="btn" onClick={() => fileRef.current.click()}><Icon.upload /> {f.image ? 'Promeni sliku' : 'Ubaci sliku'}</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
            {f.image && <img src={f.image} alt="skica" style={{ width: '100%', marginTop: 10, borderRadius: 8 }} />}
          </div>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!f.name.trim()} onClick={() => onSave({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) })}>Sačuvaj</button></div>
      </div>
    </div>
  )
}
