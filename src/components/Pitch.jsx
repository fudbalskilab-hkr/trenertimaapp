// Statička skica terena (placeholder za budući interaktivni editor).
// markers: [{x,y,team:'home'|'away'}], arrows:[{x1,y1,x2,y2,dash?}]
export default function Pitch({ markers = [], arrows = [], boxes = false, height = 200 }) {
  return (
    <svg viewBox="0 0 300 200" style={{ width: '100%', height, display: 'block', background: '#2f7d4f' }}>
      <rect x="8" y="8" width="284" height="184" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
      <line x1="150" y1="8" x2="150" y2="192" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      <circle cx="150" cy="100" r="26" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      {boxes && <>
        <rect x="8" y="60" width="34" height="80" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
        <rect x="258" y="60" width="34" height="80" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      </>}
      <defs>
        <marker id="pitch-ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8Z" fill="#ffd24a" />
        </marker>
      </defs>
      {arrows.map((a, i) => (
        <path key={i} d={`M${a.x1} ${a.y1} L${a.x2} ${a.y2}`} stroke="#ffd24a" strokeWidth="2.4"
          fill="none" strokeDasharray={a.dash ? '5 4' : undefined} markerEnd={a.dash ? undefined : 'url(#pitch-ar)'} />
      ))}
      {markers.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r="9" fill={m.team === 'away' ? '#D64545' : '#1656B0'} stroke="#fff" strokeWidth="2" />
      ))}
    </svg>
  )
}
