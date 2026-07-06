// Skine JSON kao fajl (backup).
export function downloadJSON(json, name = 'trenertima-backup.json') {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

// Bezbedno učitavanje demo podataka: ako već ima igrača, prvo skine backup.
export function safeLoadDemo(store) {
  if ((store.players || []).length > 0) {
    if (!confirm('Ovo ZAMENJUJE trenutne podatke DEMO primerima.\nPrvo će se skinuti backup tvojih trenutnih podataka (za svaki slučaj).\nNastaviti?')) return false
    downloadJSON(store.exportData(), 'trenertima-backup-pre-demo.json')
  }
  store.resetAll()
  return true
}
