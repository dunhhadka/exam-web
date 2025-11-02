import { Dayjs } from 'dayjs'

export function formatInstant(instant: string): string {
  const date = new Date(instant)

  const pad = (n: number) => n.toString().padStart(2, '0')

  const hours = pad(date.getUTCHours())
  const minutes = pad(date.getUTCMinutes())
  const day = pad(date.getUTCDate())
  const month = pad(date.getUTCMonth() + 1)
  const year = date.getUTCFullYear()

  return `${hours}:${minutes} ${day}/${month}/${year}`
}

export function formatDateTimeToRequest(
  dateTime: Dayjs | null,
  defaultValue?: string
): string {
  if (!dateTime && !defaultValue) {
    throw new Error('require value for convert')
  }

  if (!dateTime && defaultValue) {
    return defaultValue
  }

  if (!dateTime) throw new Error()

  return dateTime.format('DD-MM-YYYY HH:mm')
}
