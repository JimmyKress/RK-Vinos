import { wines as staticWines } from '../data/wines.js'

export function slugify(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getWineById(idOrSlug, wines = staticWines) {
  // Primero intenta por id exacto
  const byId = wines.find((w) => String(w.id) === String(idOrSlug))
  if (byId) return byId
  // Luego busca por slug del nombre
  return wines.find((w) => slugify(w.name) === String(idOrSlug)) || null
}

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function matchesWine(wine, query) {
  const q = normalizeText(query)
  if (!q) return true

  const haystack = normalizeText(
    [
      wine.name,
      wine.type,
      wine.varietal,
      wine.region,
      wine.year,
      wine.volumeMl
    ].join(' ')
  )

  return haystack.includes(q)
}
