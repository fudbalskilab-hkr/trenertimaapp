import { useState } from 'react'
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
  const [mode, setMode] = useState('last')
  const [sel, setSel] = useState([])
  const [entry, setEntry] = useState(null)

  const metricMeta = GPS_METRICS.find(m => m.key === metric)
  const gpsMatches = matches.filter(m => gps[m.id] && Object.keys(gps[m.id]).length)
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // najnovije prvo
  const last5 = gpsMatches.slice(0, 5)
  const lastMatch = gpsMatches[0]

  // igrači koji imaju bar neki GPS
  const gpsPlayerIds = new Set()
  gpsMatches.forEach(m => Object.keys(gps[m.id]).forEach(pid => gpsPlayerIds.add(pid)))
  const gpsPlayers = players.filter(p => gpsPlayerIds.has(p.id))

  // default: prva 2
  if (sel.length === 0 && gpsPlayers.length >= 2) {
    // lazy init bez set-a u renderu -> koristi fallback prikaz
  }
  const selected = sel.length ? sel : gpsPlayers.slice(0, 2).map(p => p.id)

  function toggle(pid) {
    setSel(cur => {
      const base = cur.length ? cur : gpsPlayers.slice(0, 2).map(p => p.id)
      if (base.includes(pid)) return base.filter(x => x !== pid)
      if (base.length >= 4) return base
      return [...base, pid]
    })
  }

  const valueOf = (pid, key, m) => (gps[m?.id]?.[pid] || {})[key]
  function metricValue(pid, key) {
    if (mode === 'last') return valueOf(pid, key, lastMatch)
    // prosek 5
    const vals = last5.map(m => valueOf(pid, key, m)).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const maxForBar = Math.max(1, ...selected.map(pid => metricValue(pid, metric) || 0))

  return (
    <section>
      <div className="sec-title"><h2>Catapult GPS — fizičke performanse</h2>
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => setEntry({ matchId: lastMatch?.id })}><Icon.plus /> Unesi GPS</button>
      </div>

      {/* metrika */}
      <div className="filters">
        {GPS_METRICS.map(m => (
          <button key={m.key} className={'chip' + (m.key === metric ? ' on' : '')} onClick={() => setMetric(m.key)}>{m.short}</button>
        ))}
      </div>

      {/* izbor igrača (max 4) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h"><h3>Izaberi igrače za poređenje</h3><span className="pill blue" style={{ marginLeft: 'auto' }}>{selected.length}/4</span></div>
        <div className="card-b">
          <div className="gps-players">
            {gpsPlayers.map(p => {
              const on = selected.includes(p.id)
              const idx = selected.indexOf(p.id)
              return (
                <button key={p.id} className={'gp-chip' + (on ? ' on' : '')} onClick={() => toggle(p.id)}
                  style={on ? { borderColor: SERIES[idx], boxShadow: `inset 0 0 0 1px ${SERIES[idx]}` } : undefined}>
                  {on && <span className="gp-dot" style={{ background: SERIES[idx] }} />}
                  <span className="bi-num">{p.number ?? '?'}</span>{shortName(p.name)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* mod */}
      <div className="filters">
        {MODES.map(m => (
          <button key={m.key} className={'chip' + (m.key === mode ? ' on' : '')} onClick={() => setMode(m.key)}>{m.label}</button>
        ))}
      </div>

      {/* prikaz */}
      {mode !== 'perMatch' ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-h"><h3>{metricMeta.label} {metricMeta.unit && <span className="foot-l">({metricMeta.unit})</span>}</h3>
              <span className="pill blue" style={{ marginLeft: 'auto' }}>{mode === 'last' ? (lastMatch ? 'vs ' + lastMatch.opp : '—') : 'prosek 5 mečeva'}</span></div>
            <div className="card-b">
              <div className="cmp-bars">
                {selected.map((pid, i) => {
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
            </div>
          </div>

          {/* tabela svih metrika */}
          <div className="card">
            <div className="card-h"><h3>Sve metrike — poređenje</h3></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Metrika</th>
                  {selected.map((pid, i) => { const p = players.find(x => x.id === pid); return <th key={pid} style={{ color: SERIES[i] }}>{p ? shortName(p.name) : pid}</th> })}
                </tr></thead>
                <tbody>
                  {GPS_METRICS.map(mm => {
                    const vals = selected.map(pid => metricValue(pid, mm.key))
                    const best = Math.max(...vals.map(v => v || 0))
                    return (
                      <tr key={mm.key} style={{ cursor: 'default' }}>
                        <td><b>{mm.short}</b> <span className="foot-l">{mm.unit}</span></td>
                        {vals.map((v, i) => (
                          <td key={i} className="num" style={{ fontWeight: v != null && v === best ? 800 : 500, color: v != null && v === best ? SERIES[i] : undefined }}>
                            {fmt(v, mm.key)}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-h"><h3>{metricMeta.label} — poslednjih {last5.length} utakmica</h3></div>
          <div className="card-b">
            {selected.map((pid, i) => {
              const p = players.find(x => x.id === pid)
              const series = [...last5].reverse().map(m => ({ m, v: valueOf(pid, metric, m) }))
              const mx = Math.max(1, ...series.map(s => s.v || 0))
              return (
                <div className="pm-block" key={pid}>
                  <div className="pm-name"><span className="gp-dot" style={{ background: SERIES[i] }} />{p ? shortName(p.name) : pid}</div>
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
      )}

      <p className="mock-note" style={{ marginTop: 14 }}>Podaci su primer. Klikni „Unesi GPS" da uneseš prave brojeve iz Catapult-a (kasnije dodajemo i uvoz iz fajla).</p>

      {entry && <GpsEntry matches={gpsMatches} players={gpsPlayers} gps={gps} initial={entry} onClose={() => setEntry(null)}
        onSave={(mid, pid, metrics) => { store.setGps(mid, pid, metrics); setEntry(null) }} />}
    </section>
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
