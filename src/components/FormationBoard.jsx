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

const MAX_FIELD = 11
const MAX_BENCH = 7
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
  const [warn, setWarn] = useState('')
  const dragId = useRef(null)
  const fieldRef = useRef(null)

  const byId = id => players.find(p => p.id === id)
  const formation = match.formation || '4-3-3'
  const benchIds = match.benchIds || []

  // field = { pid: {x,y} }; migracija sa starog positions={slotId:pid}
  const field = useMemo(() => {
    if (match.field) return match.field
    const f = {}
    const SLOTS = FORMATIONS[formation]
    const OLD = {
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
  const pool = players.filter(p => !field[p.id] && !benchIds.includes(p.id)).sort(sortByPos)

  const save = (nf, nb) => store.updateMatch(match.id, { field: nf, lineup: Object.keys(nf), benchIds: nb })
  const commit = nf => save(nf, benchIds)

  const FULL = `Na terenu mora biti tačno ${MAX_FIELD} — prvo skloni nekog (× na igraču).`
  const BFULL = `Klupa je puna (${MAX_BENCH}).`

  function addToField(pid, x, y) {
    if (field[pid]) { const nf = { ...field }; nf[pid] = { x: clamp(x), y: clamp(y) }; commit(nf); setWarn(''); return }
    if (assignedIds.length >= MAX_FIELD) { setWarn(FULL); return }
    setWarn('')
    const nf = { ...field }; nf[pid] = { x: clamp(x), y: clamp(y) }
    save(nf, benchIds.filter(b => b !== pid))
  }
  function addToBench(pid) {
    if (benchIds.includes(pid)) return
    if (benchIds.length >= MAX_BENCH) { setWarn(BFULL); return }
    setWarn('')
    const nf = { ...field }; delete nf[pid]
    save(nf, [...benchIds, pid])
  }
  function toPool(pid) {
    setWarn('')
    const nf = { ...field }; delete nf[pid]
    save(nf, benchIds.filter(b => b !== pid))
  }

  function pitchXY(e) {
    const r = fieldRef.current.getBoundingClientRect()
    return { x: ((e.clientX || 0) - r.left) / r.width * 100, y: ((e.clientY || 0) - r.top) / r.height * 100 }
  }
  function onPitchClick(e) { if (!picked) return; const { x, y } = pitchXY(e); addToField(picked, x, y); setPicked(null) }
  function onPitchDrop(e) { e.preventDefault(); if (!dragId.current) return; const { x, y } = pitchXY(e); addToField(dragId.current, x, y); dragId.current = null; setPicked(null) }
  function clickToken(e, pid) {
    e.stopPropagation()
    if (picked && picked !== pid) {
      if (field[picked]) { const nf = { ...field }; const t = nf[pid]; nf[pid] = nf[picked]; nf[picked] = t; commit(nf) }
      else addToField(picked, clamp(field[pid].x + 7), field[pid].y)
      setPicked(null)
    } else setPicked(picked === pid ? null : pid)
  }

  function applyFormation(f) {
    const coords = FORMATIONS[f]
    const placed = assignedIds.map(byId).filter(Boolean).sort(sortByPos)
    const nf = {}
    placed.slice(0, coords.length).forEach((p, i) => { nf[p.id] = { x: coords[i].x, y: coords[i].y } })
    store.updateMatch(match.id, { formation: f, field: nf, lineup: Object.keys(nf), benchIds })
    setPicked(null); setWarn('')
  }
  function fillField() {
    const coords = FORMATIONS[formation]
    const nf = { ...field }
    const taken = Object.values(nf)
    const freeCoords = coords.filter(c => !taken.some(t => Math.abs(t.x - c.x) < 1.5 && Math.abs(t.y - c.y) < 1.5))
    let ci = 0
    for (const p of pool) { if (ci >= freeCoords.length || Object.keys(nf).length >= MAX_FIELD) break; nf[p.id] = { ...freeCoords[ci] }; ci++ }
    commit(nf); setWarn('')
  }

  const ql = q.trim().toLowerCase()
  const poolF = ql ? pool.filter(p => p.name.toLowerCase().includes(ql) || (p.pos || '').toLowerCase().includes(ql)) : pool

  return (
    <div>
      <div className="form-toolbar">
        <div className="form-formations">
          {Object.keys(FORMATIONS).map(f => (
            <button key={f} className={'chip' + (f === formation ? ' on' : '')} onClick={() => applyFormation(f)}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span className={'pill ' + (assignedIds.length === MAX_FIELD ? 'good' : 'blue')}>Teren {assignedIds.length}/{MAX_FIELD}</span>
        <span className="pill warn">Klupa {benchIds.length}/{MAX_BENCH}</span>
        <button className="btn sm" onClick={() => setPhotos(p => !p)} title="Prikaz: dres/broj ili slika">{photos ? 'Prikaz: slike' : 'Prikaz: dres'}</button>
        <button className="btn sm" onClick={fillField}>Popuni</button>
      </div>
      {warn && <div className="field-warn">{warn}</div>}

      <div className="pitch-and-bench">
        <div className="pitch-field" ref={fieldRef} onClick={onPitchClick}
          onDragOver={e => e.preventDefault()} onDrop={onPitchDrop} style={{ cursor: picked ? 'copy' : 'default' }}>
          <FieldLines />
          {assignedIds.map(pid => {
            const p = byId(pid); if (!p) return null
            const c = field[pid]; const col = POS_COLORS[grp(p)] || '#1971C2'
            return (
              <div key={pid} className={'token' + (picked === pid ? ' picked' : '')} style={{ left: c.x + '%', top: c.y + '%' }}
                draggable onDragStart={() => { dragId.current = pid }} onClick={e => clickToken(e, pid)}>
                <button className="token-x" title="Skloni sa terena" onClick={e => { e.stopPropagation(); toPool(pid) }}>×</button>
                <div className="disc" style={photos && p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', borderColor: col } : { borderColor: col }}>
                  {!(photos && p.photo) && (p.number ?? '')}
                </div>
                <div className="tname">{shortName(p.name)}{p.pos ? <span className="tpos" style={{ color: col }}> · {p.pos}</span> : null}</div>
              </div>
            )
          })}
          {picked && <div className="pitch-hint">Klikni gde da postaviš <b>{shortName(byId(picked)?.name || '')}</b></div>}
        </div>

        <div className="chairs" onDragOver={e => e.preventDefault()} onDrop={() => { if (dragId.current) { addToBench(dragId.current); dragId.current = null } }}>
          <div className="chairs-h">Klupa <span className="pill warn" style={{ marginLeft: 'auto' }}>{benchIds.length}/{MAX_BENCH}</span></div>
          {Array.from({ length: MAX_BENCH }).map((_, i) => {
            const pid = benchIds[i]; const p = pid && byId(pid)
            return (
              <div key={i} className={'chair' + (p ? ' filled' : '')}
                onClick={() => { if (picked) { addToBench(picked); setPicked(null) } else if (p) setPicked(p.id) }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.stopPropagation(); if (dragId.current) { addToBench(dragId.current); dragId.current = null } }}>
                {p ? (
                  <div className={'chair-p' + (picked === p.id ? ' picked' : '')} draggable onDragStart={() => { dragId.current = p.id }}>
                    <span className="ch-num" style={{ background: POS_COLORS[grp(p)] || '#868e96' }}>{p.number ?? '?'}</span>
                    <span className="ch-name">{shortName(p.name)}</span>
                    {p.pos && <span className="ch-pos">{p.pos}</span>}
                    <button className="ch-x" title="Nije pozvan" onClick={e => { e.stopPropagation(); toPool(p.id) }}>×</button>
                  </div>
                ) : <span className="chair-empty">🪑 stolica</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="pool">
        <div className="pool-h">Nisu pozvani <span className="pill blue">{pool.length}</span>
          <input className="input pool-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 traži igrača…" />
        </div>
        <div className="bench-list two-col">
          {pool.length === 0 && <div className="empty" style={{ gridColumn: '1/-1', padding: 16 }}>Svi igrači su raspoređeni.</div>}
          {[['gk', 'def'], ['mid', 'att', '_']].map((colKeys, ci) => (
            <div className="bench-col" key={ci}>
              {colKeys.map(gk => {
                const g = GROUPS.find(x => x.key === gk)
                const list = poolF.filter(p => grp(p) === gk).sort(sortByPos)
                if (list.length === 0) return null
                return (
                  <div className="bench-group" key={gk}>
                    <div className="bench-group-h"><span className="bg-dot" style={{ background: POS_COLORS[gk] || '#adb5bd' }} />{g.label} <span className="bg-n">{list.length}</span></div>
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
            </div>
          ))}
          {ql && poolF.length === 0 && pool.length > 0 && <div className="empty" style={{ gridColumn: '1/-1', padding: 12 }}>Nema rezultata za „{q}".</div>}
        </div>
      </div>

      <p className="mock-note" style={{ marginTop: 10 }}>Teren = <b>tačno {MAX_FIELD}</b>, klupa = do <b>{MAX_BENCH}</b> (žute stolice), ostali „nisu pozvani". Postavi igrača: <b>prevuci</b> ga (na teren, stolicu ili nazad dole), ili <b>klikni pa klikni cilj</b> (radi i na telefonu). Dva na terenu → klik‑klik = zamena mesta. „×" sklanja igrača. Formacija = brzi početni raspored.</p>
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
