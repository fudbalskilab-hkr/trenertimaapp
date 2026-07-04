import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as seed from './seed'

/*
  Sloj za podatke. Trenutno: localStorage.
  Kada dodamo Firebase — menja se samo ovaj fajl (isti API prema aplikaciji):
  load/save -> Firestore, uz auth i deljivi read-only link.
*/

const KEY = 'trenertima_v4'

function initialState() {
  return {
    team: seed.TEAM,
    league: seed.LEAGUE,
    players: seed.PLAYERS,
    fees: {},                 // { [playerId]: { jul:true, avg:false, ... } }
    matches: seed.MATCHES,
    calendar: seed.CALENDAR,
    microcycles: seed.MICROCYCLES,
    trainings: seed.TRAININGS,
    exercises: seed.EXERCISES,
    gps: seed.GPS,            // { [matchId]: { [playerId]: {...metrike} } }
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

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* ignore */ }
  }, [state])

  const update = useCallback((patch) => {
    setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  }, [])

  const api = {
    ...state,
    update,
    resetAll: () => setState(initialState()),

    // Tim (ime trenera, grb kluba) i liga
    updateTeam: (patch) => setState(s => ({ ...s, team: { ...s.team, ...patch } })),
    updateLeague: (patch) => setState(s => ({ ...s, league: { ...s.league, ...patch } })),

    // GPS (Catapult) — unos/izmena metrika za igrača na meču
    setGps: (matchId, playerId, metrics) => setState(s => ({
      ...s, gps: { ...s.gps, [matchId]: { ...(s.gps[matchId] || {}), [playerId]: metrics } },
    })),

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

    // Mikrociklusi
    updateMicrocycle: (id, patch) => setState(s => ({
      ...s, microcycles: s.microcycles.map(m => m.id === id ? { ...m, ...patch } : m),
    })),

    // Treninzi
    updateTraining: (id, patch) => setState(s => ({
      ...s, trainings: s.trainings.map(t => t.id === id ? { ...t, ...patch } : t),
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
