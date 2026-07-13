// Smanji sliku pre čuvanja (da cloud dokument ne postane prevelik).
// Vraća mali JPEG kao data URL.
// Učitaj grb sa URL-a i snimi kao mali PNG data URL (da radi trajno i u izvozu).
// Ako sajt blokira (CORS), vrati sam URL kao rezervu.
export function urlToCrest(url, max = 256) {
  return new Promise(resolve => {
    if (!url || !/^https?:\/\//i.test(url.trim())) { resolve(url.trim()); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        let w = img.width || max, h = img.height || max
        if (w > h && w > max) { h = Math.round(h * max / w); w = max }
        else if (h >= w && h > max) { w = Math.round(w * max / h); h = max }
        const c = document.createElement('canvas'); c.width = w; c.height = h
        c.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(c.toDataURL('image/png'))
      } catch (e) { resolve(url.trim()) } // CORS taint -> sačuvaj sam link
    }
    img.onerror = () => resolve(url.trim())
    img.src = url.trim()
  })
}

// png=true čuva providnost (za grbove); inače JPEG (manje, za slike/fotke)
export function shrinkImage(file, max = 512, png = false, quality = 0.72) {
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
        try { resolve(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', quality)) } catch (e) { resolve(rd.result) }
      }
      img.src = rd.result
    }
    rd.readAsDataURL(file)
  })
}
