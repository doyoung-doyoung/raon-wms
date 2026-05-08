'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

const LEAVE_TYPES = [
  { value: 'annual',   label: '연차 휴가', icon: '🌴', color: '#4f62f7' },
  { value: 'sick',     label: '병가',     icon: '🏥', color: '#ef4444' },
  { value: 'personal', label: '경조사',   icon: '⭐', color: '#8b5cf6' },
  { value: 'half',     label: '반차',     icon: '⏰', color: '#f59e0b' },
]

const STATUS_COLORS = {
  pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: '검토중' },
  approved: { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', label: '승인됨' },
  rejected: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: '거절됨' },
}

export default function LeavesPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [tab, setTab]           = useState('list')
  const [leaves, setLeaves]     = useState([])
  const [balance, setBalance]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]       = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const now = new Date()
  const [calYear, setCalYear]   = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)

  const [form, setForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date:   '',
    reason:     '',
    halfPeriod: 'morning',
  })

  const fetchData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const promises = [fetch('/api/leaves')]
      if (!isAdmin) promises.push(fetch('/api/leaves/balance'))
      const results = await Promise.all(promises)
      const leavesData = await results[0].json()
      setLeaves(Array.isArray(leavesData) ? leavesData : [])
      if (!isAdmin && results[1]) {
        const balData = await results[1].json()
        setBalance(balData.balance || null)
      }
    } catch {
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }, [session, isAdmin])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async () => {
    if (!form.start_date || !form.reason) return setError('날짜와 사유를 입력해주세요.')
    const endDate = form.leave_type === 'half' ? form.start_date : (form.end_date || form.start_date)
    const days = form.leave_type === 'half'
      ? 0.5
      : Math.max(1, Math.ceil((new Date(endDate) - new Date(form.start_date)) / 86400000) + 1)

    const leaveType = form.leave_type === 'half' ? 'annual' : form.leave_type
    const reason    = form.leave_type === 'half'
      ? `반차 (${form.halfPeriod === 'morning' ? '오전' : '오후'}) - ${form.reason}`
      : form.reason

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/leaves', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_type: leaveType, start_date: form.start_date, end_date: endDate, days, reason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '신청에 실패했습니다.'); return }
      setSubmitted(true)
      await fetchData()
      setTimeout(() => {
        setSubmitted(false)
        setTab('list')
        setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '', halfPeriod: 'morning' })
      }, 2000)
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await fetch('/api/leaves', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l))
    } catch { /* ignore */ }
  }

  const handleConfirmReject = async () => {
    const id = rejectModal
    try {
      await fetch('/api/leaves', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected', rejected_reason: rejectReason }),
      })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected', custom_1: rejectReason } : l))
    } catch { /* ignore */ } finally {
      setRejectModal(null)
      setRejectReason('')
    }
  }

  // calendar
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const firstDay    = new Date(calYear, calMonth - 1, 1).getDay()
  const calPad      = `${calYear}-${String(calMonth).padStart(2, '0')}`
  const approvedLeaves = leaves.filter(l => l.status === 'approved')
  const pendingLeaves  = leaves.filter(l => l.status === 'pending')
  const prevCalMonth = () => { if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12) } else setCalMonth(m => m - 1) }
  const nextCalMonth = () => { if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1) } else setCalMonth(m => m + 1) }

  const s = {
    page:      { color: '#f1f3f9' },
    header:    { marginBottom: 28 },
    title:     { fontSize: 24, fontWeight: 700, color: '#f1f3f9', margin: 0 },
    subtitle:  { fontSize: 13, color: '#8b91ab', marginTop: 4 },
    tabs:      { display: 'flex', gap: 8, marginBottom: 24 },
    tab: (active) => ({ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, background: active ? '#4f62f7' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#8b91ab', transition: 'all 0.15s' }),
    card:      { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 12 },
    label:     { fontSize: 12, color: '#8b91ab', marginBottom: 6, display: 'block' },
    input:     { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    select:    { width: '100%', padding: '10px 14px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    btn:       { padding: '10px 24px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    badge: (status) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[status]?.bg || 'rgba(255,255,255,0.06)', color: STATUS_COLORS[status]?.color || '#8b91ab' }),
    leaveType: (type) => { const t = LEAVE_TYPES.find(x => x.value === type); return { fontSize: 12, color: t?.color || '#8b91ab', fontWeight: 600 } },
    statsRow:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
    statCard: (color) => ({ background: '#141828', border: `1px solid ${color}30`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }),
  }

  const annualRemaining = balance?.annual?.remaining ?? '-'
  const annualUsed      = balance?.annual?.used ?? '-'
  const pendingCount    = leaves.filter(l => l.status === 'pending').length
  const approvedCount   = leaves.filter(l => l.status === 'approved').length

  const stats = [
    { label: '연차 잔여',  value: annualRemaining === '-' ? '-' : `${annualRemaining}일`, color: '#4f62f7' },
    { label: '사용한 연차', value: annualUsed === '-' ? '-' : `${annualUsed}일`,          color: '#8b5cf6' },
    { label: '대기중',     value: `${pendingCount}건`,                                     color: '#f59e0b' },
    { label: '승인됨',     value: `${approvedCount}건`,                                    color: '#4ade80' },
  ]

  const displayLeaves = isAdmin ? leaves : leaves.filter(l => l.employee_email === session?.user?.email)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🗓️ 휴가 관리</h1>
        <p style={s.subtitle}>휴가 신청 및 내역을 확인하세요</p>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {stats.map((stat, i) => (
          <div key={i} style={s.statCard(stat.color)}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{loading ? '...' : stat.value}</div>
            <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(tab === 'list')}     onClick={() => setTab('list')}>📋 신청 내역</button>
        <button style={s.tab(tab === 'apply')}    onClick={() => setTab('apply')}>✏️ 휴가 신청</button>
        <button style={s.tab(tab === 'calendar')} onClick={() => setTab('calendar')}>📅 캘린더</button>
      </div>

      {/* 신청 내역 */}
      {tab === 'list' && (
        <div>
          {loading ? (
            <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#8b91ab' }}>불러오는 중...</div>
          ) : displayLeaves.length === 0 ? (
            <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#8b91ab' }}>신청 내역이 없습니다</div>
          ) : (
            displayLeaves.map(leave => {
              const leaveType = LEAVE_TYPES.find(t => t.value === leave.leave_type) || LEAVE_TYPES[0]
              const statusInfo = STATUS_COLORS[leave.status] || STATUS_COLORS.pending
              return (
                <div key={leave.id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 28 }}>{leaveType.icon}</span>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={s.leaveType(leave.leave_type)}>{leaveType.label}</span>
                          <span style={{ fontSize: 12, color: '#8b91ab' }}>·</span>
                          <span style={{ fontSize: 12, color: '#8b91ab' }}>{leave.days}일</span>
                          {isAdmin && <span style={{ fontSize: 12, color: '#8b91ab' }}>· {leave.employee_name}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: '#f1f3f9', fontWeight: 500 }}>
                          {leave.start_date} ~ {leave.end_date}
                        </div>
                        <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>{leave.reason}</div>
                        {leave.status === 'rejected' && leave.custom_1 && (
                          <div style={{ fontSize: 12, color: '#f87171', marginTop: 4, padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, borderLeft: '2px solid #f87171' }}>
                            반려 사유: {leave.custom_1}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={s.badge(leave.status)}>{statusInfo.label}</span>
                      {isAdmin && leave.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleApprove(leave.id)} style={{ padding: '4px 12px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>승인</button>
                          <button onClick={() => { setRejectModal(leave.id); setRejectReason('') }} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)',  borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>거절</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 휴가 신청 폼 */}
      {tab === 'apply' && (
        <div style={s.card}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#4ade80' }}>신청이 완료되었습니다!</div>
              <div style={{ fontSize: 13, color: '#8b91ab', marginTop: 4 }}>관리자 승인 후 확정됩니다</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 20 }}>휴가 신청서</div>
              {error && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>휴가 종류</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {LEAVE_TYPES.map(type => (
                    <div key={type.value} onClick={() => setForm({ ...form, leave_type: type.value })}
                      style={{ padding: '10px', borderRadius: 8, border: `1px solid ${form.leave_type === type.value ? type.color : 'rgba(255,255,255,0.1)'}`, background: form.leave_type === type.value ? `${type.color}20` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 20 }}>{type.icon}</div>
                      <div style={{ fontSize: 11, color: form.leave_type === type.value ? type.color : '#8b91ab', marginTop: 4, fontWeight: form.leave_type === type.value ? 600 : 400 }}>{type.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>시작일</label>
                  <input type="date" style={s.input} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>{form.leave_type === 'half' ? '반차 시간' : '종료일'}</label>
                  {form.leave_type === 'half' ? (
                    <select style={s.select} value={form.halfPeriod} onChange={e => setForm({ ...form, halfPeriod: e.target.value })}>
                      <option value="morning">오전 반차</option>
                      <option value="afternoon">오후 반차</option>
                    </select>
                  ) : (
                    <input type="date" style={s.input} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} min={form.start_date} />
                  )}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={s.label}>신청 사유</label>
                <textarea style={{ ...s.input, height: 80, resize: 'vertical' }} placeholder="휴가 사유를 입력해주세요" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </div>
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(79,98,247,0.08)', borderRadius: 8, fontSize: 12, color: '#8b91ab' }}>
                ℹ️ 휴가 신청은 <strong style={{ color: '#818cf8' }}>5일 전</strong>에 신청해주세요. 병가는 당일 신청 가능합니다.
              </div>
              <button
                style={{ ...s.btn, marginTop: 16, width: '100%', opacity: submitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '신청 중...' : '신청하기'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9', marginBottom: 6 }}>휴가 반려</div>
            <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 18 }}>반려 사유를 입력해주세요. 직원에게 이메일로 전달됩니다.</div>
            <textarea
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: 80 }}
              placeholder="반려 사유를 입력하세요 (선택)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmReject}
                style={{ padding: '8px 18px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 뷰 */}
      {tab === 'calendar' && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <button onClick={prevCalMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8b91ab', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>‹</button>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9' }}>
              {calYear}년 {calMonth}월
            </div>
            <button onClick={nextCalMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8b91ab', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} style={{ fontSize: 11, color: '#8b91ab', padding: '6px 0', fontWeight: 600 }}>{d}</div>
            ))}
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day     = i + 1
              const dateStr = `${calPad}-${String(day).padStart(2, '0')}`
              const hasLeave   = approvedLeaves.find(l => dateStr >= l.start_date && dateStr <= l.end_date)
              const hasPending = pendingLeaves.find(l  => dateStr >= l.start_date && dateStr <= l.end_date)
              const isToday    = dateStr === new Date().toISOString().slice(0, 10)
              return (
                <div key={day} style={{
                  padding: '8px 4px', borderRadius: 6, fontSize: 12,
                  background: hasLeave ? 'rgba(79,98,247,0.2)' : hasPending ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: hasLeave ? '#818cf8' : hasPending ? '#fbbf24' : isToday ? '#f1f3f9' : '#8b91ab',
                  fontWeight: hasLeave || hasPending || isToday ? 600 : 400,
                  border: isToday ? '1px solid rgba(79,98,247,0.4)' : '1px solid transparent',
                }}>
                  {day}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#8b91ab' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(79,98,247,0.4)', marginRight: 4 }} />승인된 휴가</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(245,158,11,0.3)', marginRight: 4 }} />검토중</span>
          </div>
        </div>
      )}
    </div>
  )
}
