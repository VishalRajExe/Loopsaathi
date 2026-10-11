// The API accepts numeric kilograms > 0 and <= 100, with at most three decimals.
export function parseWeight(value) {
  const text = String(value ?? '').trim()
  if (!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(text)) return null
  const kg = Number(text)
  return Number.isFinite(kg) && kg > 0 && kg <= 100 ? kg : null
}

// Integer thousandths avoid losing a measured value such as 0.125 kg on +/- taps.
export function stepWeight(value, direction) {
  const kg = parseWeight(value)
  if (kg === null) return value === '' && direction === 1 ? 0.5 : value
  const thousandths = Math.round(kg * 1000) + direction * 500
  return Math.min(100000, Math.max(1, thousandths)) / 1000
}
