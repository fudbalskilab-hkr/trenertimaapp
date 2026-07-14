import { trainingOverview } from '../components/TrainingEditor'

// MC koristi pun naziv dana; kalendar ide po redosledu Pon..Ned (isti indeks)
export const MC_DAYS = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja']

// Sažetak jednog dana mikrociklusa za prikaz u kalendaru (samo pregled).
// di = indeks dana 0..6 (Pon..Ned). Vraća { intensity, slots:[{label,time,text}] } ili null.
export function mcDayOverview(mc, di) {
  if (!mc) return null
  const dayName = MC_DAYS[di]
  const dm = (mc.dayMeta || {})[dayName] || {}
  const single = !!dm.single
  const parts = single ? [['am', 'Trening']] : [['am', 'Prepodne'], ['pm', 'Popodne']]
  const slots = parts.map(([part, label]) => {
    const tr = dm[part + 'Training']
    let text = ''
    if (tr) {
      const ov = trainingOverview(tr)
      text = (ov && (ov.goal || (ov.parts[0] && ov.parts[0].txt))) || tr.name || 'Trening'
    } else {
      const sess = (mc.sessions || []).find(x => x.day === dayName && x.part === part)
      const secs = sess?.sections || {}
      const raw = secs['Glavni deo'] || Object.values(secs).find(Boolean) || ''
      text = raw.split('\n')[0].trim()
    }
    return { label, time: dm[part + 'Time'] || '', text }
  })
  return { intensity: dm.intensity, slots }
}
