import { Dayjs } from 'dayjs'
import dayjs from 'dayjs' // Import dayjs để sử dụng
import customParseFormat from 'dayjs/plugin/customParseFormat' // Plugin để parse custom pattern

// Kích hoạt plugin
dayjs.extend(customParseFormat)

export function formatInstant(instant: string): string {
  // Parse string "dd-MM-yyyy HH:mm" thành Dayjs (local time)
  const date = dayjs(instant, 'DD-MM-YYYY HH:mm')

  // Kiểm tra nếu parse thất bại
  if (!date.isValid()) {
    throw new Error(
      `Invalid LocalDateTime format: ${instant}. Expected: dd-MM-yyyy HH:mm`
    )
  }

  const pad = (n: number) => n.toString().padStart(2, '0')

  // Sử dụng Dayjs để lấy components (local, không UTC)
  const hours = pad(date.hour())
  const minutes = pad(date.minute())
  const day = pad(date.date())
  const month = pad(date.month() + 1)
  const year = date.year()

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
