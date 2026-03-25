import { differenceInDays, addYears, startOfDay } from 'date-fns'

/**
 * 연차 계산 (태국 노동법 기준)
 * - 1년차: 6일
 * - 매년 +1일
 * - 최대 20일
 */
export function calculateAnnualLeave(startDate) {
  const start = startOfDay(new Date(startDate))
  const today = startOfDay(new Date())
  const yearsWorked = Math.floor(differenceInDays(today, start) / 365)

  const totalEntitled = Math.min(6 + yearsWorked, 20)
  return {
    yearsWorked,
    totalEntitled,
  }
}

/**
 * 병가 한도 (태국 노동법)
 * - 연 30일 유급
 * - 이후 무급
 * - 3일 초과 시 진단서 필요
 */
export const SICK_LEAVE_LIMIT = 30
export const SICK_LEAVE_CERT_REQUIRED_DAYS = 3

/**
 * 경조사 휴가 (ลากิจ)
 * - 연 3일 유급
 * - 이후 이사 승인 필요 (무급)
 */
export const PERSONAL_LEAVE_PAID_LIMIT = 3

/**
 * 휴가 신청 최소 사전 일수 (5일 전)
 */
export const LEAVE_ADVANCE_DAYS = 5

/**
 * 휴가 신청 가능 여부 검증
 */
export function validateLeaveRequest({ startDate, leaveType, usedDays, startWorkDate }) {
  const errors = []
  const today = startOfDay(new Date())
  const leaveStart = startOfDay(new Date(startDate))

  // 5일 전 신청 체크 (연차/경조사)
  if (leaveType !== 'sick') {
    const daysUntilLeave = differenceInDays(leaveStart, today)
    if (daysUntilLeave < LEAVE_ADVANCE_DAYS) {
      errors.push(`휴가는 ${LEAVE_ADVANCE_DAYS}일 전에 신청해야 합니다.`)
    }
  }

  // 잔여 일수 체크
  if (leaveType === 'annual') {
    const { totalEntitled } = calculateAnnualLeave(startWorkDate)
    if (usedDays >= totalEntitled) {
      errors.push(`연차 잔여 일수가 부족합니다. (총 ${totalEntitled}일)`)
    }
  }

  if (leaveType === 'sick' && usedDays >= SICK_LEAVE_LIMIT) {
    errors.push(`병가 한도(${SICK_LEAVE_LIMIT}일)를 초과했습니다. 이후는 무급 처리됩니다.`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 무급 차감 금액 계산
 * @param {number} monthlySalary - 월급
 * @param {number} unpaidDays - 무급 일수
 * @param {number} workingDaysInMonth - 해당 월 근무일 수 (기본 26일)
 */
export function calculateDeduction(monthlySalary, unpaidDays, workingDaysInMonth = 26) {
  const dailyRate = monthlySalary / workingDaysInMonth
  return Math.round(dailyRate * unpaidDays)
}
