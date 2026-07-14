import { useState, useRef, useMemo } from 'react'
import { shortName } from '../data/store'
import { posGroup, POS_COLORS } from '../data/seed'

// Startni rasporedi (y=0 gore/napad, y=100 dole/naš gol). Prvi element = golman.
export const FORMATIONS = {
  '4-3-3': [
    { x: 50, y: 92 },
    { x: 15, y: 70 }, { x: 38, y: 73 }, { x: 62, y: 73 }, { x: 85, y: 70 },
    { x: 30, y: 50 }, { x: 50, y: 52 }, { x: 70, y: 50 },
    { x: 18, y: 22 }, { x: 50, y: 17 }, { x: 82, y: 22 },
  ],
  '4-4-2': [
    { x: 50, y: 92 },
    { x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 },
    { x: 15, y: 48 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 85, y: 48 },
    { x: 38, y: 20 }, { x: 62, y: 20 },
  ],
  '4-2-3-1': [
    { x: 50, y: 92 },
    { x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 },
    { x: 38, y: 55 }, { x: 62, y: 55 },
    { x: 20, y: 35 }, { x: 50, y: 33 }, { x: 80, y: 35 },
    { x: 50, y: 16 },
  ],
  '3-5-2': [
    { x: 50, y: 92 },
    { x: 28, y: 72 }, { x: 50, y: 73 }, { x: 72, y: 72 },
    { x: 12, y: 52 }, { x: 35, y: 53 }, { x: 50, y: 55 }, { x: 65, y: 53 }, { x: 88, y: 52 },
    { x: 40, y: 20 }, { x: 60, y: 20 },
  ],
}

const MAX_OUT = 10   // igrača u polju (bez golmana)
const MAX_BENCH = 7
const GK_POS = { x: 50, y: 92 }
const GK_ZONE = 86   // y >= ovo = golmanova zona (polje ide samo do ovde)
const POS_RANK = { gk: 0, def: 1, mid: 2, att: 3 }
const grp = p => posGroup(p.pos) || '_'
const posRank = p => POS_RANK[grp(p)] ?? 9
const sortByPos = (a, b) => posRank(a) - posRank(b) || (a.number ?? 99) - (b.number ?? 99)
const GROUPS = [
  { key: 'gk', label: 'Golmani' }, { key: 'def', label: 'Odbrana' },
  { key: 'mid', label: 'Vezni red' }, { key: 'att', label: 'Napad' }, { key: '_', label: 'Ostalo' },
]
const cx = v => Math.max(5, Math.min(95, v))
const cyOut = v => Math.max(8, Math.min(GK_ZONE, v)) // polje ne ulazi u golmanovu zonu

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

  // Normalizacija: gkId (fiksni golman) + field (igrači u polju, bez golmana).
  const { gkId, field } = useMemo(() => {
    // stara verzija: positions={slotId:pid}
    if (!match.field && match.positions) {
      const SLOTS = FORMATIONS[formation]
      const OLD = {
        '4-3-3': ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lcm', 'cm', 'rcm', 'lw', 'st', 'rw'],
        '4-4-2': ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lm', 'lcm', 'rcm', 'rm', 'lst', 'rst'],
        '4-2-3-1': ['gk', 'lb', 'lcb', 'rcb', 'rb', 'ldm', 'rdm', 'lam', 'cam', 'ram', 'st'],
        '3-5-2': ['gk', 'lcb', 'ccb', 'rcb', 'lwb', 'lcm', 'cm', 'rcm', 'rwb', 'lst', 'rst'],
      }[formation] || []
      const pos = match.positions || {}; const f = {}; let gk = null
      OLD.forEach((slotId, i) => { const pid = pos[slotId]; if (!pid || !SLOTS[i]) return; if (slotId === 'gk') gk = pid; else f[pid] = { x: SLOTS[i].x, y: SLOTS[i].y } })
      return { gkId: gk, field: f }
    }
    const raw = { ...(match.field || {}) }
    let gk = match.gkId
    if (gk === undefined) { // izvuci golmana iz field-a (gk-pozicija ili najniži)
      const ids = Object.keys(raw)
      const low = arr => arr.reduce((b, id) => (!b || raw[id].y > raw[b].y ? id : b), null)
      const gks = ids.filter(id => posGroup(byId(id)?.pos) === 'gk')
      gk = gks.length ? low(gks) : (() => { const l = low(ids); return l && raw[l].y >= 82 ? l : null })()
    }
    if (gk && raw[gk]) delete raw[gk]
    return { gkId: gk || null, field: raw }
  }, [match.field, match.gkId, match.positions, formation])

  const outIds = Object.keys(field)
  const total = (gkId ? 1 : 0) + outIds.length
  const pool = players.filter(p => p.id !== gkId && !field[p.id] && !benchIds.includes(p.id)).sort(sortByPos)

  const save = (gk, f, b) => store.updateMatch(match.id, { gkId: gk, field: f, lineup: [gk, ...Object.keys(f)].filter(Boolean), benchIds: b })

  const OUT_FULL = `U polju može najviše ${MAX_OUT} (+ golman = 11).`
  const BFULL = `Klupa je puna (${MAX_BENCH}).`

  function setGk(pid) { setWarn(''); const nf = { ...field }; delete nf[pid]; save(pid, nf, benchIds.filter(b => b !== pid)) }
  function addOut(pid, x, y) {
    const nx = cx(x), ny = cyOut(y)
    if (field[pid]) { const nf = { ...field }; nf[pid] = { x: nx, y: ny }; save(gkId, nf, benchIds); setWarn(''); return }
    if (outIds.length >= MAX_OUT) { setWarn(OUT_FULL); return }
    setWarn(''); const nf = { ...field }; nf[pid] = { x: nx, y: ny }
    save(gkId === pid ? null : gkId, nf, benchIds.filter(b => b !== pid))
  }
  function addToBench(pid) {
    if (benchIds.includes(pid)) return
    if (benchIds.length >= MAX_BENCH) { setWarn(BFULL); return }
    setWarn(''); const nf = { ...field }; delete nf[pid]
    save(gkId === pid ? null : gkId, nf, [...benchIds, pid])
  }
  // ubaci/premesti igrača na klupu na poziciju `index` (reorder ako je već na klupi)
  function moveBench(pid, index) {
    if (benchIds.includes(pid)) { // reorder unutar klupe
      const without = benchIds.filter(b => b !== pid)
      const ni = Math.max(0, Math.min(without.length, index)); without.splice(ni, 0, pid)
      setWarn(''); save(gkId, field, without); return
    }
    if (benchIds.length >= MAX_BENCH) { setWarn(BFULL); return }
    setWarn(''); const nf = { ...field }; delete nf[pid]
    const nb = benchIds.slice(); const ni = Math.max(0, Math.min(nb.length, index)); nb.splice(ni, 0, pid)
    save(gkId === pid ? null : gkId, nf, nb)
  }
  function toPool(pid) { setWarn(''); const nf = { ...field }; delete nf[pid]; save(gkId === pid ? null : gkId, nf, benchIds.filter(b => b !== pid)) }

  function pitchXY(e) { const r = fieldRef.current.getBoundingClientRect(); return { x: ((e.clientX || 0) - r.left) / r.width * 100, y: ((e.clientY || 0) - r.top) / r.height * 100 } }
  function place(pid, x, y) { if (y >= GK_ZONE + 1) setGk(pid); else addOut(pid, x, y) }
  function onPitchClick(e) { if (!picked) return; const { x, y } = pitchXY(e); place(picked, x, y); setPicked(null) }
  function onPitchDrop(e) { e.preventDefault(); if (!dragId.current) return; const { x, y } = pitchXY(e); place(dragId.current, x, y); dragId.current = null; setPicked(null) }
  function clickOut(e, pid) {
    e.stopPropagation()
    if (picked && picked !== pid) {
      if (field[picked]) { const nf = { ...field }; const t = nf[pid]; nf[pid] = nf[picked]; nf[picked] = t; save(gkId, nf, benchIds) }
      else addOut(picked, cx(field[pid].x + 7), field[pid].y)
      setPicked(null)
    } else setPicked(picked === pid ? null : pid)
  }
  function clickGk() { if (picked) { setGk(picked); setPicked(null) } else setPicked(picked === gkId ? null : gkId) }

  function applyFormation(f) {
    const coords = FORMATIONS[f]
    const outs = outIds.map(byId).filter(Boolean).sort(sortByPos)
    const nf = {}
    outs.slice(0, coords.length - 1).forEach((p, i) => { nf[p.id] = { x: coords[i + 1].x, y: coords[i + 1].y } })
    store.updateMatch(match.id, { formation: f, gkId, field: nf, lineup: [gkId, ...Object.keys(nf)].filter(Boolean), benchIds })
    setPicked(null); setWarn('')
  }
  function fillField() {
    const coords = FORMATIONS[formation].slice(1)
    const nf = { ...field }; const taken = Object.values(nf)
    const freeC = coords.filter(c => !taken.some(t => Math.abs(t.x - c.x) < 1.5 && Math.abs(t.y - c.y) < 1.5))
    let ci = 0
    for (const p of pool) { if (ci >= freeC.length || Object.keys(nf).length >= MAX_OUT) break; nf[p.id] = { ...freeC[ci] }; ci++ }
    save(gkId, nf, benchIds); setWarn('')
  }

  const ql = q.trim().toLowerCase()
  const poolF = ql ? pool.filter(p => p.name.toLowerCase().includes(ql) || (p.pos || '').toLowerCase().includes(ql)) : pool
  const gkP = gkId && byId(gkId)

  return (
    <div>
      <div className="form-toolbar">
        <div className="form-formations">
          {Object.keys(FORMATIONS).map(f => (<button key={f} className={'chip' + (f === formation ? ' on' : '')} onClick={() => applyFormation(f)}>{f}</button>))}
        </div>
        <div style={{ flex: 1 }} />
        <span className={'pill ' + (total === 11 ? 'good' : 'blue')}>Teren {total}/11</span>
        <span className="pill warn">Klupa {benchIds.length}/{MAX_BENCH}</span>
        <button className="btn sm" onClick={() => setPhotos(p => !p)} title="Prikaz: dres/broj ili slika">{photos ? 'Prikaz: slike' : 'Prikaz: dres'}</button>
        <button className="btn sm" onClick={fillField}>Popuni</button>
      </div>
      {warn && <div className="field-warn">{warn}</div>}

      <div className="fb-layout">
        <div className="fb-left">
          <div className="pitch-field" ref={fieldRef} onClick={onPitchClick}
            onDragOver={e => e.preventDefault()} onDrop={onPitchDrop} style={{ cursor: picked ? 'copy' : 'default' }}>
            <FieldLines />
            {/* Golman — fiksno mesto */}
            <div className="token gk-token" style={{ left: GK_POS.x + '%', top: GK_POS.y + '%' }}
              onClick={e => { e.stopPropagation(); clickGk() }}>
              {gkP ? (<>
                <button className="token-x" title="Skloni golmana" onClick={e => { e.stopPropagation(); toPool(gkId) }}>×</button>
                <div className={'disc' + (picked === gkId ? ' picked' : '')} style={photos && gkP.photo ? { backgroundImage: `url(${gkP.photo})`, backgroundSize: 'cover', borderColor: POS_COLORS.gk } : { borderColor: POS_COLORS.gk }}>
                  {!(photos && gkP.photo) && (gkP.number ?? '')}
                </div>
                <div className="tname">{shortName(gkP.name)}<span className="tpos" style={{ color: POS_COLORS.gk }}> · GK</span></div>
              </>) : (<div className="slot-empty gk-slot">GK</div>)}
            </div>
            {/* Igrači u polju — slobodno */}
            {outIds.map(pid => {
              const p = byId(pid); if (!p) return null
              const c = field[pid]; const col = POS_COLORS[grp(p)] || '#1971C2'
              return (
                <div key={pid} className={'token' + (picked === pid ? ' picked' : '')} style={{ left: c.x + '%', top: c.y + '%' }}
                  draggable onDragStart={() => { dragId.current = pid }} onClick={e => clickOut(e, pid)}>
                  <button className="token-x" title="Skloni sa terena" onClick={e => { e.stopPropagation(); toPool(pid) }}>×</button>
                  <div className="disc" style={photos && p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', borderColor: col } : { borderColor: col }}>
                    {!(photos && p.photo) && (p.number ?? '')}
                  </div>
                  <div className="tname">{shortName(p.name)}{p.pos ? <span className="tpos" style={{ color: col }}> · {p.pos}</span> : null}</div>
                </div>
              )
            })}
            {picked && <div className="pitch-hint">Klikni gde da postaviš <b>{shortName(byId(picked)?.name || '')}</b> (dole = golman)</div>}
          </div>

          {/* Klupa — traka ispod terena */}
          <div className="bench-strip" onDragOver={e => e.preventDefault()} onDrop={() => { if (dragId.current) { moveBench(dragId.current, benchIds.length); dragId.current = null } }}>
            {Array.from({ length: MAX_BENCH }).map((_, i) => {
              const pid = benchIds[i]; const p = pid && byId(pid)
              return (
                <div key={i} className={'bslot' + (p ? ' filled' : '')}
                  onClick={() => { if (picked) { moveBench(picked, i); setPicked(null) } else if (p) setPicked(p.id) }}
                  onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); if (dragId.current) { moveBench(dragId.current, i); dragId.current = null } }}>
                  {p ? (
                    <div className={'bslot-p' + (picked === p.id ? ' picked' : '')} draggable onDragStart={() => { dragId.current = p.id }}>
                      <button className="bs-x" title="Nije pozvan" onClick={e => { e.stopPropagation(); toPool(p.id) }}>×</button>
                      <span className="bs-num" style={{ background: POS_COLORS[grp(p)] || '#868e96' }}>{p.number ?? '?'}</span>
                      <span className="bs-name">{shortName(p.name)}</span>
                    </div>
                  ) : <span className="bs-plus">+</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Nisu pozvani — desno, dve kolone */}
        <div className="fb-right">
          <div className="pool-h">Nisu pozvani <span className="pill blue">{pool.length}</span>
            <input className="input pool-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 traži…" />
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
                            onDragStart={() => { dragId.current = p.id }} onClick={() => setPicked(picked === p.id ? null : p.id)}
                            style={{ borderLeft: `4px solid ${col}` }}>
                            <span className="bi-num" style={{ background: col }}>{p.pos || '–'}</span>
                            <span className="bi-name">{shortName(p.name)}</span>
                            {p.number != null && p.number !== '' && <span className="bi-pos">#{p.number}</span>}
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
      </div>

      <p className="mock-note" style={{ marginTop: 10 }}>Golman ima <b>fiksno mesto</b> (dole). Ostalih 10 postavljaš slobodno — <b>prevuci</b> ili <b>klikni pa klikni</b> (radi i na telefonu); igrači iz polja idu najniže do ivice 16m. Klupa = traka ispod terena (do {MAX_BENCH}), „+" prazno mesto. Desno „nisu pozvani". „×" sklanja igrača.</p>
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
