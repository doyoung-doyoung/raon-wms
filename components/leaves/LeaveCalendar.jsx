'use client'

import { useState } from 'react'
import { format, addDays, isBefore, isAfter, isSameDay, isWeekend, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function LeaveCalendar({ onSelect, leaveType, holidays = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [hovering, setHovering] = useState(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 5일 전 제한 (병가 제외)
  const minDate = leaveType === 'sick' ? today : addDays(today, 5)

  const isHoliday = (date) => {
    return holidays.some(h => isSameDay(new Date(h.date), date))
  }

  const isDisabled = (date) => {
    if (isBefore(date, minDate)) return true
    if (isWeekend(date)) return true
    if (isHoliday(date)) return true
    return false
  }

  const isInRange = (date) => {
    const end = endDate || hovering
    if (!startDate || !end) return false
    return isAfter(date, startDate) && isBefore(date, end)
  }

  const handleDayClick = (date) => {
    if (isDisabled(date)) return
    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate(null)
      onSelect({ startDate: date, endDate: null, days: 0 })
    } else {
      if (isBefore(date, startDate)) {
        setStartDate(date)
        setEndDate(null)
        onSelect({ startDate: date, endDate: null, days: 0 })
      } else {
        setEndDate(date)
        // 영업일만 계산 (주말, 공휴일 제외)
        const allDays = eachDayOfInterval({ start: startDate, end: date })
        const workDays = allDays.filter(d => !isWeekend(d) && !isHoliday(d))
        onSelect({ startDate, endDate: date, days: workDays.length })
      }
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeks = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, userSelect: 'none' }}>
      {/* 월 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
          style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 18, padding: '0 8px' }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>
          {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
        </span>
        <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
          style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 18, padding: '0 8px' }}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {weeks.map((w, i) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : '#8b91ab', padding: '4px 0' }}>{w}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isStart = startDate && isSameDay(day, startDate)
          const isEnd = endDate && isSameDay(day, endDate)
          const inRange = isInRange(day)
          const disabled = isDisabled(day)
          const holiday = isHoliday(day)
          const isSun = day.getDay() === 0
          const isSat = day.getDay() === 6

          let bg = 'transparent'
          let color = !isCurrentMonth ? '#3d4060' : disabled ? '#3d4060' : isSun ? '#f87171' : isSat ? '#60a5fa' : '#f1f3f9'
          let borderRadius = 8

          if (isStart || isEnd) { bg = '#4f62f7'; color = '#fff' }
          else if (inRange) { bg = 'rgba(79,98,247,0.2)'; color = '#818cf8'; borderRadius = 0 }
          if (holiday && isCurrentMonth) { color = '#f59e0b' }

          return (
            <div key={idx}
              onClick={() => isCurrentMonth && handleDayClick(day)}
              onMouseEnter={() => startDate && !endDate && setHovering(day)}
              onMouseLeave={() => setHovering(null)}
              style={{
                textAlign: 'center', padding: '6px 2px', fontSize: 12, fontWeight: isStart || isEnd ? 700 : 400,
                color, background: bg, borderRadius,
                cursor: isCurrentMonth && !disabled ? 'pointer' : 'default',
                opacity: !isCurrentMonth ? 0.3 : 1,
                transition: 'all 0.1s',
              }}
            >
              {format(day, 'd')}
              {holiday && isCurrentMonth && <div style={{ width: 4, height: 4, background: '#f59e0b', borderRadius: '50%', margin: '1px auto 0' }} />}
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#8b91ab' }}>
        <span><span style={{ color: '#4f62f7' }}>■</span> 선택</span>
        <span><span style={{ color: '#f59e0b' }}>●</span> 공휴일</span>
        <span><span style={{ color: '#f87171' }}>일</span> 일요일</span>
        {leaveType !== 'sick' && <span style={{ color: '#f87171' }}>※ 5일 전 신청 필요</span>}
      </div>
    </div>
  )
}
