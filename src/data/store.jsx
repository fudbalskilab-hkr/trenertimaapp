import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '../firebase'
import * as seed from './seed'

const CLOUD_DOC = ['app', 'main'] // Firestore: kolekcija "app", dokument "main"
// REŽIM SPAŠAVANJA: ?recovery u linku -> NE dira cloud (ne sinhronizuje, ne prepisuje lokalno)
const RECOVERY = typeof window !== 'undefined' && /[?&]recovery/.test(window.location.search)

/*
  Sloj za podatke. Trenutno: localStorage.
  Kada dodamo Firebase — menja se samo ovaj fajl (isti API prema aplikaciji):
  load/save -> Firestore, uz auth i deljivi read-only link.
*/

const KEY = 'trenertima_v4'
const HKEY = 'trenertima_history'   // lokalna istorija verzija (za „vrati nazad")

// PRAZAN start — bez ikakvih demo podataka
function initialState() {
  return {
    team: { ...seed.TEAM },
    league: { ...seed.LEAGUE },
    players: [],
    fees: {},
    matches: [],
    calendar: [],
    microcycles: [],
    trainings: [],
    exercises: [],
    gps: {},
  }
}

// Lokalna istorija: čuva poslednjih 15 stanja (za oporavak od pogrešnog klika)
function pushHistory(json) {
  try {
    const h = JSON.parse(localStorage.getItem(HKEY) || '[]')
    if (h[0] && h[0].json === json) return
    h.unshift({ at: Date.now(), json })
    while (h.length > 15) h.pop()
    localStorage.setItem(HKEY, JSON.stringify(h))
  } catch (e) {
    try { const h = JSON.parse(localStorage.getItem(HKEY) || '[]'); localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 5))) } catch (e2) {}
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
  } catch (e) { /* ignore */ }
  return initialState()
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [cloud, setCloud] = useState('connecting') // connecting | online | offline

  const stateRef = useRef(state); stateRef.current = state
  const remoteJson = useRef(null)   // poslednji JSON viđen u/za cloud (sprečava petlju)
  const saveTimer = useRef(null)
  const verAt = useRef(0)           // kad je zadnja cloud-verzija upisana (throttle)
  const verIdx = useRef(Number(localStorage.getItem('trenertima_veridx') || 0))

  // lokalni keš (radi i offline)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* ignore */ }
  }, [state])

  // Firestore: učitaj + prati promene u realnom vremenu
  useEffect(() => {
    if (RECOVERY) { setCloud('offline'); return } // spašavanje: ne diramo cloud
    const ref = doc(db, CLOUD_DOC[0], CLOUD_DOC[1])
    const unsub = onSnapshot(ref, snap => {
      setCloud('online')
      if (snap.exists() && snap.data().json) {
        const json = snap.data().json
        if (json !== remoteJson.current) {
          remoteJson.current = json
          try { setState(s => ({ ...initialState(), ...JSON.parse(json) })) } catch (e) { /* ignore */ }
        }
      } else {
        // cloud je prazan → zasej ga trenutnim (lokalnim) podacima
        const json = JSON.stringify(stateRef.current)
        remoteJson.current = json
        setDoc(ref, { json, updatedAt: Date.now() }).catch(() => {})
      }
    }, () => setCloud('offline'))
    return unsub
  }, [])

  // Sačuvaj promene u cloud (debounce), osim ako je to upravo ono što smo primili
  useEffect(() => {
    if (RECOVERY) return // spašavanje: ne upisujemo u cloud
    const json = JSON.stringify(state)
    if (saveTimer.current) clearTimeout(saveTimer.current) // otkaži prethodni zakazani upis
    if (json === remoteJson.current) return                // ništa novo (to je već u cloud-u)
    remoteJson.current = json
    pushHistory(json)                                      // lokalna istorija (za „vrati nazad")
    saveTimer.current = setTimeout(() => {
      setDoc(doc(db, CLOUD_DOC[0], CLOUD_DOC[1]), { json, updatedAt: Date.now() })
        .then(() => setCloud('online')).catch(() => setCloud('offline'))
      // cloud verzija (rotirajuće 15), ne češće od 90s — zaštita i ako se izgubi uređaj
      const now = Date.now()
      if (now - verAt.current > 90000) {
        verAt.current = now
        const idx = verIdx.current % 15
        verIdx.current = idx + 1
        try { localStorage.setItem('trenertima_veridx', String(verIdx.current)) } catch (e) {}
        setDoc(doc(db, 'versions', 'v' + idx), { json, at: now }).catch(() => {})
      }
    }, 700)
  }, [state])

  const update = useCallback((patch) => {
    setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  }, [])

  const api = {
    ...state,
    cloud,
    recovery: RECOVERY,
    update,
    resetAll: () => setState(initialState()),
    // Izvoz / uvoz
    exportData: () => JSON.stringify(state, null, 2),
    importData: (json) => { const obj = typeof json === 'string' ? JSON.parse(json) : json; setState({ ...initialState(), ...obj }) },

    // Istorija verzija (za „vrati nazad")
    getHistory: () => { try { return JSON.parse(localStorage.getItem(HKEY) || '[]') } catch (e) { return [] } },
    restoreSnapshot: (json) => { try { setState({ ...initialState(), ...JSON.parse(json) }) } catch (e) {} },
    getCloudVersions: async () => {
      try {
        const snap = await getDocs(collection(db, 'versions'))
        const arr = []
        snap.forEach(d => { const v = d.data(); if (v && v.json) arr.push({ id: d.id, at: v.at || 0, json: v.json }) })
        return arr.sort((a, b) => b.at - a.at)
      } catch (e) { return [] }
    },
    clearAll: () => setState({
      team: { ...seed.TEAM }, league: { ...seed.LEAGUE }, players: [], fees: {}, matches: [],
      calendar: seed.CALENDAR, microcycles: [], trainings: [], exercises: [], gps: {},
    }),
    // Obriši SAMO moje primere (kratke seed-oznake p1/m3/e2/mc4…), zadrži trenerove unose (dugačke oznake) i demo GPS (demo*)
    removeSeedData: () => setState(s => {
      const isSeed = id => { const x = String(id); return !x.startsWith('demo') && /^(p|m|l|e|mc|t)\d{1,2}$/.test(x) }
      const players = s.players.filter(p => !isSeed(p.id))
      const matches = s.matches.filter(m => !isSeed(m.id))
      const keptM = new Set(matches.map(m => m.id)); const keptP = new Set(players.map(p => p.id))
      const gps = {}; Object.keys(s.gps || {}).forEach(mid => { if (keptM.has(mid)) gps[mid] = s.gps[mid] })
      const fees = {}; Object.keys(s.fees || {}).forEach(pid => { if (keptP.has(pid)) fees[pid] = s.fees[pid] })
      return {
        ...s, players, matches, gps, fees,
        exercises: s.exercises.filter(e => !isSeed(e.id)),
        microcycles: s.microcycles.filter(m => !isSeed(m.id)),
      }
    }),
    // Vrati moje primere (poništi „Obriši demo/primere") — dodaje seed stavke nazad, ne dira trenerove
    restoreSeedData: () => setState(s => {
      const missing = (arr, list) => list.filter(x => !arr.some(y => y.id === x.id))
      return {
        ...s,
        players: [...s.players, ...missing(s.players, seed.PLAYERS)],
        matches: [...s.matches, ...missing(s.matches, seed.MATCHES)],
        exercises: [...s.exercises, ...missing(s.exercises, seed.EXERCISES)],
        microcycles: [...s.microcycles, ...missing(s.microcycles, seed.MICROCYCLES)],
        gps: { ...seed.GPS, ...s.gps },
      }
    }),

    // Tim (ime trenera, grb kluba) i liga
    updateTeam: (patch) => setState(s => ({ ...s, team: { ...s.team, ...patch } })),
    updateLeague: (patch) => setState(s => ({ ...s, league: { ...s.league, ...patch } })),

    // GPS (Catapult) — unos/izmena metrika za igrača na meču
    setGps: (matchId, playerId, metrics) => setState(s => ({
      ...s, gps: { ...s.gps, [matchId]: { ...(s.gps[matchId] || {}), [playerId]: metrics } },
    })),
    // DEMO GPS koji SAMO dodaje (za postojeće igrače), ništa ne briše
    loadDemoGps: () => setState(s => {
      if ((s.players || []).length === 0) return s
      if (s.matches.some(m => String(m.id).startsWith('demo'))) return s // već dodato
      const { matches, gps } = seed.makeDemoGps(s.players)
      return { ...s, matches: [...s.matches, ...matches], gps: { ...s.gps, ...gps } }
    }),
    removeDemoGps: () => setState(s => {
      const gps = { ...s.gps }
      s.matches.filter(m => String(m.id).startsWith('demo')).forEach(m => { delete gps[m.id] })
      return { ...s, matches: s.matches.filter(m => !String(m.id).startsWith('demo')), gps }
    }),

    // Igrači
    addPlayer: (p) => setState(s => ({ ...s, players: [...s.players, { ...p, id: 'p' + Date.now() }] })),
    updatePlayer: (id, patch) => setState(s => ({
      ...s, players: s.players.map(p => p.id === id ? { ...p, ...patch } : p),
    })),
    removePlayer: (id) => setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) })),

    // Članarina
    toggleFee: (playerId, month) => setState(s => {
      const cur = s.fees[playerId] || {}
      return { ...s, fees: { ...s.fees, [playerId]: { ...cur, [month]: !cur[month] } } }
    }),

    // Utakmice
    addMatch: () => {
      const id = 'm' + Date.now()
      setState(s => ({ ...s, matches: [...s.matches, {
        id, date: '', time: '17:00', opp: 'Novi protivnik', home: true, comp: 'Prijateljska',
        kind: 'friendly', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {}, minutes: {},
      }] }))
      return id
    },
    removeMatch: (id) => setState(s => ({ ...s, matches: s.matches.filter(m => m.id !== id) })),
    updateMatch: (id, patch) => setState(s => ({
      ...s, matches: s.matches.map(m => m.id === id ? { ...m, ...patch } : m),
    })),

    // Kalendar
    setCalendarCell: (wi, di, part, value) => setState(s => {
      const cal = s.calendar.map((w, i) => i !== wi ? w : {
        ...w, days: w.days.map((d, j) => j !== di ? d : { ...d, [part]: value }),
      })
      return { ...s, calendar: cal }
    }),
    setDayIntensity: (wi, di, level) => setState(s => {
      const cal = s.calendar.map((w, i) => i !== wi ? w : {
        ...w, days: w.days.map((d, j) => j !== di ? d : { ...d, intensity: level }),
      })
      return { ...s, calendar: cal }
    }),
    // zameni sadržaj dva dana (drag&drop pri promeni termina); čuva datum/naziv dana na mestu
    swapCalendarDays: (a, b) => setState(s => {
      const cal = s.calendar.map(w => ({ ...w, days: w.days.slice() }))
      const A = cal[a.wi].days[a.di], B = cal[b.wi].days[b.di]
      const swap = { am: 1, pm: 1, matchId: 1, intensity: 1 }
      const na = { ...A }, nb = { ...B }
      Object.keys(swap).forEach(k => { na[k] = B[k]; nb[k] = A[k] })
      cal[a.wi].days[a.di] = na; cal[b.wi].days[b.di] = nb
      return { ...s, calendar: cal }
    }),

    // Mikrociklusi
    updateMicrocycle: (id, patch) => setState(s => ({
      ...s, microcycles: s.microcycles.map(m => m.id === id ? { ...m, ...patch } : m),
    })),
    addMicrocycle: () => setState(s => {
      const nextN = (s.microcycles.reduce((mx, m) => Math.max(mx, m.n || 0), 0)) + 1
      const mc = { id: 'mc' + Date.now(), n: nextN, type: 'Pripremni', range: '', sessions: [], dayMeta: {} }
      return { ...s, microcycles: [...s.microcycles, mc] }
    }),
    removeMicrocycle: (id) => setState(s => ({ ...s, microcycles: s.microcycles.filter(m => m.id !== id) })),
    // po danu: intenzitet i „samo jedan trening"
    setMcDay: (mcId, day, patch) => setState(s => ({
      ...s, microcycles: s.microcycles.map(m => m.id !== mcId ? m : {
        ...m, dayMeta: { ...(m.dayMeta || {}), [day]: { ...((m.dayMeta || {})[day] || {}), ...patch } },
      }),
    })),

    // Treninzi (imenovana arhiva)
    addTraining: (name) => {
      const id = 't' + Date.now()
      setState(s => ({ ...s, trainings: [...s.trainings, {
        id, name: name || 'Novi trening', date: '', part: 'Prepodne', time: '', duration: '',
        players: '', intensity: '', md: '', goal: '', equipment: '', notes: '', sections: {}, drawings: {},
      }] }))
      return id
    },
    updateTraining: (id, patch) => setState(s => ({
      ...s, trainings: s.trainings.map(t => t.id === id ? { ...t, ...patch } : t),
    })),
    removeTraining: (id) => setState(s => ({ ...s, trainings: s.trainings.filter(t => t.id !== id) })),
    duplicateTraining: (id) => {
      const nid = 't' + Date.now()
      setState(s => {
        const src = s.trainings.find(t => t.id === id); if (!src) return s
        return { ...s, trainings: [...s.trainings, { ...JSON.parse(JSON.stringify(src)), id: nid, name: (src.name || 'Trening') + ' (kopija)' }] }
      })
      return nid
    },
    // Ubaci trening (nezavisna kopija) u MC dan/termin; čuva vezu ka izvoru (sourceId)
    insertTrainingToMc: (mcId, day, part, training) => setState(s => {
      const copy = { ...JSON.parse(JSON.stringify(training)), sourceId: training.id, id: 'mct' + Date.now() }
      return { ...s, microcycles: s.microcycles.map(m => m.id !== mcId ? m : {
        ...m, dayMeta: { ...(m.dayMeta || {}), [day]: { ...((m.dayMeta || {})[day] || {}), [part + 'Training']: copy } },
      }) }
    }),
    // Izmena treninga u MC danu; opciono na sve dane sa istim izvorom
    updateMcTraining: (mcId, day, part, patch, applyToSiblings) => setState(s => ({
      ...s, microcycles: s.microcycles.map(m => {
        if (m.id !== mcId) return m
        const dm = { ...(m.dayMeta || {}) }
        const cur = (dm[day] || {})[part + 'Training']
        if (!cur) return m
        const srcId = cur.sourceId
        Object.keys(dm).forEach(d => {
          ;['am', 'pm'].forEach(p => {
            const tr = (dm[d] || {})[p + 'Training']
            if (!tr) return
            const isSelf = d === day && p === part
            if (isSelf || (applyToSiblings && srcId && tr.sourceId === srcId)) {
              dm[d] = { ...dm[d], [p + 'Training']: { ...tr, ...patch } }
            }
          })
        })
        return { ...m, dayMeta: dm }
      }),
    })),
    removeMcTraining: (mcId, day, part) => setState(s => ({
      ...s, microcycles: s.microcycles.map(m => {
        if (m.id !== mcId) return m
        const dm = { ...(m.dayMeta || {}) }; const dd = { ...(dm[day] || {}) }
        delete dd[part + 'Training']; dm[day] = dd
        return { ...m, dayMeta: dm }
      }),
    })),

    // Vežbe
    addExercise: (e) => setState(s => ({ ...s, exercises: [...s.exercises, { ...e, id: 'e' + Date.now() }] })),
    updateExercise: (id, patch) => setState(s => ({ ...s, exercises: s.exercises.map(e => e.id === id ? { ...e, ...patch } : e) })),
    removeExercise: (id) => setState(s => ({ ...s, exercises: s.exercises.filter(e => e.id !== id) })),
  }

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore mora biti unutar StoreProvider')
  return ctx
}

// ===== Pomoćne funkcije =====
export function ageFrom(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d)) return null
  const now = new Date(2026, 6, 4) // fiksno "danas" u pripremnom periodu
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--
  return a
}

export function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function shortName(name) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return name
  return parts[0][0] + '. ' + parts.slice(1).join(' ')
}

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.'
}

// Statistika igrača izvedena iz utakmica.
// Događaji: {type:'goal'|'assist'|'yellow'|'red', playerId, minute}
//           {type:'sub', inId, outId, minute}
const MATCH_LEN = 90
export function computeStats(playerId, matches) {
  const st = { apps: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, cs: 0 }
  for (const m of matches) {
    const finished = m.gf !== null || m.ga !== null
    if (!finished) continue
    const inLineup = (m.lineup || []).includes(playerId)
    const events = m.events || []
    const subIn = events.find(e => e.type === 'sub' && e.inId === playerId)
    const subOut = events.find(e => e.type === 'sub' && e.outId === playerId)
    const manualMin = (m.minutes || {})[playerId]
    const hasManual = manualMin != null && manualMin !== ''
    const played = inLineup || !!subIn || (hasManual && Number(manualMin) > 0)
    if (played) st.apps++

    // minuti: ručni unos ima prednost; inače procena (meč = 90')
    if (hasManual) st.minutes += Number(manualMin) || 0
    else if (inLineup) st.minutes += subOut ? Number(subOut.minute) || MATCH_LEN : MATCH_LEN
    else if (subIn) st.minutes += Math.max(0, MATCH_LEN - (Number(subIn.minute) || 0))

    for (const e of events) {
      if (e.playerId !== playerId) continue
      if (e.type === 'goal') st.goals++
      if (e.type === 'assist') st.assists++
      if (e.type === 'yellow') st.yellow++
      if (e.type === 'red') st.red++
    }
    // clean sheet: primio 0 golova, a igrač je bio u postavi na poziciji GK/DEF (procena: bio u startnih 11)
    if (inLineup && m.ga === 0) st.cs++
  }
  return st
}
