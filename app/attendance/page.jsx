'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function AttendancePage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayRecord, setTodayRecord] = useState(null)
  const [checking, setChecking] = useState(false)

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const today = now.toISOString().slice(0, 10)

  useEffect(() => {
    fetchRecords()
  }, [session, currentMonth])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?month=${currentMonth}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setRecords(list.sort((a, b) => b.date.localeCompare(a.date)))

      if (!isAdmin) {
        const mine = list.find(r => r.employee_id === session?.user?.email && r.date === today)
        setTodayRecord(mine || null)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
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
        await fetchRecords()
      } else {
        alert(data.error || 'เช็คอินล้มเหลว')
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
        await fetchRecords()
      } else {
        alert(data.error || 'เช็คเอาต์ล้มเหลว')
      }
    } catch (e) { console.error(e) }
    setChecking(false)
  }

  const prevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 2)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const nextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const isCurrentMonth = currentMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [dispYear, dispMonth] = currentMonth.split('-')

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>บันทึกเวลา</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>ทั้งหมด {records.length} รายการ</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>🏠 หน้าหลัก</a>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '4px 8px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9', minWidth: 72, textAlign: 'center' }}>{dispYear}.{dispMonth}</span>
            <button onClick={nextMonth} disabled={isCurrentMonth} style={{ background: 'none', border: 'none', color: isCurrentMonth ? '#3d4060' : '#8b91ab', cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>›</button>
          </div>
        </div>
      </div>

      {/* 출퇴근 버튼 (직원용, 이번 달 볼 때만) */}
      {!isAdmin && isCurrentMonth && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79,98,247,0.15) 0%, rgba(124,58,237,0.1) 100%)',
          border: '1px solid rgba(79,98,247,0.25)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 4 }}>การลงเวลาวันนี้ ({today})</div>
            {todayRecord ? (
              <div>
                <div style={{ fontSize: 15, color: '#4ade80', fontWeight: 600 }}>
                  เข้างาน {todayRecord.check_in}
                </div>
                {todayRecord.check_out && (
                  <div style={{ fontSize: 15, color: '#f87171', fontWeight: 600, marginTop: 2 }}>
                    ออกงาน {todayRecord.check_out}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 15, color: '#8b91ab' }}>ยังไม่ได้เข้างาน</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleCheckIn}
              disabled={checking || !!todayRecord}
              style={{
                padding: '10px 24px',
                background: todayRecord ? 'rgba(34,197,94,0.1)' : '#22c55e',
                color: todayRecord ? '#4ade80' : '#fff',
                border: todayRecord ? '1px solid rgba(34,197,94,0.3)' : 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: todayRecord ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {todayRecord ? '✓ เข้างานแล้ว' : checking ? 'กำลังดำเนินการ...' : 'เข้างาน'}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={checking || !todayRecord || !!todayRecord?.check_out}
              style={{
                padding: '10px 24px',
                background: (!todayRecord || todayRecord?.check_out) ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.15)',
                color: (!todayRecord || todayRecord?.check_out) ? '#8b91ab' : '#f87171',
                border: (!todayRecord || todayRecord?.check_out) ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: (!todayRecord || todayRecord?.check_out) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {todayRecord?.check_out ? '✓ ออกงานแล้ว' : checking ? 'กำลังดำเนินการ...' : 'ออกงาน'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b91ab' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          กำลังโหลด...
        </div>
      ) : records.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8b91ab' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 6 }}>ไม่มีบันทึกเวลา</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(record => (
            <div key={record.id} style={{
              background: record.date === today ? 'rgba(79,98,247,0.06)' : '#141828',
              border: `1px solid ${record.date === today ? 'rgba(79,98,247,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: record.check_out ? 'rgba(79,98,247,0.1)' : 'rgba(34,197,94,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {record.check_out ? '✓' : '▶'}
                </div>
                <div>
                  {isAdmin && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 4 }}>
                      {record.employee_name}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: record.date === today ? '#818cf8' : '#8b91ab', fontWeight: record.date === today ? 600 : 400 }}>
                    {record.date}
                    {record.date === today && <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(79,98,247,0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: 4 }}>วันนี้</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 2 }}>เข้างาน</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: record.is_late === 'true' ? '#f59e0b' : '#4ade80' }}>
                      {record.check_in || '-'}
                    </span>
                    {record.is_late === 'true' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>มาสาย</span>
                    )}
                  </div>
                </div>
                <div style={{ color: '#8b91ab' }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 2 }}>ออกงาน</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: record.check_out ? (record.is_early === 'true' ? '#f97316' : '#f87171') : '#8b91ab' }}>
                      {record.check_out || '-'}
                    </span>
                    {record.is_early === 'true' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>ออกก่อน</span>
                    )}
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                background: record.check_out ? 'rgba(79,98,247,0.1)' : 'rgba(34,197,94,0.1)',
                color: record.check_out ? '#818cf8' : '#4ade80',
              }}>
                {record.check_out ? 'เลิกงานแล้ว' : 'กำลังทำงาน'}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
