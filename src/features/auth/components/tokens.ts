export const AUTH = {
  bg:      '#100D0A',
  surface: '#1C1815',
  sr:      '#252118',
  sh:      '#2D2922',
  border:  '#35302B',
  text:    '#F0EAE2',
  t2:      '#9E9488',
  t3:      '#6A635C',
  accent:  '#B8445A',
  green:   '#5CAF7E',
  red:     '#C43A3A',
  gold:    '#C49A20',
} as const;

export const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};
