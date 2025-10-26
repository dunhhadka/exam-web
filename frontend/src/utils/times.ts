import { Dayjs } from 'dayjs'

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
