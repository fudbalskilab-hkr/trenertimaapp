// Početni podaci — preuzeto iz "FK Brodarac OLS.xlsx".
// Kasnije se sve čuva u Firebase; za sada u localStorage (vidi store.js).

export const TEAM = {
  name: 'FK Brodarac',
  category: 'Omladinci',
  season: '2026/27',
  period: 'Pripremni period',
}

let _id = 1
const uid = () => 'p' + (_id++)

export const PLAYERS = [
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

// Meseci članarine (sezona kreće u julu)
export const FEE_MONTHS = ['jul', 'avg', 'sep', 'okt', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun']

// Utakmice (Kalendar aktivnosti)
export const MATCHES = [
  { id: 'm1', date: '2026-07-10', time: '17:30', opp: 'Prva iskra Barič', home: true,  comp: 'Prijateljska', crest: '', gf: null, ga: null, events: [], lineup: [] },
  { id: 'm2', date: '2026-07-15', time: '18:00', opp: 'IMT',             home: false, comp: 'Prijateljska', crest: '', gf: null, ga: null, events: [], lineup: [] },
  { id: 'm3', date: '2026-07-19', time: '17:00', opp: 'Ušće',            home: true,  comp: 'Prijateljska', crest: '', gf: null, ga: null, events: [], lineup: [] },
  { id: 'm4', date: '2026-07-22', time: '17:00', opp: 'Grafičar',        home: false, comp: 'Prijateljska', crest: '', gf: null, ga: null, events: [], lineup: [] },
]

const DAYS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

// Kalendar aktivnosti — nedelje sa danima; svaki dan Prepodne (am) / Popodne (pm)
// Vrednost: string aktivnosti, "/" = slobodno, ili {matchId} za utakmicu
function week(startISO, cells) {
  const days = DAYS.map((d, i) => {
    const dt = new Date(startISO)
    dt.setDate(dt.getDate() + i)
    const iso = dt.toISOString().slice(0, 10)
    const c = cells[i] || {}
    return { day: d, date: iso, am: c.am ?? '/', pm: c.pm ?? '/', matchId: c.matchId || null }
  })
  return { start: startISO, days }
}

export const CALENDAR = [
  week('2026-07-06', [
    { am: 'Snaga — donji ekst.\nPoligoni aer. izdr.', pm: 'Passing drill\nBuild-up + press' },
    { am: 'Tehnika + posed', pm: 'Igra 8v8' },
    { am: '/', pm: 'Regeneracija' },
    { am: 'Brzina + agilnost', pm: 'Tranzicije' },
    { matchId: 'm1' },
    { am: 'Analiza meča', pm: '/' },
    { am: '/', pm: '/' },
  ]),
  week('2026-07-13', [
    { am: 'Snaga — gornji ekst.', pm: 'Prekidi' },
    { am: 'Posed lopte', pm: 'Igra 11v11' },
    { matchId: 'm2' },
    { am: '/', pm: 'Regeneracija' },
    { am: 'Odbrana zone', pm: 'Napad — širina' },
    { matchId: 'm3' },
    { am: '/', pm: '/' },
  ]),
  week('2026-07-20', [
    { am: 'Snaga', pm: 'Presing' },
    { am: 'Tranzicije', pm: 'Igra' },
    { matchId: 'm4' },
    { am: '/', pm: '/' },
    { am: '/', pm: '/' },
    { am: '/', pm: '/' },
    { am: '/', pm: '/' },
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
