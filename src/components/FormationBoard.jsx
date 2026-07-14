import { useState, useRef, useMemo } from 'react'
import { shortName } from '../data/store'
import { posGroup, POS_COLORS } from '../data/seed'

// Startni rasporedi (koordinate na terenu: y=0 gore/napad, y=100 dole/naš gol)
export const FORMATIONS = {
  '4-3-3': [
    { x: 50, y: 90 },
    { x: 15, y: 70 }, { x: 38, y: 73 }, { x: 62, y: 73 }, { x: 85, y: 70 },
    { x: 30, y: 50 }, { x: 50, y: 52 }, { x: 70, y: 50 },
    { x: 18, y: 22 }, { x: 50, y: 17 }, { x: 82, y: 22 },
  ],
  '4-4-2': [
    { x: 50, y: 90 },
    { x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 },
    { x: 15, y: 48 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 85, y: 48 },
    { x: 38, y: 20 }, { x: 62, y: 20 },
  ],
  '4-2-3-1': [
    { x: 50, y: 90 },
    { x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 },
    { x: 38, y: 55 }, { x: 62, y: 55 },
    { x: 20, y: 35 }, { x: 50, y: 33 }, { x: 80, y: 35 },
    { x: 50, y: 16 },
  ],
  '3-5-2': [
    { x: 50, y: 90 },
    { x: 28, y: 72 }, { x: 50, y: 73 }, { x: 72, y: 72 },
    { x: 12, y: 52 }, { x: 35, y: 53 }, { x: 50, y: 55 }, { x: 65, y: 53 }, { x: 88, y: 52 },
    { x: 40, y: 20 }, { x: 60, y: 20 },
  ],
}

const POS_RANK = { gk: 0, def: 1, mid: 2, att: 3 }
const grp = p => posGroup(p.pos) || '_'
const posRank = p => POS_RANK[grp(p)] ?? 9
const sortByPos = (a, b) => posRank(a) - posRank(b) || (a.number ?? 99) - (b.number ?? 99)
const GROUPS = [
  { key: 'gk', label: 'Golmani' }, { key: 'def', label: 'Odbrana' },
  { key: 'mid', label: 'Vezni red' }, { key: 'att', label: 'Napad' }, { key: '_', label: 'Ostalo' },
]
const clamp = v => Math.max(5, Math.min(95, v))

export default function FormationBoard({ match, players, store }) {
  const [picked, setPicked] = useState(null)
  const [photos, setPhotos] = useState(false)
  const [q, setQ] = useState('')
  const dragId = useRef(null)
  const fieldRef = useRef(null)

  const byId = id => players.find(p => p.id === id)
  const formation = match.formation || '4-3-3'

  // field = { pid: {x,y} }; migracija sa starog positions={slotId:pid}
  const field = useMemo(() => {
    if (match.field) return match.field
    const f = {}
    const SLOTS = FORMATIONS[formation]
    const OLD = { // stari slot id -> indeks u nizu koordinata
      '4-3-3': ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lcm', 'cm', 'rcm', 'lw', 'st', 'rw'],
      '4-4-2': ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lm', 'lcm', 'rcm', 'rm', 'lst', 'rst'],
      '4-2-3-1': ['gk', 'lb', 'lcb', 'rcb', 'rb', 'ldm', 'rdm', 'lam', 'cam', 'ram', 'st'],
      '3-5-2': ['gk', 'lcb', 'ccb', 'rcb', 'lwb', 'lcm', 'cm', 'rcm', 'rwb', 'lst', 'rst'],
    }[formation] || []
    const pos = match.positions || {}
    OLD.forEach((slotId, i) => { const pid = pos[slotId]; if (pid && SLOTS[i]) f[pid] = { x: SLOTS[i].x, y: SLOTS[i].y } })
    return f
  }, [match.field, match.positions, formation])

  const assignedIds = Object.keys(field)
  const commit = nf => store.updateMatch(match.id, { field: nf, lineup: Object.keys(nf) })

  const placeAt = (pid, x, y) => { const nf = { ...field }; nf[pid] = { x: clamp(x), y: clamp(y) }; commit(nf) }
  const toBench = pid => { const nf = { ...field }; delete nf[pid]; commit(nf) }

  function pitchXY(e) {
    const r = fieldRef.current.getBoundingClientRect()
    return { x: ((e.clientX || 0) - r.left) / r.width * 100, y: ((e.clientY || 0) - r.top) / r.height * 100 }
  }
  function onPitchClick(e) {
    if (!picked) return
    const { x, y } = pitchXY(e); placeAt(picked, x, y); setPicked(null)
  }
  function onPitchDrop(e) {
    e.preventDefault(); if (!dragId.current) return
    const { x, y } = pitchXY(e); placeAt(dragId.current, x, y); dragId.current = null; setPicked(null)
  }
  function clickToken(e, pid) {
    e.stopPropagation()
    if (picked && picked !== pid) {
      const nf = { ...field }
      if (nf[picked]) { // oba na terenu → zameni mesta
        const t = nf[pid]; nf[pid] = nf[picked]; nf[picked] = t
      } else { // pokupljen sa klupe → postavi ga pored, bez brisanja postojećeg
        nf[picked] = { x: clamp(field[pid].x + 7), y: clamp(field[pid].y) }
      }
      commit(nf); setPicked(null)
    } else setPicked(picked === pid ? null : pid)
  }

  // primeni startni raspored: postavljene igrače (pa dopuni sa klupe) rasporedi po koordinatama
  function applyFormation(f) {
    const coords = FORMATIONS[f]
    const placed = assignedIds.map(byId).filter(Boolean).sort(sortByPos)
    const nf = {}
    placed.slice(0, coords.length).forEach((p, i) => { nf[p.id] = { x: coords[i].x, y: coords[i].y } })
    store.updateMatch(match.id, { formation: f, field: nf, lineup: Object.keys(nf) })
    setPicked(null)
  }
  function fill() {
    const coords = FORMATIONS[formation]
    const nf = { ...field }
    const taken = Object.values(nf)
    const freeCoords = coords.filter(c => !taken.some(t => Math.abs(t.x - c.x) < 1.5 && Math.abs(t.y - c.y) < 1.5))
    const benchP = players.filter(p => !nf[p.id]).sort(sortByPos)
    let ci = 0
    for (const p of benchP) { if (ci >= freeCoords.length || Object.keys(nf).length >= 11) break; nf[p.id] = { ...freeCoords[ci] }; ci++ }
    commit(nf)
  }

  const bench = players.filter(p => !field[p.id])
  const ql = q.trim().toLowerCase()
  const benchF = ql ? bench.filter(p => p.name.toLowerCase().includes(ql) || (p.pos || '').toLowerCase().includes(ql)) : bench

  return (
    <div>
      <div className="form-toolbar">
        <div className="form-formations">
          {Object.keys(FORMATIONS).map(f => (
            <button key={f} className={'chip' + (f === formation ? ' on' : '')} onClick={() => applyFormation(f)}>{f}</button>
          ))}
        </div>
        <div className="spacer" />
        <span className="pill blue">{assignedIds.length}/11</span>
        <button className="btn sm" onClick={() => setPhotos(p => !p)} title="Prikaz: dres/broj ili slika">{photos ? 'Prikaz: slike' : 'Prikaz: dres'}</button>
        <button className="btn sm" onClick={fill}>Popuni</button>
      </div>

      <div className="form-wrap">
        <div className="pitch-field" ref={fieldRef} onClick={onPitchClick}
          onDragOver={e => e.preventDefault()} onDrop={onPitchDrop}
          style={{ cursor: picked ? 'copy' : 'default' }}>
          <FieldLines />
          {assignedIds.map(pid => {
            const p = byId(pid); if (!p) return null
            const c = field[pid]
            const col = POS_COLORS[grp(p)] || '#1971C2'
            return (
              <div key={pid} className={'token' + (picked === pid ? ' picked' : '')} style={{ left: c.x + '%', top: c.y + '%' }}
                draggable onDragStart={() => { dragId.current = pid }} onClick={e => clickToken(e, pid)}>
                <button className="token-x" title="Vrati na klupu" onClick={e => { e.stopPropagation(); toBench(pid) }}>×</button>
                <div className="disc" style={photos && p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', borderColor: col } : { borderColor: col }}>
                  {!(photos && p.photo) && (p.number ?? '')}
                </div>
                <div className="tname">{shortName(p.name)}{p.pos ? <span className="tpos" style={{ color: col }}> · {p.pos}</span> : null}</div>
              </div>
            )
          })}
          {picked && <div className="pitch-hint">Klikni gde da postaviš <b>{shortName(byId(picked)?.name || '')}</b></div>}
        </div>

        <div className="bench" onDragOver={e => e.preventDefault()}
          onDrop={() => { if (dragId.current) { toBench(dragId.current); dragId.current = null } }}>
          <div className="bench-h">Klupa <span className="pill blue" style={{ marginLeft: 'auto' }}>{bench.length}</span></div>
          <div className="bench-search">
            <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 traži igrača…" />
          </div>
          <div className="bench-list">
            {bench.length === 0 && <div className="empty" style={{ padding: 16 }}>Svi su u postavi.</div>}
            {GROUPS.map(g => {
              const list = benchF.filter(p => grp(p) === g.key).sort(sortByPos)
              if (list.length === 0) return null
              return (
                <div className="bench-group" key={g.key}>
                  <div className="bench-group-h"><span className="bg-dot" style={{ background: POS_COLORS[g.key] || '#adb5bd' }} />{g.label} <span className="bg-n">{list.length}</span></div>
                  {list.map(p => {
                    const col = POS_COLORS[grp(p)] || '#868e96'
                    return (
                      <button key={p.id} className={'bench-item' + (picked === p.id ? ' picked' : '')} draggable
                        onDragStart={() => { dragId.current = p.id }}
                        onClick={() => setPicked(picked === p.id ? null : p.id)}
                        style={{ borderLeft: `4px solid ${col}` }}>
                        <span className="bi-num" style={{ background: col }}>{p.number ?? '?'}</span>
                        <span className="bi-name">{shortName(p.name)}</span>
                        {p.pos && <span className="bi-pos">{p.pos}</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
            {ql && benchF.length === 0 && bench.length > 0 && <div className="empty" style={{ padding: 12 }}>Nema rezultata za „{q}".</div>}
          </div>
        </div>
      </div>
      <p className="mock-note" style={{ marginTop: 10 }}>Postavi igrača gde god hoćeš: <b>prevuci</b> na teren, ili <b>klikni igrača pa klikni mesto</b> na terenu (radi i na telefonu). Dva igrača na terenu → klik na jednog pa na drugog = zamena mesta. „×" na igraču vraća ga na klupu. Formacija = brzi početni raspored.</p>
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
