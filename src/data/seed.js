// Početni podaci — preuzeto iz "FK Brodarac OLS.xlsx".
// Kasnije se sve čuva u Firebase; za sada u localStorage (vidi store.js).

export const TEAM = {
  name: 'FK Brodarac',
  category: 'Omladinci',
  season: '2026/27',
  period: 'Pripremni period',
  coach: 'Aleksa Bojković',
  logo: '', // grb kluba (upload) — dok je prazno, koristi se placeholder
}

// Intenzitet dana (bojenje kalendara i mikrociklusa)
// color = accent (traka/kvadratić/legenda), bg = ispuna ćelije
export const INTENSITY = [
  { key: 'match', label: 'Utakmica / udarni (90–100%)', pct: '90–100%', color: '#C92A2A', bg: '#FF8787' },
  { key: '80', label: 'Visok intenzitet (80%)', pct: '80%', color: '#E8590C', bg: '#FFB05C' },
  { key: '50', label: 'Srednji intenzitet (50%)', pct: '50%', color: '#F5C518', bg: '#FFEF85' },
  { key: '30', label: 'Nizak intenzitet (30%)', pct: '30%', color: '#2F9E44', bg: '#8CE99A' },
  { key: 'regen', label: 'Regeneracija', pct: '', color: '#1971C2', bg: '#74C0FC' },
  { key: 'free', label: 'Slobodan dan', pct: '', color: '#868E96', bg: '#DEE2E6' },
]
export const intensityColor = (k) => (INTENSITY.find(i => i.key === k) || {}).color || 'transparent'
export const intensityBg = (k) => (INTENSITY.find(i => i.key === k) || {}).bg || 'transparent'

// Boja dana u kalendaru za utakmicu — po tome da li smo domaćin/gost ili je pripremna
export const MATCH_COLORS = {
  home: { color: '#1864AB', bg: '#A5D8FF', label: 'DOMAĆIN', short: 'H' },
  away: { color: '#862E9C', bg: '#EEBEFA', label: 'GOST', short: 'A' },
  friendly: { color: '#0B7285', bg: '#96F2D7', label: 'PRIPREMNA', short: 'P' },
}
export const matchColorKey = (m) => (m && m.kind === 'friendly') ? 'friendly' : (m && m.home ? 'home' : 'away')
export const matchColor = (m) => MATCH_COLORS[matchColorKey(m)]

// Grupa pozicije (za bojenje): gk / def / mid / att
const DEF = ['CB', 'LCB', 'RCB', 'CCB', 'LB', 'RB', 'LWB', 'RWB', 'WB', 'DF', 'D']
const MID = ['DM', 'CM', 'LCM', 'RCM', 'LM', 'RM', 'AMF', 'AM', 'CAM', 'MF', 'M']
const ATT = ['LW', 'RW', 'ST', 'CF', 'FW', 'SS', 'W']
export function posGroup(pos) {
  if (!pos) return null
  const p = pos.split(/[\/,\s]+/)[0].toUpperCase().trim()
  if (p === 'GK') return 'gk'
  if (DEF.includes(p)) return 'def'
  if (MID.includes(p)) return 'mid'
  if (ATT.includes(p)) return 'att'
  return null
}
export const POS_COLORS = { gk: '#E4B62B', def: '#2E74D6', mid: '#1E9E6A', att: '#D64545' }

let _id = 1
const uid = () => 'p' + (_id++)

export const PLAYERS = [
  { id: uid(), name: 'Nikola Đorđević',     foot: 'desna', dob: '2008-03-12', pos: 'GK',  alt: '',    hw: '189/82' },
  { id: uid(), name: 'Vukašin Ilić',        foot: 'desna', dob: '2009-06-02', pos: 'GK',  alt: '',    hw: '186/78' },
  { id: uid(), name: 'Jovan Nikolić',       foot: 'desna', dob: '2008-10-11', pos: 'CM',  alt: 'DM',  hw: '' },
  { id: uid(), name: 'Aleksa Božić',        foot: 'leva',  dob: '2008-10-09', pos: 'RW',  alt: '',    hw: '177/62' },
  { id: uid(), name: 'Luka Nikolić',        foot: 'desna', dob: '2008-09-03', pos: 'CB',  alt: 'RB',  hw: '195/74' },
  { id: uid(), name: 'Nemanja Tomović',     foot: 'desna', dob: '2008-11-19', pos: 'CB',  alt: '',    hw: '191/78' },
  { id: uid(), name: 'Stefan Karapandžić',  foot: 'leva',  dob: '2008-04-15', pos: 'DM',  alt: '',    hw: '190/78' },
  { id: uid(), name: 'Petar Božin',         foot: 'desna', dob: '2009-09-10', pos: 'CB',  alt: '',    hw: '187/72' },
  { id: uid(), name: 'Mihajlo Spasojević',  foot: 'leva',  dob: '2008-08-25', pos: 'AMF', alt: 'RW',  hw: '178/74' },
  { id: uid(), name: 'Mateja Roknić',       foot: 'desna', dob: '',           pos: 'RW',  alt: '',    hw: '' },
  { id: uid(), name: 'Đorđe Raičević',      foot: 'desna', dob: '2008-09-23', pos: 'RB',  alt: '',    hw: '181/72' },
  { id: uid(), name: 'Aleksa Ivanović',     foot: 'desna', dob: '',           pos: 'AMF', alt: 'LW',  hw: '' },
  { id: uid(), name: 'Aleksa Jagličić',     foot: 'desna', dob: '2008-01-15', pos: 'LW',  alt: 'RW',  hw: '182/72' },
  { id: uid(), name: 'Đorđe Jakovljević',   foot: 'leva',  dob: '2010-08-07', pos: 'LCB', alt: '',    hw: '185/80' },
  { id: uid(), name: 'Jakša Pantović',      foot: 'leva',  dob: '2009-05-25', pos: 'CM',  alt: 'DM',  hw: '187/74' },
  { id: uid(), name: 'Branislav Jovanović', foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Lazar Mitrović',      foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Lazar Trninić',       foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Aleksandar Uskoković',foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Miloš Vučak',         foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Lazar Cvjetić',       foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Marko Vereš',         foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Nemanja Damnjanović', foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Dimitrije Spasović',  foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Petar Tanazević',     foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Andrej Grujić',       foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Dušan Bojović',       foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Luka Jovanović',      foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Novak Zarić',         foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Pavle Lazarević',     foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Vuk Lazarević',       foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
  { id: uid(), name: 'Viktor Ocokoljić',    foot: '',      dob: '',           pos: '',    alt: '',    hw: '' },
]

// Podrazumevani brojevi dresova + prazna slika (može upload u profilu)
PLAYERS.forEach((p, i) => { p.number = i + 1; p.photo = '' })

// Meseci članarine (sezona kreće u julu)
export const FEE_MONTHS = ['jul', 'avg', 'sep', 'okt', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun']

// Liga (prvenstvo)
export const LEAGUE = { name: 'Omladinska liga Srbije', logo: '', cupName: '', cupLogo: '' }

// Status meča: „Odigrana" = prošao datum ILI je ručno zaključana; inače „Zakazana"
export function datePassed(m) {
  if (!m || !m.date) return false
  const d = new Date(m.date + 'T23:59:59')
  return !isNaN(d) && d.getTime() < Date.now()
}
export const isPlayed = (m) => !!(m && (m.played || datePassed(m)))

// Rezultat iz ugla NAŠEG tima (gf/ga su domaći:gost sa semafora)
// vraća { our, opp, wdl:'W'|'D'|'L' } ili null ako nema unetog rezultata
export function ourResult(m) {
  if (!m || !isPlayed(m) || m.gf == null || m.ga == null) return null
  const our = m.home ? m.gf : m.ga
  const opp = m.home ? m.ga : m.gf
  return { our, opp, wdl: our > opp ? 'W' : our < opp ? 'L' : 'D' }
}
export const WDL = {
  W: { label: 'P', full: 'Pobeda', color: '#2F9E44' },
  D: { label: 'N', full: 'Nerešeno', color: '#868E96' },
  L: { label: 'I', full: 'Poraz', color: '#C92A2A' },
}

// Grb i naziv TAKMIČENJA za dati meč (liga / kup / prijateljska)
export const compCrest = (m, league) => {
  if (!m || !league) return ''
  if (m.kind === 'league') return league.logo || ''
  if (m.kind === 'cup') return league.cupLogo || ''
  return ''
}
export const compName = (m, league) => {
  if (!m) return ''
  if (m.kind === 'league') return league?.name || 'Liga'
  if (m.kind === 'cup') return league?.cupName || 'Kup'
  return 'Prijateljska'
}

const squad = PLAYERS.slice(0, 14).map(p => p.id)

function pastMatch(id, date, opp, home, gf, ga, scorers, assists) {
  const lineup = squad.slice(0, 11)
  const events = []
  scorers.forEach((si, k) => {
    const min = 15 + k * 14
    events.push({ id: id + 'g' + k, type: 'goal', playerId: squad[si], minute: min })
    if (assists[k] != null) events.push({ id: id + 'a' + k, type: 'assist', playerId: squad[assists[k]], minute: min })
  })
  return { id, date, time: '17:00', opp, home, comp: 'Prijateljska', kind: 'friendly', crest: '', gf, ga, events, lineup, formation: '4-3-3', positions: {} }
}

// Odigrane (jun) — daju statistiku, GPS i „poslednjih 5"
const PAST = [
  pastMatch('p1', '2026-06-07', 'Radnički', true,  2, 1, [4, 6], [7, null]),
  pastMatch('p2', '2026-06-14', 'Čukarički omladinci', false, 1, 1, [1], [10]),
  pastMatch('p3', '2026-06-18', 'Voždovac', true,  3, 0, [6, 4, 10], [null, 7, 6]),
  pastMatch('p4', '2026-06-25', 'Zemun', false, 0, 2, [], []),
  pastMatch('p5', '2026-06-28', 'Sinđelić', true,  2, 2, [4, 1], [6, 7]),
]

// Predstojeće prijateljske (jul) + prvenstvo (avgust)
export const MATCHES = [
  ...PAST,
  { id: 'm1', date: '2026-07-10', time: '17:30', opp: 'Prva iskra Barič', home: true,  comp: 'Prijateljska', kind: 'friendly', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {} },
  { id: 'm2', date: '2026-07-15', time: '18:00', opp: 'IMT',              home: false, comp: 'Prijateljska', kind: 'friendly', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {} },
  { id: 'm3', date: '2026-07-19', time: '17:00', opp: 'Ušće',             home: true,  comp: 'Prijateljska', kind: 'friendly', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {} },
  { id: 'm4', date: '2026-07-22', time: '17:00', opp: 'Grafičar',         home: false, comp: 'Prijateljska', kind: 'friendly', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {} },
  { id: 'l1', date: '2026-08-16', time: '11:00', opp: 'Partizan',         home: false, comp: 'Omladinska liga · 1. kolo', kind: 'league', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {} },
  { id: 'l2', date: '2026-08-23', time: '11:00', opp: 'Crvena zvezda',    home: true,  comp: 'Omladinska liga · 2. kolo', kind: 'league', crest: '', gf: null, ga: null, events: [], lineup: [], formation: '4-3-3', positions: {} },
]

// Catapult GPS metrike
export const GPS_METRICS = [
  { key: 'td', label: 'Total distance', unit: 'm', short: 'TD' },
  { key: 'hsr', label: 'HSR (visok intenzitet)', unit: 'm', short: 'HSR' },
  { key: 'sprints', label: 'Broj sprinteva', unit: '', short: 'Sprints' },
  { key: 'sprintDist', label: 'Sprint distance', unit: 'm', short: 'Sprint dist.' },
  { key: 'topSpeed', label: 'Top speed', unit: 'km/h', short: 'Top speed' },
  { key: 'acc', label: 'Ubrzanja (ACC)', unit: '', short: 'ACC' },
  { key: 'dcc', label: 'Kočenja (DCC)', unit: '', short: 'DCC' },
]

function gpsFor(pi, mi) {
  const r = (base, span, s) => base + ((pi * s + mi * 7 + 3) % span)
  return {
    td: r(8600, 2800, 37),
    hsr: r(460, 640, 17),
    sprints: r(11, 18, 5),
    sprintDist: r(130, 240, 11),
    topSpeed: +(28 + ((pi * 3 + mi * 5) % 75) / 10).toFixed(1),
    acc: r(16, 22, 13),
    dcc: r(15, 20, 9),
  }
}

// GPS podaci: matchId -> playerId -> metrike (samo za odigrane)
export const GPS = {}
PAST.forEach((m, mi) => {
  GPS[m.id] = {}
  squad.forEach((pid, pi) => { GPS[m.id][pid] = gpsFor(pi, mi) })
})

// Demo GPS SAMO za trenutne igrače (ne dira roster) — za pregled kako izgleda Catapult
export function makeDemoGps(players) {
  const roster = (players || []).slice(0, 16)
  const opps = ['Radnički', 'Voždovac', 'Zemun', 'Sinđelić', 'Čukarički']
  const dates = ['2026-06-07', '2026-06-14', '2026-06-18', '2026-06-25', '2026-06-28']
  const matches = opps.map((opp, i) => ({
    id: 'demo' + i, date: dates[i], time: '17:00', opp: '(demo) ' + opp, home: i % 2 === 0,
    comp: 'Demo utakmica', kind: 'friendly', crest: '', gf: 2, ga: i % 3, events: [],
    lineup: roster.slice(0, 11).map(p => p.id), formation: '4-3-3', positions: {}, minutes: {},
  }))
  const gps = {}
  matches.forEach((m, mi) => { gps[m.id] = {}; roster.forEach((p, pi) => { gps[m.id][p.id] = gpsFor(pi, mi) }) })
  return { matches, gps }
}

const DAYS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

// Kalendar aktivnosti — nedelje sa danima; svaki dan Prepodne (am) / Popodne (pm)
// Vrednost: string aktivnosti, "/" = slobodno, ili {matchId} za utakmicu
function week(startISO, cells) {
  const days = DAYS.map((d, i) => {
    const dt = new Date(startISO)
    dt.setDate(dt.getDate() + i)
    const iso = dt.toISOString().slice(0, 10)
    const c = cells[i] || {}
    const isFree = !c.matchId && !c.am && !c.pm
    return {
      day: d, date: iso, am: c.am ?? '/', pm: c.pm ?? '/', matchId: c.matchId || null,
      intensity: c.intensity ?? (c.matchId ? 'match' : (isFree ? 'free' : null)),
    }
  })
  return { start: startISO, days }
}

export const CALENDAR = [
  week('2026-07-06', [
    { am: 'Snaga — donji ekst.\nPoligoni aer. izdr.', pm: 'Passing drill\nBuild-up + press', intensity: '80' },
    { am: 'Tehnika + posed', pm: 'Igra 8v8', intensity: '50' },
    { am: 'Regeneracija', intensity: '30' },
    { am: 'Brzina + agilnost', pm: 'Tranzicije', intensity: '50' },
    { matchId: 'm1' },
    { am: 'Analiza meča', intensity: '30' },
    {},
  ]),
  week('2026-07-13', [
    { am: 'Snaga — gornji ekst.', pm: 'Prekidi', intensity: '80' },
    { am: 'Posed lopte', pm: 'Igra 11v11', intensity: '50' },
    { matchId: 'm2' },                                              // 15.07 vs IMT
    { am: 'Regeneracija', intensity: '30' },
    { am: 'Odbrana zone', pm: 'Napad — širina', intensity: '50' },
    { am: 'Aktivacija', intensity: '30' },
    { matchId: 'm3' },                                              // 19.07 vs Ušće
  ]),
  week('2026-07-20', [
    { am: 'Snaga', pm: 'Presing', intensity: '80' },
    { am: 'Tranzicije', pm: 'Igra', intensity: '50' },
    { matchId: 'm4' },
    { am: 'Regeneracija', intensity: '30' },
    { am: 'Taktika', pm: 'Šut', intensity: '50' },
    { am: 'Igra', intensity: '80' },
    {},
  ]),
  week('2026-07-27', [
    { am: 'Snaga', pm: 'Posed', intensity: '80' },
    { am: 'Tehnika', pm: 'Tranzicije', intensity: '50' },
    { am: 'Regeneracija', intensity: '30' },
    { am: 'Presing', pm: 'Igra', intensity: '50' },
    {}, {}, {},
  ]),
  week('2026-08-03', [
    { am: 'Snaga', pm: 'Build-up', intensity: '80' },
    { am: 'Posed', pm: 'Igra 11v11', intensity: '50' },
    { am: 'Regeneracija', intensity: '30' },
    { am: 'Prekidi', pm: 'Napad', intensity: '50' },
    {}, {}, {},
  ]),
  week('2026-08-10', [
    { am: 'Aktivacija', pm: 'Taktika', intensity: '50' },
    { am: 'Šut', pm: 'Igra', intensity: '50' },
    { am: 'Regeneracija', intensity: '30' },
    { am: 'Priprema za sezonu', intensity: '80' },
    {}, {}, {},
  ]),
]

export const SECTIONS = ['Aktivacija', 'Uvodni deo', 'Glavni deo', 'Završni deo', 'Dodatan rad']

// Mikrociklusi 1–6 (5 pripremnih + 1 takmičarski)
export const MICROCYCLES = Array.from({ length: 6 }, (_, i) => ({
  id: 'mc' + (i + 1),
  n: i + 1,
  type: i === 5 ? 'Takmičarski' : 'Pripremni',
  range: '',
  // sesije: niz {day, date, part:'am'|'pm', sections:{Aktivacija, ...}}
  sessions: i === 0 ? [
    { day: 'Ponedeljak', date: '2026-07-06', part: 'am', sections: {
      'Aktivacija': "Mobilnost + trčanje 10'", 'Uvodni deo': 'Rondo 5v2, 2 serije',
      'Glavni deo': 'Snaga donji ekstremiteti 25\'', 'Završni deo': 'Istezanje', 'Dodatan rad': "Core 10'" } },
    { day: 'Ponedeljak', date: '2026-07-06', part: 'pm', sections: {
      'Aktivacija': "Aktivacija s loptom 8'", 'Uvodni deo': 'Passing drill u kvadratu',
      'Glavni deo': 'Build-up 3. trećine + press', 'Završni deo': 'Igra 7v7', 'Dodatan rad': '' } },
    { day: 'Utorak', date: '2026-07-07', part: 'am', sections: {
      'Aktivacija': 'Koordinacija — merdevine', 'Uvodni deo': 'Posed 6v6+2',
      'Glavni deo': 'Aerobna izdržljivost — poligon', 'Završni deo': 'Šut na gol', 'Dodatan rad': 'Prevencija povreda' } },
  ] : [],
}))

// Koncept treninga (primer)
export const TRAININGS = [
  {
    id: 't1', date: '2026-07-08', part: 'Prepodne', time: '09:00', duration: '75 min',
    players: '24', intensity: 'Srednji', md: 'MD-2', goal: 'Presing u srednjem bloku',
    equipment: '12 kupa, 6 čunjeva, 3 gola', notes: '2 igrača individualno',
    sections: {
      'Aktivacija': 'Dinamička mobilnost 8\' → aktivacija sa mini-bendom → trčanje sa promenom pravca 2×40m. Snaga: čučanj 3×8, iskorak 3×10.',
      'Uvodni deo': 'Rondo 6v2 u kvadratu 12×12m. Cilj: brz prenos lopte, prva lopta pod pritiskom. 3 serije × 3\'.',
      'Glavni deo': 'Igra 8v8+3 na ½ terena sa presing okidačima. Povraćaj lopte za 6s. 4 serije × 4\'.',
      'Završni deo': 'Igra na dva mala gola 5v5. Smirivanje + istezanje 8\'.',
    },
    drawings: {}, // sekcija -> dataURL slike (upload/crtež)
  },
]

// Skladište vežbi
export const EXERCISES = [
  { id: 'e1', name: 'Rondo 6v2', desc: 'Brz prenos lopte, prva lopta pod pritiskom.', section: 'Uvodni deo', tags: ['Posed'], image: '' },
  { id: 'e2', name: 'Build-up 3. trećine', desc: 'Izlazak ispod presinga, kreiranje viška.', section: 'Glavni deo', tags: ['Build-up'], image: '' },
  { id: 'e3', name: 'Poligon aer. izdržljivost', desc: 'Kontinuirano opterećenje sa loptom, 4×4\'.', section: 'Glavni deo', tags: ['Fizika'], image: '' },
  { id: 'e4', name: 'Presing okidači 8v8+3', desc: 'Kolektivni pritisak na ubacivanje u širinu.', section: 'Glavni deo', tags: ['Presing'], image: '' },
]
