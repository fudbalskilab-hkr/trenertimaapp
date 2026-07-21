import { useRef, useState, useEffect } from 'react'
import { useStore } from '../data/store'
import { useAuth } from '../auth'
import { Icon, Crest } from '../components/Icons'
import { shrinkImage, urlToCrest } from '../utils/img'

const SUBTABS = [
  ['team', '🛡️ Klub / Tim'],
  ['comp', '🏆 Takmičenja'],
  ['display', '🎨 Prikaz'],
  ['data', '💾 Podaci i backup'],
  ['account', '👤 Nalog'],
  ['cloud', '☁️ Cloud / baza'],
]

export default function Settings({ sub, setSub }) {
  const store = useStore()
  const cur = SUBTABS.some(([k]) => k === sub) ? sub : 'team'
  return (
    <div className="settings">
      <div className="settings-nav">
        {SUBTABS.map(([k, l]) => (
          <button key={k} className={cur === k ? 'on' : ''} onClick={() => setSub(k)}>{l}</button>
        ))}
      </div>
      <div className="settings-body">
        {cur === 'team' && <TeamSettings store={store} />}
        {cur === 'comp' && <CompSettings store={store} />}
        {cur === 'display' && <DisplaySettings store={store} />}
        {cur === 'data' && <DataSettings store={store} />}
        {cur === 'account' && <AccountSettings store={store} />}
        {cur === 'cloud' && <CloudSettings store={store} />}
      </div>
    </div>
  )
}

function Section({ title, desc, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-h"><h3>{title}</h3></div>
      <div className="card-b">
        {desc && <p className="mock-note" style={{ marginTop: 0, marginBottom: 14 }}>{desc}</p>}
        {children}
      </div>
    </div>
  )
}

/* ---------- Klub / Tim ---------- */
function TeamSettings({ store }) {
  const { team } = store
  const set = (k, v) => store.updateTeam({ [k]: v })
  return (
    <Section title="Klub / Tim" desc="Osnovni podaci — vide se u meniju, zaglavljima i izveštajima.">
      <div className="row2">
        <div className="field"><label>Naziv kluba</label><input className="input" value={team.name || ''} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label>Kategorija</label><input className="input" value={team.category || ''} onChange={e => set('category', e.target.value)} placeholder="npr. Omladinci" /></div>
      </div>
      <div className="row2">
        <div className="field"><label>Sezona</label><input className="input" value={team.season || ''} onChange={e => set('season', e.target.value)} placeholder="2026/27" /></div>
        <div className="field"><label>Period</label><input className="input" value={team.period || ''} onChange={e => set('period', e.target.value)} placeholder="Pripremni period" /></div>
      </div>
      <div className="field"><label>Ime trenera</label><input className="input" value={team.coach || ''} onChange={e => set('coach', e.target.value)} placeholder="Ime i prezime" /></div>
      <p className="mock-note" style={{ marginBottom: 0 }}>Grb kluba je trenutno ugrađen (FK Brodarac). Postavljanje sopstvenog grba dodajemo kasnije.</p>
    </Section>
  )
}

/* ---------- Takmičenja ---------- */
function CrestEditor({ crest, onCrest }) {
  const fileRef = useRef()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  function upload(e) { const f = e.target.files[0]; if (!f) return; setBusy(true); shrinkImage(f, 256, true).then(u => { onCrest(u); setBusy(false) }) }
  function fromUrl() { if (!url.trim()) return; setBusy(true); urlToCrest(url).then(u => { onCrest(u); setBusy(false); setUrl('') }) }
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0 }}>{crest ? <Crest size={56} url={crest} /> : <div className="badge-lg" style={{ width: 56, height: 56 }}>grb</div>}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…/grb.png" style={{ flex: 1 }} />
          <button className="btn sm" disabled={busy || !url.trim()} onClick={fromUrl}>{busy ? '…' : 'Dodaj'}</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sm" onClick={() => fileRef.current.click()}><Icon.upload /> Sa uređaja</button>
          {crest && <button className="btn ghost sm" style={{ color: 'var(--bad)' }} onClick={() => onCrest('')}>Ukloni</button>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        </div>
      </div>
    </div>
  )
}

function CompSettings({ store }) {
  const { league } = store
  const [hasCup, setHasCup] = useState(!!(league.cupName || league.cupLogo))
  return (
    <Section title="Takmičenja" desc="Grb takmičenja se prikazuje u kalendaru (ćošak dana sa mečom) i u izveštaju utakmice. Meč postaje ligaški/kupovni preko „Tip“ u izmeni utakmice. Link slike (npr. Wikipedia „Copy image address“) ili slika sa uređaja — najbolje PNG sa providnom pozadinom.">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Liga (prvenstvo)</div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>Naziv lige</label>
        <input className="input" value={league.name || ''} onChange={e => store.updateLeague({ name: e.target.value })} placeholder="npr. Omladinska liga Srbije" />
      </div>
      <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Grb lige</label>
      <CrestEditor crest={league.logo} onCrest={u => store.updateLeague({ logo: u })} />

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16 }}>
        {!hasCup ? (
          <button className="btn" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setHasCup(true)}><Icon.plus /> Dodaj kup (opciono)</button>
        ) : (
          <>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Kup <span style={{ fontWeight: 400, textTransform: 'none' }}>(ako tim igra)</span></div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Naziv kupa</label>
              <input className="input" value={league.cupName || ''} onChange={e => store.updateLeague({ cupName: e.target.value })} placeholder="npr. Kup Beograda" />
            </div>
            <label style={{ fontSize: 12, color: 'var(--grey)', display: 'block', marginBottom: 6 }}>Grb kupa</label>
            <CrestEditor crest={league.cupLogo} onCrest={u => store.updateLeague({ cupLogo: u })} />
            <button className="btn ghost sm" style={{ color: 'var(--bad)', marginTop: 10 }} onClick={() => { store.updateLeague({ cupName: '', cupLogo: '' }); setHasCup(false) }}>Ukloni kup</button>
          </>
        )}
      </div>
    </Section>
  )
}

/* ---------- Prikaz ---------- */
function currentTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark' || attr === 'light') return attr
  return matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem('trenertima_theme', t) } catch (e) {}
}

function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={v} className={String(value) === String(v) ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  )
}
function Setting({ label, hint, children }) {
  return (
    <div className="set-row">
      <div className="set-lab"><b>{label}</b>{hint && <small>{hint}</small>}</div>
      <div className="set-ctl">{children}</div>
    </div>
  )
}

function DisplaySettings({ store }) {
  const p = store.team.prefs || {}
  const [theme, setTheme] = useState(currentTheme)
  const setT = t => { setTheme(t); applyTheme(t) }
  return (
    <Section title="Prikaz" desc="Podešavanja se čuvaju u cloud-u i važe na svim uređajima (osim teme, koja je po uređaju).">
      <Setting label="Tema" hint="svetla ili tamna (ovaj uređaj)">
        <Seg options={[['light', '☀️ Svetla'], ['dark', '🌙 Tamna']]} value={theme} onChange={setT} />
      </Setting>
      <Setting label="Oznake ishoda" hint="pobeda / nerešeno / poraz">
        <Seg options={[['en', 'W / D / L'], ['sr', 'P / N / I']]} value={p.resultLang || 'en'} onChange={v => store.setPref({ resultLang: v })} />
      </Setting>
      <Setting label="Poslednjih utakmica u prikazu" hint="lista Utakmice + „Poslednji rezultati“ na Pregledu">
        <Seg options={[[5, '5'], [10, '10'], [20, '20'], [9999, 'Sve']]} value={p.matchCount ?? 10} onChange={v => store.setPref({ matchCount: v })} />
      </Setting>
      <Setting label="Utakmica u „formi“" hint="krugovi forme na Pregledu">
        <Seg options={[[3, '3'], [5, '5'], [6, '6'], [10, '10']]} value={p.formCount ?? 5} onChange={v => store.setPref({ formCount: v })} />
      </Setting>
    </Section>
  )
}

/* ---------- Podaci i backup ---------- */
function DataSettings({ store }) {
  const fileRef = useRef()
  const [hist, setHist] = useState(null)
  function exportBackup() {
    const blob = new Blob([store.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'trenertima-backup.json'; a.click()
    URL.revokeObjectURL(url)
  }
  function importBackup(e) {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => { try { store.importData(String(r.result)); alert('Podaci su uvezeni.') } catch (err) { alert('Greška: fajl nije ispravan backup.') } }
    r.readAsText(file)
  }
  return (
    <Section title="Podaci i backup" desc="Podaci se čuvaju u cloud-u i automatski se pravi backup pri svakoj izmeni. „Izvoz“ pravi fajl na tvom uređaju; „Istorija“ vraća neko od ranijih stanja.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
        <button className="btn primary" onClick={exportBackup} style={{ justifyContent: 'center' }}><Icon.download /> Izvoz (skini backup fajl)</button>
        <button className="btn" onClick={() => fileRef.current.click()} style={{ justifyContent: 'center' }}><Icon.upload /> Uvoz (učitaj backup)</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
        <button className="btn" onClick={() => setHist(store.getHistory())} style={{ justifyContent: 'center' }}>↩ Istorija (vrati verziju)</button>
      </div>
      {hist && <HistoryModal store={store} local={hist} onClose={() => setHist(null)} onDone={() => setHist(null)} />}
    </Section>
  )
}

/* ---------- Nalog ---------- */
function AccountSettings({ store }) {
  const authCtx = useAuth()
  if (!authCtx) return <Section title="Nalog" desc="Nalog nije aktivan u ovom režimu.">—</Section>
  return (
    <Section title="Nalog" desc="Podaci tima su zajednički za sve prijavljene korisnike.">
      <div className="set-row">
        <div className="set-lab"><b>Prijavljen</b><small>{authCtx.user.email}</small></div>
        <div className="set-ctl"><button className="btn" onClick={() => authCtx.logout()}>Odjavi se</button></div>
      </div>
    </Section>
  )
}

/* ---------- Cloud / baza ---------- */
function CloudSettings({ store }) {
  const [hist, setHist] = useState(null)
  const on = store.cloud === 'online'
  return (
    <Section title="Cloud / baza" desc="Podaci se sinhronizuju u realnom vremenu između uređaja.">
      <div className="set-row">
        <div className="set-lab"><b>Status sinhronizacije</b><small>Firebase / Firestore</small></div>
        <div className="set-ctl">
          <span className="cloud-dot"><span className="d" style={{ background: on ? 'var(--good)' : store.cloud === 'offline' ? 'var(--bad)' : 'var(--warn)' }} />
            {on ? 'Online' : store.cloud === 'offline' ? 'Offline' : 'Povezivanje…'}</span>
        </div>
      </div>
      <div className="set-row">
        <div className="set-lab"><b>Sačuvane verzije</b><small>ranija stanja za vraćanje</small></div>
        <div className="set-ctl"><button className="btn sm" onClick={() => setHist(store.getHistory())}>Otvori istoriju</button></div>
      </div>
      <p className="mock-note">Napomena: Firestore je pokrenut u test režimu (ograničeno trajanje). Pre isteka u Firebase konzoli postavi pravila da traže prijavu (<code>allow read, write: if request.auth != null;</code>) — inače baza prestane da radi.</p>
      {hist && <HistoryModal store={store} local={hist} onClose={() => setHist(null)} onDone={() => setHist(null)} />}
    </Section>
  )
}

function HistoryModal({ store, local, onClose, onDone }) {
  const [cloud, setCloud] = useState(null)
  useEffect(() => { store.getCloudVersions().then(setCloud) }, [])
  function fmtAt(at) {
    if (!at) return '—'
    const d = new Date(at)
    const q = n => String(n).padStart(2, '0')
    return `${q(d.getDate())}.${q(d.getMonth() + 1)}. ${q(d.getHours())}:${q(d.getMinutes())}`
  }
  function count(json) { try { const o = JSON.parse(json); return (o.players || []).length } catch (e) { return '?' } }
  function restore(json) {
    if (!confirm('Vratiti podatke na ovu verziju? Trenutno stanje se zamenjuje (ali i ono ide u istoriju).')) return
    store.restoreSnapshot(json); onDone()
  }
  const cloudOnly = (cloud || []).filter(c => !local.some(l => l.json === c.json))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-h"><h3>Istorija verzija</h3><button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon.close /></button></div>
        <div className="modal-b" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Na ovom uređaju</div>
          {local.length === 0 && <div className="empty" style={{ padding: 14 }}>Nema sačuvanih verzija još.</div>}
          {local.map((h, i) => (
            <div key={i} className="ge" style={{ marginBottom: 6 }}>
              <span style={{ flex: 1 }}>{fmtAt(h.at)} · <b>{count(h.json)}</b> igrača</span>
              <button className="btn sm" onClick={() => restore(h.json)}>Vrati</button>
            </div>
          ))}
          <div className="eyebrow" style={{ margin: '14px 0 8px' }}>U cloud-u {cloud === null ? '(učitavanje…)' : ''}</div>
          {cloud !== null && cloudOnly.length === 0 && <div className="empty" style={{ padding: 14 }}>Nema dodatnih cloud verzija.</div>}
          {cloudOnly.map((h, i) => (
            <div key={i} className="ge" style={{ marginBottom: 6 }}>
              <span style={{ flex: 1 }}>{fmtAt(h.at)} · <b>{count(h.json)}</b> igrača</span>
              <button className="btn sm" onClick={() => restore(h.json)}>Vrati</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
