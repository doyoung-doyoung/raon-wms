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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    fetchRecords()
  }, [session, selectedDate])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setRecords(list)

      // 오늘 내 기록 찾기
      if (!isAdmin) {
        const today = new Date().toISOString().slice(0, 10)
        if (selectedDate === today) {
          const mine = list.find(r => r.employee_id === session?.user?.email)
          setTodayRecord(mine || null)
        }
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
        await fetchRecords()
      } else {
        alert(data.error || '퇴근 처리 실패')
      }
    } catch (e) { console.error(e) }
    setChecking(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isToday = selectedDate === today

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>출퇴근 관리</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>총 {records.length}건</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            background: '#1e2235', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 12px', color: '#f1f3f9',
            fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* 출퇴근 버튼 (직원용, 오늘만) */}
      {!isAdmin && isToday && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79,98,247,0.15) 0%, rgba(124,58,237,0.1) 100%)',
          border: '1px solid rgba(79,98,247,0.25)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 4 }}>오늘 출퇴근</div>
            {todayRecord ? (
              <div>
                <div style={{ fontSize: 15, color: '#4ade80', fontWeight: 600 }}>
                  출근 {todayRecord.check_in}
                </div>
                {todayRecord.check_out && (
                  <div style={{ fontSize: 15, color: '#f87171', fontWeight: 600, marginTop: 2 }}>
                    퇴근 {todayRecord.check_out}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 15, color: '#8b91ab' }}>아직 출근 전입니다</div>
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
              {todayRecord ? '출근 완료' : checking ? '처리 중...' : '출근 체크'}
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
              {todayRecord?.check_out ? '퇴근 완료' : checking ? '처리 중...' : '퇴근 체크'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b91ab' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          불러오는 중...
        </div>
      ) : records.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8b91ab' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 6 }}>출퇴근 기록이 없습니다</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(record => (
            <div key={record.id} style={{
              background: '#141828',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: record.check_out ? 'rgba(79,98,247,0.1)' : 'rgba(34,197,94,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {record.check_out ? '완' : '출'}
                </div>
                <div>
                  {isAdmin && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 4 }}>
                      {record.employee_name}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: '#8b91ab' }}>
                    {record.date}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 2 }}>출근</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: record.is_late === 'true' ? '#f59e0b' : '#4ade80' }}>
                      {record.check_in || '-'}
                    </span>
                    {record.is_late === 'true' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>지각</span>
                    )}
                  </div>
                </div>
                <div style={{ color: '#8b91ab' }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 2 }}>퇴근</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: record.check_out ? (record.is_early === 'true' ? '#f97316' : '#f87171') : '#8b91ab' }}>
                      {record.check_out || '-'}
                    </span>
                    {record.is_early === 'true' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>조퇴</span>
                    )}
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                background: record.check_out ? 'rgba(79,98,247,0.1)' : 'rgba(34,197,94,0.1)',
                color: record.check_out ? '#818cf8' : '#4ade80',
              }}>
                {record.check_out ? '퇴근 완료' : '근무 중'}
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