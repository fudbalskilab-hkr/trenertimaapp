import { useRef } from 'react'
import { useStore, fmtDate } from '../data/store'
import { SECTIONS } from '../data/seed'
import { Icon } from '../components/Icons'
import Pitch from '../components/Pitch'

const DRAW_SECTIONS = ['Uvodni deo', 'Glavni deo', 'Završni deo']

export default function Training() {
  const store = useStore()
  const t = store.trainings[0]

  const HEAD = [
    ['Vreme', 'time'], ['Trajanje', 'duration'], ['Broj igrača', 'players'], ['Intenzitet', 'intensity'],
    ['MD ±', 'md'], ['Cilj treninga', 'goal'], ['Rekviziti', 'equipment'], ['Napomene', 'notes'],
  ]

  return (
    <section>
      <div className="sec-title"><h2>Koncept treninga</h2><span className="eyebrow">{fmtDate(t.date)} · {t.part} · MC1</span></div>

      <div className="tr-head">
        {HEAD.map(([lab, key]) => (
          <div className="f" key={key}>
            <div className="kk">{lab}</div>
            <input className="vv" defaultValue={t[key]}
              style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', width: '100%', padding: 0 }}
              onBlur={e => store.updateTraining(t.id, { [key]: e.target.value })} />
          </div>
        ))}
      </div>

      {SECTIONS.slice(0, 4).map((sec, i) => (
        <div className="tr-sect" key={sec}>
          <div className="sec-h">
            <div className="n" style={{ background: ['#1E9E6A', '#2E74D6', '#C9860B', '#5A6B85'][i] }}>{i + 1}</div><h4>{sec}</h4>
            <span className="mock-note" style={{ marginLeft: 'auto' }}>{DRAW_SECTIONS.includes(sec) ? 'tekst + crtež' : 'samo tekst'}</span>
          </div>
          {DRAW_SECTIONS.includes(sec) ? (
            <div className="tr-body">
              <SectText t={t} sec={sec} store={store} />
              <DrawBox t={t} sec={sec} store={store} />
            </div>
          ) : (
            <SectText t={t} sec={sec} store={store} />
          )}
        </div>
      ))}
    </section>
  )
}

function SectText({ t, sec, store }) {
  return (
    <textarea className="tr-text" defaultValue={t.sections[sec] || ''}
      style={{ resize: 'vertical', width: '100%' }}
      onBlur={e => store.updateTraining(t.id, { sections: { ...t.sections, [sec]: e.target.value } })} />
  )
}

function DrawBox({ t, sec, store }) {
  const fileRef = useRef()
  const img = (t.drawings || {})[sec]
  function upload(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => store.updateTraining(t.id, { drawings: { ...(t.drawings || {}), [sec]: r.result } })
    r.readAsDataURL(file)
  }
  return (
    <div className="draw">
      <div className="d-toolbar">
        <div className="d-tool" title="Igrač (uskoro)"><Icon.player /></div>
        <div className="d-tool" title="Lopta (uskoro)"><Icon.ball /></div>
        <div className="d-tool" title="Kup (uskoro)"><Icon.cone /></div>
        <div className="d-tool" title="Strelica (uskoro)"><Icon.arrow /></div>
        <button className="d-tool up" onClick={() => fileRef.current.click()} title="Ubaci sliku"><Icon.upload /> Slika</button>
        {img && <button className="d-tool" title="Ukloni sliku" onClick={() => store.updateTraining(t.id, { drawings: { ...(t.drawings || {}), [sec]: '' } })}><Icon.trash /></button>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      {img
        ? <img src={img} alt="skica" style={{ width: '100%', display: 'block' }} />
        : <Pitch schema height={190} />}
    </div>
  )
}
