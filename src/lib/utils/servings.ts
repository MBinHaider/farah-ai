export function adjustQuantity(
  baseQuantity: number,
  baseServings: number,
  targetServings: number,
): number {
  return (baseQuantity / baseServings) * targetServings
}

const FRACTION_MAP: [number, string][] = [
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
]

const TOLERANCE = 0.03

export function toFraction(value: number): string {
  if (Number.isInteger(value)) return String(value)
  const whole = Math.floor(value)
  const decimal = value - whole
  for (const [fraction, symbol] of FRACTION_MAP) {
    if (Math.abs(decimal - fraction) < TOLERANCE) {
      return whole > 0 ? `${whole} ${symbol}` : symbol
    }
  }
  return Number(value.toFixed(2)).toString()
}
