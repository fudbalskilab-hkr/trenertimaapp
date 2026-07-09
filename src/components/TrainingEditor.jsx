import { useRef } from 'react'
import { SECTIONS } from '../data/seed'
import { Icon } from './Icons'
import Pitch from './Pitch'
import { shrinkImage } from '../utils/img'

const DRAW_SECTIONS = ['Uvodni deo', 'Glavni deo', 'Završni deo']
const SEC4 = SECTIONS.slice(0, 4)
const HEAD = [
  ['Vreme', 'time'], ['Trajanje', 'duration'], ['Broj igrača', 'players'], ['Intenzitet', 'intensity'],
  ['MD ±', 'md'], ['Cilj treninga', 'goal'], ['Rekviziti', 'equipment'], ['Napomene', 'notes'],
]

// Uređivač jednog treninga. value = trening objekat, onChange(patch) menja ga.
export default function TrainingEditor({ value: t, onChange, readOnly = false }) {
  const set = patch => onChange(patch)
  return (
    <div>
      <div className="tr-head">
        {HEAD.map(([lab, key]) => (
          <div className="f" key={key}>
            <div className="kk">{lab}</div>
            <input className="vv" defaultValue={t[key]} readOnly={readOnly}
              style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', width: '100%', padding: 0 }}
              onBlur={e => !readOnly && set({ [key]: e.target.value })} />
          </div>
        ))}
      </div>

      {SEC4.map((sec, i) => (
        <div className="tr-sect" key={sec}>
          <div className="sec-h">
            <div className="n" style={{ background: ['#1E9E6A', '#2E74D6', '#C9860B', '#5A6B85'][i] }}>{i + 1}</div><h4>{sec}</h4>
            <span className="mock-note" style={{ marginLeft: 'auto' }}>{DRAW_SECTIONS.includes(sec) ? 'tekst + crtež' : 'samo tekst'}</span>
          </div>
          {DRAW_SECTIONS.includes(sec) ? (
            <div className="tr-body">
              <SectText t={t} sec={sec} set={set} readOnly={readOnly} />
              <DrawBox t={t} sec={sec} set={set} readOnly={readOnly} />
            </div>
          ) : (
            <SectText t={t} sec={sec} set={set} readOnly={readOnly} />
          )}
        </div>
      ))}
    </div>
  )
}

function SectText({ t, sec, set, readOnly }) {
  return (
    <textarea className="tr-text" defaultValue={t.sections?.[sec] || ''} readOnly={readOnly}
      style={{ resize: 'vertical', width: '100%' }}
      onBlur={e => !readOnly && set({ sections: { ...(t.sections || {}), [sec]: e.target.value } })} />
  )
}

function DrawBox({ t, sec, set, readOnly }) {
  const fileRef = useRef()
  const img = (t.drawings || {})[sec]
  function upload(e) {
    const file = e.target.files[0]; if (!file) return
    shrinkImage(file, 700).then(url => set({ drawings: { ...(t.drawings || {}), [sec]: url } }))
  }
  return (
    <div className="draw">
      {!readOnly && (
        <div className="d-toolbar">
          <div className="d-tool" title="Igrač (uskoro)"><Icon.player /></div>
          <div className="d-tool" title="Lopta (uskoro)"><Icon.ball /></div>
          <div className="d-tool" title="Kup (uskoro)"><Icon.cone /></div>
          <div className="d-tool" title="Strelica (uskoro)"><Icon.arrow /></div>
          <button className="d-tool up" onClick={() => fileRef.current.click()} title="Ubaci sliku"><Icon.upload /> Slika</button>
          {img && <button className="d-tool" title="Ukloni sliku" onClick={() => set({ drawings: { ...(t.drawings || {}), [sec]: '' } })}><Icon.trash /></button>}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      {img
        ? <img src={img} alt="skica" style={{ width: '100%', display: 'block' }} />
        : <Pitch schema height={190} />}
    </div>
  )
}

// Kratak pregled treninga (za MC dan): cilj + po sekcijama prvi red teksta
export function trainingOverview(t) {
  if (!t) return null
  const parts = SEC4.map(sec => {
    const txt = (t.sections?.[sec] || '').split('\n')[0].trim()
    return txt ? { sec, txt } : null
  }).filter(Boolean)
  return { goal: t.goal, time: t.time, parts }
}
