import html2canvas from 'html2canvas'

// Napravi PNG od DOM elementa i skine ga. Vraća Promise.
export async function exportNodeAsImage(node, filename = 'slika.png') {
  if (!node) return
  const canvas = await html2canvas(node, {
    backgroundColor: getComputedStyle(document.body).backgroundColor || '#fff',
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    logging: false,
  })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
}
