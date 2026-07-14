import { useState, useRef } from 'react'
import { useStore } from '../data/store'
import { SECTIONS, INTENSITY, intensityColor, intensityBg } from '../data/seed'
import { Icon } from '../components/Icons'
import TrainingEditor, { trainingOverview } from '../components/TrainingEditor'
import { exportNodeAsImage } from '../utils/exportImage'

const DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']
const DAYS_SHORT = ['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED']
const CYCLE = [null, 'match', '80', '50', '30', 'regen', 'free']
// boje kao u kalendaru: telo dana svetlo (bg), zaglavlje tamnije (accent)
const dayBody = k => { const c = intensityBg(k); return c === 'transparent' ? 'var(--surface)' : `color-mix(in srgb, ${c} 50%, var(--surface))` }
const dayHead = k => { const c = intensityColor(k); return c === 'transparent' ? 'var(--surface-2)' : `color-mix(in srgb, ${c} 42%, var(--surface))` }

export default function Microcycles() {
  const store = useStore()
  const { microcycles, calendar } = store
  const [active, setActive] = useState(microcycles[0]?.id)
  const [edit, setEdit] = useState(null)
  const [trDetail, setTrDetail] = useState(null) // {day, part}
  const [calPick, setCalPick] = useState(false)
  const [favOpen, setFavOpen] = useState(false)
  const [allTime, setAllTime] = useState('')
  const boardRef = useRef()

  const mc = microcycles.find(m => m.id === active) || microcycles[0]
  const prep = microcycles.filter(m => m.type !== 'Takmičarski')
  const comp = microcycles.filter(m => m.type === 'Takmičarski')

  if (!mc) return (
    <section>
      <div className="sec-title"><h2>Mikrociklusi</h2></div>
      <div className="card"><div className="empty" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <span>Još nema mikrociklusa.</span>
        <button className="btn primary" onClick={() => setActive(store.addMicrocycle())}><Icon.plus /> Nov mikrociklus</button>
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
  const linkedWeek = calendar.find(w => w.mcId === mc.id)
  // redni broj UNUTAR tipa (kreće od 1) — i za pripremni i za takmičarski
  const sameType = isComp ? comp : prep
  const dispN = sameType.findIndex(x => x.id === mc.id) + 1
  const fav = store.team.mcFavorites || {}

  return (
    <section>
      <div className="mc-tabs">
        <span className="mc-period-lab">Pripremni</span>
        {prep.map((m, i) => (
          <button key={m.id} className={'mc-tab' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>MC {i + 1}<small>{m.range || m.type}</small></button>
        ))}
        {comp.length > 0 && <>
          <span className="mc-sep" />
          <span className="mc-period-lab" style={{ color: '#B23B3B' }}>Takmičarski</span>
          {comp.map((m, i) => (
            <button key={m.id} className={'mc-tab comp' + (m.id === active ? ' on' : '')} onClick={() => setActive(m.id)}>MC {i + 1}<small>{m.range || m.type}</small></button>
          ))}
        </>}
        <button className="btn primary sm" style={{ marginLeft: 8 }} onClick={() => setActive(store.addMicrocycle(mc.type))} title={`Napravi nov ${mc.type.toLowerCase()} mikrociklus (isti tip kao trenutni)`}><Icon.plus /> Nov mikrociklus</button>
      </div>

      <div className="sec-title mc-toolbar">
        <h2>Mikrociklus {dispN}{mc.range ? ' · ' + mc.range : ''}</h2>
        <input className="input" style={{ width: 128, padding: '5px 9px', fontSize: 12 }} placeholder="datum, npr. 06.07 – 13.07"
          value={mc.range || ''} onChange={e => store.updateMicrocycle(mc.id, { range: e.target.value })} title="Datum / period" />
        <span className="mc-type-lab">Tip:</span>
        <div className="seg-toggle">
          <button className={mc.type !== 'Takmičarski' ? 'on' : ''} onClick={() => store.updateMicrocycle(mc.id, { type: 'Pripremni' })}>Pripremni</button>
          <button className={mc.type === 'Takmičarski' ? 'on comp' : ''} onClick={() => store.updateMicrocycle(mc.id, { type: 'Takmičarski' })}>Takmičarski</button>
        </div>
        <span className="mc-type-lab">Termin:</span>
        <input className="input" type="time" value={allTime} onChange={e => setAllTime(e.target.value)} style={{ width: 108, padding: '5px 9px', fontSize: 12 }} title="Termin za sve dane" />
        <button className="btn sm" disabled={!allTime} onClick={() => store.setMcAllTimes(mc.id, 'am', allTime)} title="Upiši kao prepodnevni termin za sve dane">Prep. svima</button>
        <button className="btn sm" disabled={!allTime} onClick={() => store.setMcAllTimes(mc.id, 'pm', allTime)} title="Upiši kao popodnevni termin za sve dane">Pop. svima</button>
        <div style={{ flex: 1 }} />
        <button className="btn sm" onClick={() => setFavOpen(true)} title="Standardne (omiljene) aktivnosti"><Icon.gear /> Standardne</button>
        {linkedWeek
          ? <button className="btn sm on" title={'U kalendaru od ' + linkedWeek.start + ' — klikni da ukloniš'} onClick={() => store.unlinkMcFromWeek(linkedWeek.start)}><Icon.cal /> U kalendaru ✓</button>
          : <button className="btn sm" onClick={() => setCalPick(true)}><Icon.cal /> Ubaci u kalendar</button>}
        <button className="btn sm" onClick={() => setActive(store.duplicateMicrocycle(mc.id))} title="Napravi kopiju ovog MC"><Icon.plus /> Dupliraj</button>
        <button className="btn sm" onClick={() => exportNodeAsImage(boardRef.current, `MC${dispN}${mc.range ? '-' + mc.range.replace(/[^\w]+/g, '_') : ''}.png`)}><Icon.download /> Slika</button>
        {microcycles.length > 1 && (
          <button className="btn ghost sm" title="Obriši mikrociklus"
            onClick={() => { if (confirm(`Obrisati Mikrociklus ${dispN}?`)) { store.removeMicrocycle(mc.id); setActive(microcycles.find(x => x.id !== mc.id)?.id) } }}><Icon.trash /></button>
        )}
      </div>

      <div className="tbl-wrap">
        <div className={'mc-board' + (isComp ? ' comp-theme' : '')} ref={boardRef}>
          {DAYS.map((day, i) => {
            const dm = dayMeta[day] || {}
            const single = !!dm.single
            const parts = single ? [['am', 'Trening']] : [['am', 'Prepodne'], ['pm', 'Popodne']]
            return (
              <div className="mc-day" key={day} style={{ background: dayBody(dm.intensity) }}>
                <div className="mc-day-h" style={{ background: dayHead(dm.intensity) }}>
                  {DAYS_SHORT[i]}
                  <button className="int-swatch" style={{ background: intensityColor(dm.intensity) || 'rgba(0,0,0,.18)' }}
                    title={'Intenzitet: ' + (INTENSITY.find(x => x.key === dm.intensity)?.label || 'nije označen')}
                    onClick={() => { const cur = CYCLE.indexOf(dm.intensity); store.setMcDay(mc.id, day, { intensity: CYCLE[(cur + 1) % CYCLE.length] }) }} />
                </div>
                <div className="mc-day-ctrl">
                  <button className="btn sm" style={{ width: '100%' }} onClick={() => store.setMcDay(mc.id, day, { single: !single })} title="Jedan ili dva treninga dnevno">{single ? '1×' : '2×'}</button>
                </div>
                {parts.map(([part, plabel]) => {
                  const sess = getSession(day, part)
                  const training = dm[part + 'Training']
                  return (
                    <div className="mc-part" key={part}>
                      <div className="mc-part-h">
                        <span style={{ flex: 1 }}>{plabel}</span>
                        <input className="mc-time" type="time" value={dm[part + 'Time'] || ''}
                          onChange={e => store.setMcDay(mc.id, day, { [part + 'Time']: e.target.value })} title="Vreme treninga" />
                      </div>
                      {training ? (
                        <div className="mc-has-train" onClick={() => setTrDetail({ day, part })}>
                          <div className="mc-train-badge">📋 trening — klik za detalje</div>
                          <div className="mc-train-ov">
                            {(() => { const ov = trainingOverview(training); return <>
                              {ov.goal && <div className="mht-goal">{ov.goal}</div>}
                              {ov.parts.map(p => <div className="mht-line" key={p.sec}><b>{p.sec.replace(' deo', '')}:</b> {p.txt}</div>)}
                              {!ov.goal && ov.parts.length === 0 && <div className="mht-line">Prazan trening — klik za unos.</div>}
                            </> })()}
                          </div>
                        </div>
                      ) : (
                        SECTIONS.map((sec, k) => {
                          const val = sess?.sections?.[sec] || ''
                          return (
                            <button className="mc-seg" key={sec} onClick={() => setEdit({ day, part, section: sec, value: val, plabel })}>
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
      <p className="mock-note">Cela nedelja u jednom prikazu. Klik na segment da upišeš sadržaj (ponude se tvoje standardne aktivnosti). Kvadratić u zaglavlju = intenzitet dana (cela kolona se boji). „1×/2×" prebacuje na jedan trening dnevno.</p>

      {edit && <EditModal title={`${edit.day} · ${edit.plabel} · ${edit.section}`} value={edit.value}
        favorites={fav[edit.section] || []}
        onAddFav={t => { const cur = fav[edit.section] || []; if (!cur.includes(t)) store.setMcFavorites(edit.section, [...cur, t]) }}
        onDelFav={idx => { const cur = fav[edit.section] || []; store.setMcFavorites(edit.section, cur.filter((_, j) => j !== idx)) }}
        onClose={() => setEdit(null)} onSave={v => saveSection(edit.day, edit.part, edit.section, v)} />}

      {trDetail && (() => {
        const tr = (mc.dayMeta?.[trDetail.day] || {})[trDetail.part + 'Training']
        if (!tr) return null
        let siblings = 0
        Object.keys(mc.dayMeta || {}).forEach(d => ['am', 'pm'].forEach(p => {
          const x = mc.dayMeta[d][p + 'Training']
          if (x && tr.sourceId && x.sourceId === tr.sourceId && !(d === trDetail.day && p === trDetail.part)) siblings++
        }))
        return <TrainingDetailModal training={tr} siblings={siblings}
          onClose={() => setTrDetail(null)}
          onChange={(patch, applyAll) => store.updateMcTraining(mc.id, trDetail.day, trDetail.part, patch, applyAll)}
          onRemove={() => { store.removeMcTraining(mc.id, trDetail.day, trDetail.part); setTrDetail(null) }} />
      })()}

      {calPick && <CalPickModal mcN={dispN} range={mc.range} onClose={() => setCalPick(false)}
        onPick={mondayISO => { store.linkMcToWeek(mondayISO, mc.id); setCalPick(false) }} />}

      {favOpen && <FavSettings store={store} onClose={() => setFavOpen(false)} />}
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
          {monday && <p className="mock-note">Ponedeljak → Nedelja te nedelje ({monday}). Ako nedelja ne postoji u kalendaru, napraviću je.</p>}
          {range && <p className="mock-note" style={{ opacity: .8 }}>Period MC-a: {range}</p>}
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!monday} onClick={() => onPick(monday)}>Ubaci</button></div>
      </div>
    </div>
  )
}

function TrainingDetailModal({ training, siblings, onClose, onChange, onRemove }) {
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
            {editing
              ? <button className="btn primary sm" onClick={done}>✓ Gotovo</button>
              : <button className="btn sm" onClick={() => { setDraft(training); setEditing(true) }}><Icon.edit /> Izmeni</button>}
            <button className="btn ghost sm" title="Ukloni iz dana" onClick={onRemove}><Icon.trash /></button>
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

function EditModal({ title, value, favorites, onClose, onSave, onAddFav, onDelFav }) {
  const [v, setV] = useState(value)
  const use = f => setV(cur => (cur.trim() ? cur.trim() + '\n' + f : f))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3 style={{ fontSize: 14 }}>{title}</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          {favorites.length > 0 && <div className="fav-wrap">
            <div className="eyebrow" style={{ marginBottom: 6 }}>Standardne aktivnosti (klik da dodaš)</div>
            <div className="fav-chips">
              {favorites.map((f, i) => (
                <span className="fav-chip" key={i}>
                  <button className="fav-use" onClick={() => use(f)} title="Dodaj u sadržaj">{f}</button>
                  <button className="fav-del" onClick={() => onDelFav(i)} title="Obriši omiljeno">×</button>
                </span>
              ))}
            </div>
          </div>}
          <div className="field"><label>Sadržaj</label>
            <textarea className="input" rows={4} value={v} autoFocus onChange={e => setV(e.target.value)} placeholder="npr. Rondo 5v2, 2 serije" /></div>
          <button className="btn ghost sm" disabled={!v.trim()} onClick={() => onAddFav(v.trim())} title="Sačuvaj ovaj tekst kao standardnu aktivnost">★ Sačuvaj kao standardnu</button>
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button><button className="btn primary" onClick={() => onSave(v)}>Sačuvaj</button></div>
      </div>
    </div>
  )
}

function FavSettings({ store, onClose }) {
  const fav = store.team.mcFavorites || {}
  const [sec, setSec] = useState(SECTIONS[0])
  const [txt, setTxt] = useState('')
  const list = fav[sec] || []
  const add = () => { const t = txt.trim(); if (!t || list.includes(t)) { setTxt(''); return } store.setMcFavorites(sec, [...list, t]); setTxt('') }
  const del = i => store.setMcFavorites(sec, list.filter((_, j) => j !== i))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-h"><h3>Standardne aktivnosti</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <p className="mock-note" style={{ marginTop: 0 }}>Napravi svoju biblioteku aktivnosti po segmentu. U mikrociklusu, kad klikneš segment, ponude ti se ove stavke.</p>
          <div className="subtabs" style={{ marginBottom: 14 }}>
            {SECTIONS.map(s => <button key={s} className={'subtab' + (s === sec ? ' on' : '')} onClick={() => setSec(s)}>{s}</button>)}
          </div>
          <div className="fav-editlist">
            {list.length === 0 && <div className="empty" style={{ padding: 14 }}>Nema stavki za „{sec}".</div>}
            {list.map((f, i) => (
              <div className="fav-editrow" key={i}>
                <input className="input" value={f} onChange={e => { const na = list.slice(); na[i] = e.target.value; store.setMcFavorites(sec, na) }} />
                <button className="btn ghost sm" title="Obriši" onClick={() => del(i)}><Icon.trash /></button>
              </div>
            ))}
          </div>
          <div className="fav-add">
            <input className="input" value={txt} onChange={e => setTxt(e.target.value)} placeholder={`Nova aktivnost za „${sec}"…`} onKeyDown={e => { if (e.key === 'Enter') add() }} />
            <button className="btn primary sm" disabled={!txt.trim()} onClick={add}><Icon.plus /> Dodaj</button>
          </div>
        </div>
      </div>
    </div>
  )
}
