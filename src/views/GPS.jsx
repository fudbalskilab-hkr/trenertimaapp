import { useState, useRef } from 'react'
import { useStore, fmtDate, shortName } from '../data/store'
import { GPS_METRICS } from '../data/seed'
import { Icon } from '../components/Icons'

const SERIES = ['#1656B0', '#E8862B', '#1E9E6A', '#C0392B']
const MODES = [
  { key: 'last', label: 'Poslednja utakmica' },
  { key: 'last5', label: 'Prosek — poslednjih 5' },
  { key: 'perMatch', label: 'Po utakmici (5)' },
]
const fmt = (v, key) => v == null ? '—' : (key === 'topSpeed' ? v.toFixed(1) : Math.round(v).toLocaleString('sr'))

export default function GPS() {
  const store = useStore()
  const { matches, players, gps } = store
  const [metric, setMetric] = useState('td')
  const [mode, setMode] = useState('last')      // last | last5
  const [sel, setSel] = useState([])            // izabrani za poređenje (0–4)
  const [entry, setEntry] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  const metricMeta = GPS_METRICS.find(m => m.key === metric)
  const gpsMatches = matches.filter(m => gps[m.id] && Object.keys(gps[m.id]).length).sort((a, b) => (a.date < b.date ? 1 : -1))
  const last5 = gpsMatches.slice(0, 5)
  const lastMatch = gpsMatches[0]
  const gpsIds = new Set(); gpsMatches.forEach(m => Object.keys(gps[m.id]).forEach(pid => gpsIds.add(pid)))
  const gpsPlayers = players.filter(p => gpsIds.has(p.id))

  const valueOf = (pid, key, m) => (gps[m?.id]?.[pid] || {})[key]
  const agg = (pid, key, which) => {
    if (which === 'last') return valueOf(pid, key, lastMatch)
    const v = last5.map(m => valueOf(pid, key, m)).filter(x => x != null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }
  const metricValue = (pid, key) => agg(pid, key, mode)
  const toggle = pid => setSel(cur => cur.includes(pid) ? cur.filter(x => x !== pid) : (cur.length >= 4 ? cur : [...cur, pid]))

  const hasDemo = matches.some(m => String(m.id).startsWith('demo'))
  const buttons = (
    <>
      {hasDemo && <button className="btn ghost sm" onClick={() => store.removeDemoGps()}>Ukloni demo</button>}
      <button className="btn sm" onClick={() => setImportOpen(true)}><Icon.upload /> Uvezi CSV</button>
      <button className="btn primary sm" onClick={() => setEntry({ matchId: lastMatch?.id })}><Icon.plus /> Unesi ručno</button>
    </>
  )

  if (gpsPlayers.length === 0) {
    return (
      <section>
        <div className="sec-title"><h2>Catapult GPS — fizičke performanse</h2><span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{buttons}</span></div>
        <div className="card"><div className="empty" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <span>Još nema GPS podataka.</span>
          {store.players.length > 0
            ? <button className="btn primary" onClick={() => store.loadDemoGps()}>Dodaj demo GPS (za tvoje igrače)</button>
            : <span style={{ fontSize: 13 }}>Prvo dodaj igrače u tabu „Igrači".</span>}
          <span style={{ fontSize: 12, color: 'var(--grey)' }}>Ovo SAMO dodaje demo GPS za postojeće igrače — ništa ne briše. Ili „Unesi ručno" / „Uvezi CSV" za svoje.</span>
        </div></div>
        {entry && <GpsEntry matches={gpsMatches.length ? gpsMatches : matches} players={players} gps={gps} initial={entry} onClose={() => setEntry(null)} onSave={(mid, pid, m) => { store.setGps(mid, pid, m); setEntry(null) }} />}
        {importOpen && <GpsImport allMatches={matches} players={players} store={store} onClose={() => setImportOpen(false)} />}
      </section>
    )
  }

  // rangiranje za tabelu (po izabranoj metrici, opadajuće)
  const ranked = [...gpsPlayers].sort((a, b) => (metricValue(b.id, metric) || 0) - (metricValue(a.id, metric) || 0))
  const maxForBar = Math.max(1, ...sel.map(pid => metricValue(pid, metric) || 0))

  return (
    <section>
      <div className="sec-title"><h2>Catapult GPS — fizičke performanse</h2><span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{buttons}</span></div>

      {/* metrika + mod */}
      <div className="filters">
        {GPS_METRICS.map(m => <button key={m.key} className={'chip' + (m.key === metric ? ' on' : '')} onClick={() => setMetric(m.key)}>{m.short}</button>)}
      </div>
      <div className="filters">
        <button className={'chip' + (mode === 'last' ? ' on' : '')} onClick={() => setMode('last')}>Poslednja utakmica</button>
        <button className={'chip' + (mode === 'last5' ? ' on' : '')} onClick={() => setMode('last5')}>Prosek — poslednjih 5</button>
        <span style={{ alignSelf: 'center', marginLeft: 'auto', fontSize: 12, color: 'var(--grey)' }}>
          {mode === 'last' ? (lastMatch ? 'vs ' + lastMatch.opp : '') : `${last5.length} mečeva`}
        </span>
      </div>

      {/* poređenje izabranih (opciono) */}
      {sel.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h3>Poređenje — {metricMeta.label} {metricMeta.unit && <span className="foot-l">({metricMeta.unit})</span>}</h3>
            <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => setSel([])}>Poništi izbor</button></div>
          <div className="card-b">
            <div className="cmp-bars">
              {sel.map((pid, i) => {
                const p = players.find(x => x.id === pid); const v = metricValue(pid, metric)
                return (
                  <div className="cmp-row" key={pid}>
                    <div className="cmp-name">{p ? shortName(p.name) : pid}</div>
                    <div className="cmp-track"><div className="cmp-fill" style={{ width: ((v || 0) / maxForBar * 100) + '%', background: SERIES[i] }} /></div>
                    <div className="cmp-val num">{fmt(v, metric)}<span className="unit">{metricMeta.unit}</span></div>
                  </div>
                )
              })}
            </div>
            {/* poslednjih 5 po utakmici */}
            <div style={{ marginTop: 8 }}>
              {sel.map((pid, i) => {
                const p = players.find(x => x.id === pid)
                const series = [...last5].reverse().map(m => ({ m, v: valueOf(pid, metric, m) }))
                const mx = Math.max(1, ...series.map(s => s.v || 0))
                return (
                  <div className="pm-block" key={pid}>
                    <div className="pm-name"><span className="gp-dot" style={{ background: SERIES[i] }} />{p ? shortName(p.name) : pid} <span className="foot-l">— poslednjih {series.length}</span></div>
                    <div className="pm-bars">
                      {series.map((s, k) => (
                        <div className="pm-col" key={k} title={`vs ${s.m.opp}: ${fmt(s.v, metric)} ${metricMeta.unit}`}>
                          <div className="pm-bar-track"><div className="pm-bar" style={{ height: ((s.v || 0) / mx * 100) + '%', background: SERIES[i] }} /></div>
                          <div className="pm-x">{s.m.opp.slice(0, 6)}</div>
                          <div className="pm-v num">{fmt(s.v, metric)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* SVI IGRAČI */}
      <div className="card">
        <div className="card-h"><h3>Svi igrači — {mode === 'last' ? 'poslednja utakmica' : 'prosek 5'}</h3>
          <span className="pill blue" style={{ marginLeft: 'auto' }}>čekiraj do 4 za poređenje ({sel.length}/4)</span></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th></th><th>#</th><th>Igrač</th>
              {GPS_METRICS.map(m => <th key={m.key} style={m.key === metric ? { color: 'var(--blue-600)' } : undefined}>{m.short}</th>)}
            </tr></thead>
            <tbody>
              {ranked.map(p => {
                const on = sel.includes(p.id); const idx = sel.indexOf(p.id)
                return (
                  <tr key={p.id} onClick={() => toggle(p.id)} style={on ? { background: 'var(--blue-100)' } : undefined}>
                    <td><input type="checkbox" checked={on} readOnly style={{ accentColor: on ? SERIES[idx] : undefined, pointerEvents: 'none' }} /></td>
                    <td className="rownum">{p.number ?? '—'}</td>
                    <td><b>{shortName(p.name)}</b></td>
                    {GPS_METRICS.map(m => (
                      <td key={m.key} className="num" style={m.key === metric ? { fontWeight: 800 } : undefined}>{fmt(metricValue(p.id, m.key), m.key)}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mock-note" style={{ marginTop: 14 }}>Klik na igrača (ili čekiraj) da ga dodaš u poređenje — do 4 odjednom. „Uvezi CSV" iz Catapult-a ili „Unesi ručno".</p>

      {entry && <GpsEntry matches={gpsMatches} players={gpsPlayers} gps={gps} initial={entry} onClose={() => setEntry(null)}
        onSave={(mid, pid, metrics) => { store.setGps(mid, pid, metrics); setEntry(null) }} />}
      {importOpen && <GpsImport allMatches={matches} players={players} store={store} onClose={() => setImportOpen(false)} />}
    </section>
  )
}

// ===== CSV uvoz (Catapult export) =====
const HEADER_RULES = [
  ['name', h => /player|athlete|name|ime|prezime/.test(h)],
  ['td', h => /total\s*dist|ukupn.*dist|(^|[^a-z])td([^a-z]|$)/.test(h)],
  ['hsr', h => /hsr|high\s*speed/.test(h)],
  ['sprintDist', h => /sprint.*dist/.test(h)],
  ['sprints', h => /sprint/.test(h)],
  ['topSpeed', h => /max\s*vel|top\s*speed|max\s*speed|top\s*brzina|maks/.test(h)],
  ['acc', h => /accel|ubrz|(^|[^a-z])acc([^a-z]|$)/.test(h)],
  ['dcc', h => /decel|koč|koc|(^|[^a-z])dcc([^a-z]|$)|(^|[^a-z])dec([^a-z]|$)/.test(h)],
]
function detectDelim(line) { return (line.split(';').length > line.split(',').length) ? ';' : ',' }
function splitLine(line, d) { return line.split(d).map(c => c.trim().replace(/^"|"$/g, '')) }
function norm(s) { return (s || '').toLowerCase().replace(/\s+/g, ' ').trim() }
function nameMatch(csvName, playerName) {
  const a = norm(csvName), b = norm(playerName)
  if (!a || !b) return false
  if (a === b) return true
  const at = a.split(' '), bt = b.split(' ')
  const short = at.length <= bt.length ? at : bt, long = at.length <= bt.length ? b : a
  return short.every(t => t.length > 1 && long.includes(t))
}

function GpsImport({ allMatches, players, store, onClose }) {
  const [mid, setMid] = useState(allMatches[0]?.id)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result).replace(/\r/g, '')
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) { setResult({ error: 'Fajl je prazan ili nema redova.' }); return }
        const d = detectDelim(lines[0])
        const headers = splitLine(lines[0], d)
        // mapiraj kolone -> metrike
        const colMap = {}
        headers.forEach((h, i) => {
          const hn = norm(h)
          for (const [key, test] of HEADER_RULES) {
            if (colMap[key] == null && test(hn)) { colMap[key] = i; break }
          }
        })
        if (colMap.name == null) { setResult({ error: 'Nije prepoznata kolona sa imenom igrača.' }); return }
        let matched = 0; const unknown = []
        const foundMetrics = Object.keys(colMap).filter(k => k !== 'name')
        lines.slice(1).forEach(line => {
          const cells = splitLine(line, d)
          const csvName = cells[colMap.name]
          if (!csvName) return
          const p = players.find(pp => nameMatch(csvName, pp.name))
          if (!p) { unknown.push(csvName); return }
          const metrics = {}
          foundMetrics.forEach(k => {
            const raw = cells[colMap[k]]
            if (raw != null && raw !== '') {
              let s = String(raw).replace(/\s/g, '')
              if (d === ';') s = s.replace(/\./g, '').replace(',', '.') // EU format: . hiljade, , decimala
              const num = parseFloat(s)
              if (!isNaN(num)) metrics[k] = num
            }
          })
          if (Object.keys(metrics).length) { store.setGps(mid, p.id, metrics); matched++ }
        })
        setResult({ matched, unknown, metrics: foundMetrics })
      } catch (err) {
        setResult({ error: 'Greška pri čitanju fajla: ' + err.message })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Uvoz GPS podataka (CSV)</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Za koju utakmicu</label>
            <select className="input" value={mid} onChange={e => { setMid(e.target.value); setResult(null) }}>
              {allMatches.map(m => <option key={m.id} value={m.id}>vs {m.opp} ({fmtDate(m.date)})</option>)}
            </select></div>
          <button className="btn primary" onClick={() => fileRef.current.click()} style={{ width: '100%', justifyContent: 'center' }}><Icon.upload /> Izaberi CSV fajl</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={handleFile} />
          {result && (
            <div style={{ marginTop: 14 }}>
              {result.error
                ? <div className="pill bad" style={{ display: 'block', padding: 10 }}>{result.error}</div>
                : <>
                  <div className="pill good" style={{ display: 'inline-block' }}>Uvezeno za {result.matched} igrača</div>
                  <p className="mock-note" style={{ marginTop: 8 }}>Prepoznate metrike: {result.metrics.map(k => (GPS_METRICS.find(m => m.key === k) || {}).short).join(', ') || '—'}</p>
                  {result.unknown?.length > 0 && <p className="mock-note">Nije prepoznato {result.unknown.length}: {result.unknown.slice(0, 5).join(', ')}{result.unknown.length > 5 ? '…' : ''} (proveri da se imena poklapaju sa spiskom igrača)</p>}
                </>}
            </div>
          )}
          <p className="mock-note" style={{ marginTop: 14 }}>Izvezi izveštaj iz Catapult-a (OpenField) kao CSV pa ga ubaci ovde — kolone (Player, Total Distance, HSR, Sprints, Max Velocity, Accel, Decel…) se prepoznaju automatski. Direktna veza sa uređajem uživo nije moguća iz web aplikacije.</p>
        </div>
        <div className="modal-f"><button className="btn primary" onClick={onClose}>Gotovo</button></div>
      </div>
    </div>
  )
}

function GpsEntry({ matches, players, gps, initial, onClose, onSave }) {
  const [mid, setMid] = useState(initial.matchId || matches[0]?.id)
  const [pid, setPid] = useState(players[0]?.id)
  const cur = (gps[mid] || {})[pid] || {}
  const [f, setF] = useState(cur)
  // reset kad se promeni igrač/meč
  const key = mid + pid
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) { setLastKey(key); setF((gps[mid] || {})[pid] || {}) }
  const set = (k, v) => setF(s => ({ ...s, [k]: v === '' ? undefined : Number(v) }))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Unos GPS podataka</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="row2">
            <div className="field"><label>Utakmica</label><select className="input" value={mid} onChange={e => setMid(e.target.value)}>{matches.map(m => <option key={m.id} value={m.id}>vs {m.opp} ({fmtDate(m.date)})</option>)}</select></div>
            <div className="field"><label>Igrač</label><select className="input" value={pid} onChange={e => setPid(e.target.value)}>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          {GPS_METRICS.map(mm => (
            <div className="field" key={mm.key}><label>{mm.label} {mm.unit && `(${mm.unit})`}</label>
              <input className="input" inputMode="decimal" value={f[mm.key] ?? ''} onChange={e => set(mm.key, e.target.value)} /></div>
          ))}
        </div>
        <div className="modal-f"><button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" onClick={() => onSave(mid, pid, f)}>Sačuvaj</button></div>
      </div>
    </div>
  )
}
