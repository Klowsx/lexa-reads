// Onboarding stores IDs; older profile editors stored Spanish labels.
const LEGACY_GENRES: Record<string, string> = {
  Fantasía: 'fantasia',
  'Realismo mágico': 'realismo',
  'Ciencia ficción': 'scifi',
  Misterio: 'misterio',
  Romance: 'romance',
  'Dark Academia': 'dark',
  Clásicos: 'clasico',
  Memorias: 'memorias',
  Historia: 'historia',
  Histórico: 'historico',
  Thriller: 'thriller',
  Ensayo: 'ensayo',
  Poesía: 'poesia',
  Terror: 'terror'
}

export const PROFILE_GENRES = Object.values(LEGACY_GENRES)

export function normalizeProfileGenres(genres: string[] | null) {
  return [
    ...new Set(
      (genres ?? []).map((genre) =>
        Object.hasOwn(LEGACY_GENRES, genre) ? LEGACY_GENRES[genre] : genre
      )
    )
  ]
}
