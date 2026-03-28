'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayRecord, setTodayRecord] = useState(null)
  const [checking, setChecking] = useState(false)
  const [balance, setBalance] = useState(null)
  const [adminStats, setAdminStats] = useState({ employees: 0, todayAttendance: 0, onLeave: 0, pendingLeaves: 0 })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (session) {
      fetchTodayAttendance()
      if (!session.isAdmin) fetchBalance()
      if (session.isAdmin) fetchAdminStats()
    }
  }, [session])

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch(`/api/attendance?date=${today}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      const mine = list.find(r => r.employee_id === session?.user?.email)
      setTodayRecord(mine || null)
    } catch (e) { console.error(e) }
  }

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/leaves/balance')
      const data = await res.json()
      if (data.balance) setBalance(data.balance)
    } catch (e) { console.error(e) }
  }

  const fetchAdminStats = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [empRes, attRes, leaveRes] = await Promise.all([
        fetch('/api/employees'),
        fetch(`/api/attendance?date=${today}`),
        fetch('/api/leaves'),
      ])
      const employees = await empRes.json()
      const attendance = await attRes.json()
      const leaves = await leaveRes.json()

      const pendingLeaves = Array.isArray(leaves) ? leaves.filter(l => l.status === 'pending').length : 0
      const onLeave = Array.isArray(leaves) ? leaves.filter(l => l.status === 'approved' && l.start_date <= today && l.end_date >= today).length : 0

      setAdminStats({
        employees: Array.isArray(employees) ? employees.length : 0,
        todayAttendance: Array.isArray(attendance) ? attendance.length : 0,
        onLeave,
        pendingLeaves,
      })
    } catch (e) { console.error(e) }
  }

  const handleCheckIn = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checkin' }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchTodayAttendance()
      } else {
        alert(data.error || '출근 처리 실패')
      }
    } catch (e) { console.error(e) }
    setChecking(false)
  }

  const handleCheckOut = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checkout' }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchTodayAttendance()
      } else {
        alert(data.error || '퇴근 처리 실패')
      }
    } catch (e) { console.error(e) }
    setChecking(false)
  }

  const formatTime = (date) => date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const formatDate = (date) => date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const isAdmin = session?.isAdmin

  const stats = isAdmin
    ? [
        { label: '전체 직원', value: `${adminStats.employees}명`, icon: '👥', color: '#4f62f7' },
        { label: '오늘 출근', value: `${adminStats.todayAttendance}명`, icon: '✅', color: '#22c55e' },
        { label: '휴가 중', value: `${adminStats.onLeave}명`, icon: '🌴', color: '#f59e0b' },
        { label: '대기 중 승인', value: `${adminStats.pendingLeaves}건`, icon: '⏳', color: '#ef4444' },
      ]
    : [
        { label: '잔여 연차', value: balance ? `${balance.annual.remaining}일` : '- 일', icon: '🌴', color: '#4f62f7' },
        { label: '잔여 병가', value: balance ? `${balance.sick.remaining}일` : '- 일', icon: '🏥', color: '#22c55e' },
        { label: '잔여 경조사', value: balance ? `${balance.personal.remaining}일` : '- 일', icon: '🌸', color: '#f59e0b' },
        { label: '이번달 출근', value: '- 일', icon: '📅', color: '#8b5cf6' },
      ]

  const announcements = []
  const checkedIn = !!todayRecord
  const checkedOut = !!todayRecord?.check_out

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>
          안녕하세요, {session?.user?.name?.split(' ')[0]}님
        </h1>
        <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>
          {formatDate(currentTime)}
        </p>
      </div>

      {/* 출퇴근 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,98,247,0.15) 0%, rgba(124,58,237,0.1) 100%)',
        border: '1px solid rgba(79,98,247,0.25)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 4 }}>현재 시간</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f1f3f9', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(currentTime)}
          </div>
          {checkedIn && (
            <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
              출근 {todayRecord.check_in} {checkedOut && `| 퇴근 ${todayRecord.check_out}`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCheckIn}
            disabled={checking || checkedIn}
            style={{
              padding: '10px 24px',
              background: checkedIn ? 'rgba(34,197,94,0.1)' : '#22c55e',
              color: checkedIn ? '#4ade80' : '#fff',
              border: checkedIn ? '1px solid rgba(34,197,94,0.3)' : 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: checkedIn ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            {checkedIn ? '출근 완료' : checking ? '처리 중...' : '출근 체크'}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={checking || !checkedIn || checkedOut}
            style={{
              padding: '10px 24px',
              background: (!checkedIn || checkedOut) ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.15)',
              color: (!checkedIn || checkedOut) ? '#8b91ab' : '#f87171',
              border: (!checkedIn || checkedOut) ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {checkedOut ? '퇴근 완료' : checking ? '처리 중...' : '퇴근 체크'}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            background: '#141828', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 공지사항 */}
      <div style={{
        background: '#141828', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>공지사항</h2>
          {isAdmin && (
            <button style={{
              padding: '5px 12px', background: 'rgba(79,98,247,0.15)', color: '#818cf8',
              border: '1px solid rgba(79,98,247,0.25)', borderRadius: 7,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + 공지 작성
            </button>
          )}
        </div>
        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8b91ab', fontSize: 13 }}>
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontWeight: 600, color: '#f1f3f9', marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#8b91ab' }}>{a.date}</div>
            </div>
          ))
        )}
      </div>

      {/* 빠른 메뉴 (직원용) */}
      {!isAdmin && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9', marginBottom: 14 }}>빠른 메뉴</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { icon: '🌴', label: '연차 신청', href: '/leaves' },
              { icon: '🏥', label: '병가 신청', href: '/leaves' },
              { icon: '🌸', label: '경조사 신청', href: '/leaves' },
              { icon: '💰', label: '경비 청구', href: '/expenses/new' },
            ].map((item, i) => (
              <a key={i} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#141828', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '20px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,98,247,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, color: '#f1f3f9', fontWeight: 500 }}>{item.label}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}