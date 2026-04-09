'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'


export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayRecord, setTodayRecord] = useState(null)
  const [checking, setChecking] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const [adminStats, setAdminStats] = useState({ employees: 0, todayAttendance: 0, onLeave: 0, pendingLeaves: 0 })
  const [announcements, setAnnouncements] = useState([])
  const [officeLocation, setOfficeLocation] = useState(null)
  const [myWarnings, setMyWarnings] = useState([])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!session) return
    fetchTodayAttendance()
    fetchAnnouncements()
    fetchSettings()
    if (!isAdmin) fetchMyWarnings()
    if (isAdmin) fetchAdminStats()
  }, [session])

  const fetchMyWarnings = async () => {
    try {
      const res = await fetch('/api/warnings')
      const data = await res.json()
      setMyWarnings(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.officeLocation) setOfficeLocation(data.officeLocation)
    } catch {}
  }

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch(`/api/attendance?date=${today}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setTodayRecord(list.find(r => r.employee_id === session?.user?.email) || null)
    } catch {}
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch {}
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
      const today2 = today
      setAdminStats({
        employees: Array.isArray(employees) ? employees.length : 0,
        todayAttendance: Array.isArray(attendance) ? attendance.length : 0,
        onLeave: Array.isArray(leaves) ? leaves.filter(l => l.status === 'approved' && l.start_date <= today2 && l.end_date >= today2).length : 0,
        pendingLeaves: Array.isArray(leaves) ? leaves.filter(l => l.status === 'pending').length : 0,
      })
    } catch {}
  }

  const getGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS ไม่รองรับ / GPS를 지원하지 않습니다'))
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('ไม่สามารถรับตำแหน่งได้ กรุณาอนุญาต GPS / GPS 권한을 허용해주세요'))
    )
  })

  const handleCheckIn = async () => {
    setChecking(true)
    setGpsError('')
    try {
      let lat, lng
      if (officeLocation?.enabled) {
        try {
          const pos = await getGPS()
          lat = pos.lat; lng = pos.lng
        } catch (e) {
          setGpsError(e.message)
          setChecking(false)
          return
        }
      }
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checkin', lat, lng }),
      })
      const data = await res.json()
      if (data.success) await fetchTodayAttendance()
      else setGpsError(data.error || 'เกิดข้อผิดพลาด / 오류가 발생했습니다')
    } catch {}
    setChecking(false)
  }

  const handleCheckOut = async () => {
    setChecking(true)
    setGpsError('')
    try {
      let lat, lng
      if (officeLocation?.enabled) {
        try {
          const pos = await getGPS()
          lat = pos.lat; lng = pos.lng
        } catch (e) {
          setGpsError(e.message)
          setChecking(false)
          return
        }
      }
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checkout', lat, lng }),
      })
      const data = await res.json()
      if (data.success) await fetchTodayAttendance()
      else setGpsError(data.error || 'เกิดข้อผิดพลาด / 오류가 발생했습니다')
    } catch {}
    setChecking(false)
  }

  const formatTime = (d) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const formatDate = (d) => d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const checkedIn = !!todayRecord
  const checkedOut = !!todayRecord?.check_out

  const adminStatCards = [
    { label: 'พนักงานทั้งหมด', value: `${adminStats.employees} คน`, icon: '👥', color: '#4f62f7' },
    { label: 'มาทำงานวันนี้', value: `${adminStats.todayAttendance} คน`, icon: '✅', color: '#22c55e' },
    { label: 'กำลังลา', value: `${adminStats.onLeave} คน`, icon: '🌴', color: '#f59e0b' },
    { label: 'รออนุมัติ', value: `${adminStats.pendingLeaves} รายการ`, icon: '⏳', color: '#ef4444' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>
          {isAdmin ? `สวัสดี ${session?.user?.name?.split(' ')[0]}` : `สวัสดี 👋`}
        </h1>
        <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>{formatDate(currentTime)}</p>
      </div>

      {/* 출퇴근 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,98,247,0.15) 0%, rgba(124,58,237,0.1) 100%)',
        border: '1px solid rgba(79,98,247,0.25)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 4 }}>เวลาปัจจุบัน</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f1f3f9', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(currentTime)}
            </div>
            {checkedIn && (
              <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
                เข้างาน {todayRecord.check_in} {checkedOut && `| ออกงาน ${todayRecord.check_out}`}
              </div>
            )}
            {officeLocation?.enabled && (
              <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>📍 ต้องอยู่ในสำนักงาน (ระยะ {officeLocation.radius}ม.)</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCheckIn} disabled={checking || checkedIn} style={{
              padding: '10px 24px',
              background: checkedIn ? 'rgba(34,197,94,0.1)' : '#22c55e',
              color: checkedIn ? '#4ade80' : '#fff',
              border: checkedIn ? '1px solid rgba(34,197,94,0.3)' : 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: checkedIn ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {checkedIn ? '✓ เข้างานแล้ว' : checking ? 'กำลังดำเนินการ...' : 'เข้างาน'}
            </button>
            <button onClick={handleCheckOut} disabled={checking || !checkedIn || checkedOut} style={{
              padding: '10px 24px',
              background: (!checkedIn || checkedOut) ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.15)',
              color: (!checkedIn || checkedOut) ? '#8b91ab' : '#f87171',
              border: (!checkedIn || checkedOut) ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: (!checkedIn || checkedOut) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {checkedOut ? '✓ ออกงานแล้ว' : checking ? 'กำลังดำเนินการ...' : 'ออกงาน'}
            </button>
          </div>
        </div>
        {gpsError && (
          <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>
            ⚠️ {gpsError}
          </div>
        )}
      </div>

      {/* 관리자 통계 */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {adminStatCards.map((s, i) => (
            <div key={i} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}


      {/* 내 경고장 */}
      {!isAdmin && myWarnings.length > 0 && (
        <a href="/warnings" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>⚠️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                หนังสือเตือน ({myWarnings.length} ครั้ง)
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9', marginBottom: 4 }}>
                {['1차', '2차', '3차'][myWarnings[0].warning_number - 1] || `${myWarnings[0].warning_number}차`} 경고장
              </div>
              <div style={{ fontSize: 12, color: '#8b91ab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {myWarnings[0].reason_1 || myWarnings[0].reason}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#8b91ab', flexShrink: 0 }}>{myWarnings[0].issued_at}</div>
          </div>
        </a>
      )}

      {/* 공지사항 */}
      <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>📢 ประกาศ</h2>
          <a href="/announcements" style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>ดูทั้งหมด</a>
        </div>
        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8b91ab', fontSize: 13 }}>ไม่มีประกาศ</div>
        ) : announcements.map(a => (
          <a key={a.id} href="/announcements" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {a.pinned === 'true' && <span style={{ fontSize: 10, background: 'rgba(79,98,247,0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: 4, fontWeight: 600, marginRight: 6 }}>ปักหมุด</span>}
                <span style={{ fontWeight: 600, color: '#f1f3f9', fontSize: 14 }}>{a.title}</span>
                <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.content}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8b91ab', flexShrink: 0, marginLeft: 12 }}>{a.createdAt}</div>
            </div>
          </a>
        ))}
      </div>

    </div>
  )
}
