import { useEffect, useState } from 'react'
import { parse } from 'path'
import { parseCustomDateTime } from '../utils/times'

const COUNTDOWN_THRESHOLD = 5 * 60 * 1000

export type ExamTimeStatus =
  | 'NOT_STARTED'
  | 'COUNTDOWN'
  | 'IN_PROGRESS'
  | 'ENDED'

export function useExamCountDown(startTime: string, endTime: string) {
  const getExamTimeStatus = (
    startTime: string | number | Date,
    endTime: string | number | Date
  ): ExamTimeStatus => {
    const now = Date.now()
    const start = parseCustomDateTime(startTime.toString())
    const end = parseCustomDateTime(endTime.toString())

    if (now > end) return 'ENDED'
    if (now >= start && now <= end) return 'IN_PROGRESS'

    const diffToStart = start - now
    if (diffToStart <= COUNTDOWN_THRESHOLD) {
      return 'COUNTDOWN'
    }

    return 'NOT_STARTED'
  }

  const [status, setStatus] = useState<ExamTimeStatus>(() =>
    getExamTimeStatus(startTime, endTime)
  )

  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const start = parseCustomDateTime(startTime)
      const end = parseCustomDateTime(endTime)

      if (now > end) {
        setStatus('ENDED')
        setRemaining(0)
        return
      }

      if (now >= start) {
        setStatus('IN_PROGRESS')
        setRemaining(0)
        return
      }
      const diff = start - now

      if (diff <= COUNTDOWN_THRESHOLD) {
        setStatus('COUNTDOWN')
        setRemaining(diff)
      } else {
        setStatus('NOT_STARTED')
        setRemaining(0)
      }
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [startTime, endTime])

  return {
    status,
    remaining,
  }
}
