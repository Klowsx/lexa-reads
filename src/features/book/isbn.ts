// Normaliza ISBN-13 quitando guiones y espacios antes de consultar o crear una ficha.
export function normalizeIsbn13(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

// Distingue un ISBN-13 completo para ofrecer el alta con el identificador precargado.
export function isIsbn13(value: string): boolean {
  return normalizeIsbn13(value).length === 13
}
