// Ocena 5–10 sa decimalama, klizač + gradijent boja (crvena→plava).
const STOPS = [
  [5.0, [214, 69, 69]],    // crvena (najgora)
  [5.83, [232, 134, 43]],  // narandžasta
  [6.67, [228, 182, 43]],  // žuta
  [7.5, [143, 209, 79]],   // svetlo zelena
  [8.33, [47, 163, 107]],  // zelena
  [9.17, [90, 176, 240]],  // svetlo plava
  [10.0, [22, 86, 176]],   // plava (najbolja)
]
export function ratingColor(v) {
  if (v == null || isNaN(v)) return '#8A99B5'
  const x = Math.max(5, Math.min(10, v))
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i]
      const t = (x - a) / (b - a)
      const c = ca.map((v0, k) => Math.round(v0 + (cb[k] - v0) * t))
      return `rgb(${c[0]},${c[1]},${c[2]})`
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1].join(',')})`
}
const GRAD = `linear-gradient(90deg, ${STOPS.map(s => `rgb(${s[1].join(',')}) ${((s[0] - 5) / 5 * 100).toFixed(0)}%`).join(', ')})`

export default function RatingSlider({ value, onChange }) {
  const has = value != null && value !== ''
  const v = has ? Number(value) : 7.5
  const col = has ? ratingColor(v) : '#8A99B5'
  return (
    <div className="rslider">
      <input type="range" min="5" max="10" step="0.1" value={v}
        style={{ background: GRAD }}
        onChange={e => onChange(Number(e.target.value))} aria-label="Ocena" />
      <span className="rslider-val" style={{ background: col }}>{has ? v.toFixed(1).replace('.', ',') : '—'}</span>
      {has
        ? <button className="rslider-x" title="Obriši ocenu" onClick={() => onChange(undefined)}>×</button>
        : <button className="rslider-set" onClick={() => onChange(7.5)}>oceni</button>}
    </div>
  )
}
