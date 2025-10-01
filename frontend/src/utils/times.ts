export function formatInstant(instant: string): string {
  const date = new Date(instant)

  const pad = (n: number) => n.toString().padStart(2, '0')

  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()

  return `${hours}:${minutes} ${day}/${month}/${year}`
}
