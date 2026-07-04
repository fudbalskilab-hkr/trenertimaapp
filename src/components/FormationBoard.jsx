import { useState, useRef } from 'react'
import { shortName } from '../data/store'

// Slotovi po formaciji (vertikalni teren: y=0 gore/napad, y=100 dole/naš gol)
export const FORMATIONS = {
  '4-3-3': [
    { id: 'gk', x: 50, y: 90, lab: 'GK' },
    { id: 'lb', x: 15, y: 70, lab: 'LB' }, { id: 'lcb', x: 38, y: 73, lab: 'CB' }, { id: 'rcb', x: 62, y: 73, lab: 'CB' }, { id: 'rb', x: 85, y: 70, lab: 'RB' },
    { id: 'lcm', x: 30, y: 50, lab: 'CM' }, { id: 'cm', x: 50, y: 52, lab: 'CM' }, { id: 'rcm', x: 70, y: 50, lab: 'CM' },
    { id: 'lw', x: 18, y: 22, lab: 'LW' }, { id: 'st', x: 50, y: 17, lab: 'ST' }, { id: 'rw', x: 82, y: 22, lab: 'RW' },
  ],
  '4-4-2': [
    { id: 'gk', x: 50, y: 90, lab: 'GK' },
    { id: 'lb', x: 15, y: 70, lab: 'LB' }, { id: 'lcb', x: 38, y: 72, lab: 'CB' }, { id: 'rcb', x: 62, y: 72, lab: 'CB' }, { id: 'rb', x: 85, y: 70, lab: 'RB' },
    { id: 'lm', x: 15, y: 48, lab: 'LM' }, { id: 'lcm', x: 38, y: 50, lab: 'CM' }, { id: 'rcm', x: 62, y: 50, lab: 'CM' }, { id: 'rm', x: 85, y: 48, lab: 'RM' },
    { id: 'lst', x: 38, y: 20, lab: 'ST' }, { id: 'rst', x: 62, y: 20, lab: 'ST' },
  ],
  '4-2-3-1': [
    { id: 'gk', x: 50, y: 90, lab: 'GK' },
    { id: 'lb', x: 15, y: 70, lab: 'LB' }, { id: 'lcb', x: 38, y: 72, lab: 'CB' }, { id: 'rcb', x: 62, y: 72, lab: 'CB' }, { id: 'rb', x: 85, y: 70, lab: 'RB' },
    { id: 'ldm', x: 38, y: 55, lab: 'DM' }, { id: 'rdm', x: 62, y: 55, lab: 'DM' },
    { id: 'lam', x: 20, y: 35, lab: 'LM' }, { id: 'cam', x: 50, y: 33, lab: 'AM' }, { id: 'ram', x: 80, y: 35, lab: 'RM' },
    { id: 'st', x: 50, y: 16, lab: 'ST' },
  ],
  '3-5-2': [
    { id: 'gk', x: 50, y: 90, lab: 'GK' },
    { id: 'lcb', x: 28, y: 72, lab: 'CB' }, { id: 'ccb', x: 50, y: 73, lab: 'CB' }, { id: 'rcb', x: 72, y: 72, lab: 'CB' },
    { id: 'lwb', x: 12, y: 52, lab: 'LWB' }, { id: 'lcm', x: 35, y: 53, lab: 'CM' }, { id: 'cm', x: 50, y: 55, lab: 'CM' }, { id: 'rcm', x: 65, y: 53, lab: 'CM' }, { id: 'rwb', x: 88, y: 52, lab: 'RWB' },
    { id: 'lst', x: 40, y: 20, lab: 'ST' }, { id: 'rst', x: 60, y: 20, lab: 'ST' },
  ],
}

export default function FormationBoard({ match, players, store }) {
  const [picked, setPicked] = useState(null)
  const [photos, setPhotos] = useState(false)
  const dragId = useRef(null)

  const formation = match.formation || '4-3-3'
  const slots = FORMATIONS[formation]
  const positions = match.positions || {}
  const byId = id => players.find(p => p.id === id)
  const assigned = Object.values(positions)
  const bench = players.filter(p => !assigned.includes(p.id))

  const commit = np => store.updateMatch(match.id, { positions: np, lineup: Object.values(np) })

  // pomeri igrača na slot ili na klupu ('bench')
  function move(playerId, target) {
    const np = { ...positions }
    const fromSlot = Object.keys(np).find(k => np[k] === playerId)
    if (target === 'bench') { if (fromSlot) delete np[fromSlot]; commit(np); return }
    const occupant = np[target]
    if (fromSlot) { if (occupant) np[fromSlot] = occupant; else delete np[fromSlot] }
    np[target] = playerId
    commit(np)
  }

  function changeFormation(f) {
    const ordered = slots.map(s => positions[s.id]).filter(Boolean)
    const ns = FORMATIONS[f]; const np = {}
    ordered.forEach((pid, i) => { if (ns[i]) np[ns[i].id] = pid })
    store.updateMatch(match.id, { formation: f, positions: np, lineup: Object.values(np) })
    setPicked(null)
  }

  // klik logika
  function clickSlot(slotId) {
    const occ = positions[slotId]
    if (!picked) { if (occ) setPicked(occ); return }
    move(picked, slotId); setPicked(null)
  }
  function clickBench(pid) {
    if (!picked) { setPicked(pid); return }
    if (picked === pid) { setPicked(null); return }
    const pickedSlot = Object.keys(positions).find(k => positions[k] === picked)
    if (pickedSlot) { move(pid, pickedSlot); setPicked(null); return } // zameni: klupa ↔ postava
    setPicked(pid)
  }
  // drag
  const onDrop = target => { if (dragId.current) { move(dragId.current, target); dragId.current = null; setPicked(null) } }

  const autoFill = () => {
    const np = {}; const avail = players.slice()
    slots.forEach(s => { if (positions[s.id]) np[s.id] = positions[s.id] })
    const used = new Set(Object.values(np))
    slots.forEach(s => { if (!np[s.id]) { const p = avail.find(x => !used.has(x.id)); if (p) { np[s.id] = p.id; used.add(p.id) } } })
    commit(np)
  }

  return (
    <div>
      <div className="form-toolbar">
        <div className="form-formations">
          {Object.keys(FORMATIONS).map(f => (
            <button key={f} className={'chip' + (f === formation ? ' on' : '')} onClick={() => changeFormation(f)}>{f}</button>
          ))}
        </div>
        <div className="spacer" />
        <span className="pill blue">{assigned.length}/11</span>
        <button className="btn sm" onClick={() => setPhotos(p => !p)} title="Prikaz: dres/broj ili slika">
          {photos ? 'Prikaz: slike' : 'Prikaz: dres'}
        </button>
        <button className="btn sm" onClick={autoFill}>Popuni</button>
      </div>

      <div className="form-wrap">
        <div className="pitch-field">
          <FieldLines />
          {slots.map(s => {
            const pid = positions[s.id]; const p = pid && byId(pid)
            return (
              <div key={s.id} className="slot-pos" style={{ left: s.x + '%', top: s.y + '%' }}
                onClick={() => clickSlot(s.id)}
                onDragOver={e => e.preventDefault()} onDrop={() => onDrop(s.id)}>
                {p ? (
                  <div className={'token' + (picked === pid ? ' picked' : '')} draggable
                    onDragStart={() => { dragId.current = pid }}>
                    <div className="disc" style={photos && p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover' } : undefined}>
                      {!(photos && p.photo) && (p.number ?? '')}
                    </div>
                    <div className="tname">{shortName(p.name)}</div>
                  </div>
                ) : (
                  <div className="slot-empty">{s.lab}</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="bench" onDragOver={e => e.preventDefault()} onDrop={() => onDrop('bench')}>
          <div className="bench-h">Klupa <span className="pill blue" style={{ marginLeft: 'auto' }}>{bench.length}</span></div>
          <div className="bench-list">
            {bench.map(p => (
              <button key={p.id} className={'bench-item' + (picked === p.id ? ' picked' : '')} draggable
                onDragStart={() => { dragId.current = p.id }} onClick={() => clickBench(p.id)}>
                <span className="bi-num">{p.number ?? '?'}</span>
                <span className="bi-name">{shortName(p.name)}</span>
                {p.pos && <span className="bi-pos">{p.pos}</span>}
              </button>
            ))}
            {bench.length === 0 && <div className="empty" style={{ padding: 16 }}>Svi su u postavi.</div>}
          </div>
        </div>
      </div>
      <p className="mock-note" style={{ marginTop: 10 }}>Prevuci igrača (ili klikni pa klikni cilj) da ga postaviš/zameniš. Klupa je sa strane — prevlačenjem u postavu igrači se menjaju. „Prikaz" menja dres/broj ↔ slika.</p>
    </div>
  )
}

function FieldLines() {
  return (
    <svg className="field-lines" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="0.5">
        <rect x="2" y="2" width="96" height="146" />
        <line x1="2" y1="75" x2="98" y2="75" />
        <circle cx="50" cy="75" r="11" />
        <rect x="28" y="2" width="44" height="20" />
        <rect x="28" y="128" width="44" height="20" />
        <rect x="40" y="2" width="20" height="8" />
        <rect x="40" y="140" width="20" height="8" />
      </g>
    </svg>
  )
}
