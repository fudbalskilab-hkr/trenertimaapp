// Skica terena.
//  - schema=true: čista šema celog terena (bela pozadina, tanke linije) — kao šablon iz Excela;
//    ista za sve delove treninga (opis + grafički prikaz), prazna za crtanje/upload.
//  - inače: zeleni teren sa markerima/strelicama (koristi se za demo skice).
export default function Pitch({ markers = [], arrows = [], boxes = false, height = 200, schema = false }) {
  if (schema) return <SchemaPitch height={height} />
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

// Čista šema celog terena (landscape), stil iz Excela — bela, tanke linije.
function SchemaPitch({ height = 200 }) {
  const line = '#9aa7b6'
  return (
    <svg viewBox="0 0 300 190" style={{ width: '100%', height, display: 'block', background: '#f3f6f2' }}>
      <g fill="none" stroke={line} strokeWidth="1.4">
        <rect x="6" y="6" width="288" height="178" />
        <line x1="150" y1="6" x2="150" y2="184" />
        <circle cx="150" cy="95" r="24" />
        <circle cx="150" cy="95" r="1.6" fill={line} />
        {/* leva kaznena + gol */}
        <rect x="6" y="50" width="40" height="90" />
        <rect x="6" y="72" width="16" height="46" />
        {/* desna kaznena + gol */}
        <rect x="254" y="50" width="40" height="90" />
        <rect x="278" y="72" width="16" height="46" />
      </g>
    </svg>
  )
}
