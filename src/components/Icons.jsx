const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  dash: () => <svg viewBox="0 0 24 24" {...S}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  players: () => <svg viewBox="0 0 24 24" {...S}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.6 2.5-5.5 5.5-5.5s5.5 1.9 5.5 5.5"/><path d="M16 5.2A3 3 0 0 1 16 11M18 20c0-3-1-4.7-3-5.5"/></svg>,
  cal: () => <svg viewBox="0 0 24 24" {...S}><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>,
  mc: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12A8 8 0 0 1 6.3 17.6"/><path d="M17 3v4h-4M7 21v-4h4"/></svg>,
  train: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 5h16v14H4z"/><path d="M4 12h16M12 5v14"/><circle cx="12" cy="12" r="2.2"/></svg>,
  match: () => <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="9"/><path d="m12 7 3 2.2-1.1 3.6h-3.8L9 9.2 12 7Z"/></svg>,
  ex: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5Z"/><path d="M4 19.5V6.5"/></svg>,
  gps: () => <svg viewBox="0 0 24 24" {...S}><path d="M13 3l-1.5 8h5L10 21l1.5-8h-5z"/></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  moon: () => <svg viewBox="0 0 24 24" {...S}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>,
  team: () => <svg viewBox="0 0 24 24" {...S}><circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3.3 2.4-5 5.5-5s5.5 1.7 5.5 5"/></svg>,
  shield: () => <svg viewBox="0 0 24 24" {...S}><path d="M12 2 3 7v6c0 5 3.8 8 9 9 5.2-1 9-4 9-9V7Z"/></svg>,
  upload: () => <svg viewBox="0 0 24 24" {...S}><path d="M12 15V4M8 8l4-4 4 4M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>,
  download: () => <svg viewBox="0 0 24 24" {...S}><path d="M12 4v11M8 11l4 4 4-4M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>,
  gear: () => <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 2H9.8L9.4 4.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4.4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12Z"/></svg>,
  player: () => <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>,
  ball: () => <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="7.5"/></svg>,
  cone: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h8l-2 12h-4z"/></svg>,
  arrow: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 12h14M13 6l6 6-6 6"/></svg>,
  trash: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>,
  edit: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20z"/><path d="M13.5 6.5l4 4"/></svg>,
  close: () => <svg viewBox="0 0 24 24" {...S}><path d="M6 6l12 12M18 6L6 18"/></svg>,
}

import brodaracLogo from '../assets/brodarac.png'

export function Crest({ size = 40, url = '' }) {
  // uploadovan grb (npr. protivnik)
  if (url) return <img className="crest" src={url} alt="grb"
    style={{ width: size, height: size, borderRadius: Math.round(size * 0.18), objectFit: 'contain' }} />
  // podrazumevani grb kluba (FK Brodarac) — providan, bez ičega okolo
  return <img className="crest" src={brodaracLogo} alt="grb FK Brodarac"
    style={{ height: size * 1.15, width: 'auto', objectFit: 'contain', display: 'block' }} />
}
