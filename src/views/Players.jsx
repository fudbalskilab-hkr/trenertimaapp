import { useState, useEffect } from 'react'
import { useStore, ageFrom, initials, computeStats } from '../data/store'
import { FEE_MONTHS } from '../data/seed'
import { Icon } from '../components/Icons'

export default function Players({ addSignal }) {
  const store = useStore()
  const { players, fees, matches } = store
  const [selId, setSelId] = useState(players[0]?.id)
  const [adding, setAdding] = useState(false)

  useEffect(() => { if (addSignal) setAdding(true) }, [addSignal])

  const sel = players.find(p => p.id === selId) || players[0]
  const curMonth = 'jul'

  return (
    <section className="split">
      <div className="card">
        <div className="card-h"><h3>Spisak igrača</h3><span className="pill blue" style={{ marginLeft: 'auto' }}>{players.length} igrača</span></div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>Igrač</th><th>God.</th><th>Noga</th><th>Poz.</th><th>Alt.</th><th>Član. ({curMonth})</th></tr>
            </thead>
            <tbody>
              {players.map(p => {
                const paid = fees[p.id] && fees[p.id][curMonth]
                return (
                  <tr key={p.id} className={p.id === sel?.id ? 'sel' : ''} onClick={() => setSelId(p.id)}>
                    <td><b>{p.name}</b></td>
                    <td className="num">{ageFrom(p.dob) ?? '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.foot || '—'}</td>
                    <td>{p.pos ? <span className="pos">{p.pos}</span> : '—'}</td>
                    <td>{p.alt ? <span className="pos">{p.alt}</span> : '—'}</td>
                    <td><span className="dot" style={{ background: paid ? 'var(--good)' : 'var(--bad)' }} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sel && <Profile key={sel.id} player={sel} store={store} matches={matches} />}
      {adding && <AddPlayer onClose={() => setAdding(false)} onSave={(p) => { store.addPlayer(p); setAdding(false) }} />}
    </section>
  )
}

function Profile({ player, store, matches }) {
  const st = computeStats(player.id, matches)
  const fee = store.fees[player.id] || {}
  const age = ageFrom(player.dob)
  return (
    <div className="card" style={{ alignSelf: 'start' }}>
      <div className="prof-head">
        <div className="prof-av">{initials(player.name)}</div>
        <div>
          <h3>{player.name}</h3>
          <div className="meta">{[player.pos, player.alt].filter(Boolean).join(' / ') || 'bez pozicije'} · {player.dob || 'nepoznat datum'}{age != null ? ` (${age})` : ''}</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {player.foot && <span className="tag" style={{ textTransform: 'capitalize' }}>{player.foot} noga</span>}
            {player.hw && <span className="tag">{player.hw} cm/kg</span>}
          </div>
        </div>
        <button className="btn ghost sm" style={{ marginLeft: 'auto' }} title="Obriši igrača"
          onClick={() => { if (confirm(`Obrisati igrača ${player.name}?`)) store.removePlayer(player.id) }}>
          <Icon.trash />
        </button>
      </div>

      <div className="kv">
        <div><div className="kk">Datum rođenja</div><div className="vv">{player.dob || '—'}</div></div>
        <div><div className="kk">Jača noga</div><div className="vv" style={{ textTransform: 'capitalize' }}>{player.foot || '—'}</div></div>
        <div><div className="kk">Pozicija</div><div className="vv">{player.pos || '—'}</div></div>
        <div><div className="kk">Alternativna</div><div className="vv">{player.alt || '—'}</div></div>
      </div>

      <div className="eyebrow" style={{ padding: '16px 18px 0' }}>Statistika sezone</div>
      <div className="statgrid">
        <Stat n={st.apps} l="Nastupi" />
        <Stat n={st.minutes} l="Minuti" />
        <Stat n={st.goals} l="Golovi" />
        <Stat n={st.assists} l="Asist." />
        <Stat n={st.yellow} l="Žuti" />
        <Stat n={st.cs} l="Clean sheet" />
      </div>

      <div className="eyebrow" style={{ padding: '4px 18px 8px' }}>Članarina — klik za promenu</div>
      <div className="months">
        {FEE_MONTHS.slice(0, 6).map(m => {
          const paid = fee[m]
          return (
            <button key={m} className={'mo ' + (paid ? 'paid' : 'due')} onClick={() => store.toggleFee(player.id, m)}>
              <small>{m.toUpperCase()}</small>{paid ? '✓' : '✕'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ n, l }) {
  return <div className="stat"><b className="num">{n}</b><span>{l}</span></div>
}

function AddPlayer({ onClose, onSave }) {
  const [f, setF] = useState({ name: '', dob: '', foot: 'desna', pos: '', alt: '', hw: '' })
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h3>Novi igrač</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b">
          <div className="field"><label>Ime i prezime</label><input className="input" value={f.name} onChange={e => set('name', e.target.value)} placeholder="npr. Marko Marković" autoFocus /></div>
          <div className="row2">
            <div className="field"><label>Datum rođenja</label><input className="input" type="date" value={f.dob} onChange={e => set('dob', e.target.value)} /></div>
            <div className="field"><label>Jača noga</label>
              <select className="input" value={f.foot} onChange={e => set('foot', e.target.value)}>
                <option value="desna">desna</option><option value="leva">leva</option><option value="obe">obe</option>
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field"><label>Pozicija</label><input className="input" value={f.pos} onChange={e => set('pos', e.target.value)} placeholder="npr. CM" /></div>
            <div className="field"><label>Alternativna</label><input className="input" value={f.alt} onChange={e => set('alt', e.target.value)} placeholder="npr. DM" /></div>
          </div>
          <div className="field"><label>Visina/težina (opciono)</label><input className="input" value={f.hw} onChange={e => set('hw', e.target.value)} placeholder="npr. 182/74" /></div>
        </div>
        <div className="modal-f">
          <button className="btn ghost" onClick={onClose}>Otkaži</button>
          <button className="btn primary" disabled={!f.name.trim()} onClick={() => onSave(f)}>Sačuvaj</button>
        </div>
      </div>
    </div>
  )
}
