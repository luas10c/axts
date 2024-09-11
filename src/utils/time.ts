const seconds = 1000
const minutes = seconds * 60
const hours = minutes * 60
const days = hours * 24

function ms(value: number) {
  const timeIntervals = [
    { threshold: days, label: 'd' },
    { threshold: hours, label: 'h' },
    { threshold: minutes, label: 'm' },
    { threshold: seconds, label: 's' }
  ]

  for (const interval of timeIntervals) {
    if (value > interval.threshold) {
      return `${(value / interval.threshold).toFixed(2)}${interval.label}`
    }
  }

  return `${value.toFixed(2)}ms`
}

export const time = {
  ms
}
