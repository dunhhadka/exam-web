import { Dayjs } from 'dayjs'
import dayjs from 'dayjs' // Import dayjs để sử dụng
import customParseFormat from 'dayjs/plugin/customParseFormat' // Plugin để parse custom pattern
import isBetween from 'dayjs/plugin/isBetween'

// Kích hoạt plugin
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

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

export function isNowBetween(startTime: string, endTime: string): boolean {
  const format = 'DD-MM-YYYY HH:mm'
  const now = dayjs()
  const start = dayjs(startTime, format)
  const end = dayjs(endTime, format)

  if (!start.isValid() || !end.isValid()) {
    console.warn('Invalid date format in isNowBetween()', {
      startTime,
      endTime,
    })
    return false
  }

  return now.isBetween(start, end, null, '[]') // [] bao gồm cả biên
}

export const formatStartOfDay = (date: Date | Dayjs): string => {
  return dayjs(date).startOf('day').format('DD-MM-YYYY HH:mm:ss')
}

/**
 * Chuyển Date thành string với format DD-MM-YYYY 23:59:59
 */
export const formatEndOfDay = (date: Date | Dayjs): string => {
  return dayjs(date).endOf('day').format('DD-MM-YYYY HH:mm:ss')
}

export const getRemainingTime = (targetTime: string): number => {
  const target = new Date(targetTime).getTime()
  const now = Date.now()
  return target - now
}

export function parseCustomDateTime(dateStr: string): number {
  const date = dayjs(dateStr, 'DD-MM-YYYY HH:mm')

  if (!date.isValid()) {
    console.error('Invalid date format:', dateStr)
    return 0
  }

  return date.valueOf()
}
