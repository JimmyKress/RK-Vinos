export function coverSvgDataUri({ title, subtitle, tone = 'tinto' }) {
  const safeTitle = String(title || '').slice(0, 42)
  const safeSubtitle = String(subtitle || '').slice(0, 42)

  const tones = {
    tinto: {
      a: '#b01a2c',
      b: '#1a0a0d',
      c: '#e8b85c'
    },
    blanco: {
      a: '#e8b85c',
      b: '#0b0b0d',
      c: '#f3f3f6'
    },
    espumante: {
      a: '#c7c7d2',
      b: '#0b0b0d',
      c: '#e8b85c'
    }
  }

  const t = tones[tone] || tones.tinto

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.a}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${t.b}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${t.a}" stop-opacity="0.80"/>
    </linearGradient>
    <radialGradient id="r" cx="30%" cy="10%" r="80%">
      <stop offset="0%" stop-color="${t.c}" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="${t.c}" stop-opacity="0"/>
    </radialGradient>
    <filter id="n" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.12 0"/>
    </filter>
  </defs>

  <rect width="1200" height="800" fill="url(#g)"/>
  <rect width="1200" height="800" fill="url(#r)"/>
  <rect width="1200" height="800" filter="url(#n)" opacity="0.25"/>

  <g fill="none" stroke="${t.c}" opacity="0.16">
    <path d="M90 640 C 250 500, 440 760, 620 610 S 980 520, 1110 640" stroke-width="2"/>
    <path d="M70 220 C 210 110, 430 320, 590 210 S 910 120, 1130 240" stroke-width="2"/>
  </g>

  <g font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" fill="#f3f3f6">
    <text x="70" y="120" font-size="26" opacity="0.92" letter-spacing="1">RK VINOS</text>
    <text x="70" y="185" font-size="60" font-weight="700" letter-spacing="0.5">${escapeXml(safeTitle)}</text>
    <text x="70" y="245" font-size="28" opacity="0.78">${escapeXml(safeSubtitle)}</text>
  </g>

  <g opacity="0.22">
    <rect x="920" y="110" width="210" height="580" rx="70" fill="#000"/>
    <rect x="946" y="150" width="158" height="500" rx="60" fill="#111"/>
    <rect x="954" y="168" width="142" height="90" rx="26" fill="${t.a}"/>
  </g>
</svg>`

  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, '')
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')

  return `data:image/svg+xml,${encoded}`
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
