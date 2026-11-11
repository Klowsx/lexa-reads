import { themes } from '~/theme/tokens.json'

// Calcula luminancia relativa sRGB para comprobar legibilidad del tema compartido.
function luminance(hex: string) {
  const rgb = hex.match(/[a-f0-9]{2}/gi)!.map((channel) => {
    const value = parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}

// Contrasta cada par sin depender de cuál sea más claro.
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe.each(Object.entries(themes))(
  'Contraste AA del tema %s',
  (_, palette) => {
    it('mantiene texto, ayudas y mensajes legibles sobre todas las superficies', () => {
      for (const text of [
        'text',
        't2',
        't3',
        'error',
        'success',
        'warning'
      ] as const)
        for (const surface of ['bg', 'surface', 'sr', 'sh'] as const)
          expect(
            contrast(palette[text], palette[surface])
          ).toBeGreaterThanOrEqual(4.5)
    })
    it('mantiene legible el contenido de las acciones principales', () => {
      expect(contrast(palette.accent, palette.onAccent)).toBeGreaterThanOrEqual(
        4.5
      )
    })
  }
)
