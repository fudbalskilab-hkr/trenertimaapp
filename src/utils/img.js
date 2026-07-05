// Smanji sliku pre čuvanja (da cloud dokument ne postane prevelik).
// Vraća mali JPEG kao data URL.
export function shrinkImage(file, max = 512, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader()
    rd.onerror = reject
    rd.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let w = img.width, h = img.height
        if (w > h && w > max) { h = Math.round(h * max / w); w = max }
        else if (h >= w && h > max) { w = Math.round(w * max / h); h = max }
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        c.getContext('2d').drawImage(img, 0, 0, w, h)
        try { resolve(c.toDataURL('image/jpeg', quality)) } catch (e) { resolve(rd.result) }
      }
      img.src = rd.result
    }
    rd.readAsDataURL(file)
  })
}
