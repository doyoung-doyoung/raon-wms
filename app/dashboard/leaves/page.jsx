'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

const LEAVE_TYPES = [
  { value: 'annual', label: '연차 휴가', icon: '🌴', color: '#4f62f7' },
  { value: 'sick', label: '병가', icon: '🏥', color: '#ef4444' },
  { value: 'half', label: '반차', icon: '⏰', color: '#f59e0b' },
  { value: 'special', label: '특별휴가', icon: '⭐', color: '#8b5cf6' },
]

const STATUS_COLORS = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: '검토중' },
  approved: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: '승인됨' },
  rejected: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: '거절됨' },
}

const MOCK_LEAVES = [
  { id: 1, type: 'annual', startDate: '2026-04-01', endDate: '2026-04-03', days: 3, reason: '가족 여행', status: 'approved', createdAt: '2026-03-20', name: '김도영' },
  { id: 2, type: 'sick', startDate: '2026-03-28', endDate: '2026-03-28', days: 1, reason: '몸살감기', status: 'pending', createdAt: '2026-03-26', name: '김도영' },
  { id: 3, type: 'half', startDate: '2026-04-10', endDate: '2026-04-10', days: 0.5, reason: '개인 사정', status: 'rejected', createdAt: '2026-03-25', name: '이직원' },
]

export default function LeavesPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin
  const [tab, setTab] = useState('list') // list | apply | calendar
  const [leaves, setLeaves] = useState(MOCK_LEAVES)
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '', isHalf: false, halfPeriod: 'morning' })
  const [submitted, setSubmitted] = useState(false)

  const myLeaves = isAdmin ? leaves : leaves.filter(l => l.name === session?.user?.name)

  const handleSubmit = () => {
    if (!form.startDate || !form.reason) return alert('날짜와 사유를 입력해주세요.')
    const days = form.type === 'half' ? 0.5 : Math.max(1, Math.ceil((new Date(form.endDate || form.startDate) - new Date(form.startDate)) / 86400000) + 1)
    const newLeave = {
      id: Date.now(), type: form.type,
      startDate: form.startDate, endDate: form.endDate || form.startDate,
      days, reason: form.reason, status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      name: session?.user?.name || '직원',
    }
    setLeaves([newLeave, ...leaves])
    setSubmitted(true)
    setTimeout(() => { setSubmitted(false); setTab('list'); setForm({ type: 'annual', startDate: '', endDate: '', reason: '', isHalf: false, halfPeriod: 'morning' }) }, 2000)
  }

  const handleApprove = (id) => setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'approved' } : l))
  const handleReject = (id) => setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'rejected' } : l))

  const s = {
    page: { color: '#f1f3f9' },
    header: { marginBottom: 28 },
    title: { fontSize: 24, fontWeight: 700, color: '#f1f3f9', margin: 0 },
    subtitle: { fontSize: 13, color: '#8b91ab', marginTop: 4 },
    tabs: { display: 'flex', gap: 8, marginBottom: 24 },
    tab: (active) => ({ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, background: active ? '#4f62f7' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#8b91ab', transition: 'all 0.15s' }),
    card: { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 12 },
    label: { fontSize: 12, color: '#8b91ab', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 14px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    btn: { padding: '10px 24px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    badge: (status) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].color }),
    leaveType: (type) => { const t = LEAVE_TYPES.find(x => x.value === type); return { fontSize: 12, color: t?.color, fontWeight: 600 } },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
    statCard: (color) => ({ background: '#141828', border: `1px solid ${color}30`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }),
  }

  const stats = [
    { label: '연차 잔여', value: '12일', color: '#4f62f7' },
    { label: '사용한 연차', value: '3일', color: '#8b5cf6' },
    { label: '대기중', value: leaves.filter(l => l.status === 'pending').length + '건', color: '#f59e0b' },
    { label: '승인됨', value: leaves.filter(l => l.status === 'approved').length + '건', color: '#4ade80' },
  ]

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
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(tab === 'list')} onClick={() => setTab('list')}>📋 신청 내역</button>
        <button style={s.tab(tab === 'apply')} onClick={() => setTab('apply')}>✏️ 휴가 신청</button>
        <button style={s.tab(tab === 'calendar')} onClick={() => setTab('calendar')}>📅 캘린더</button>
      </div>

      {/* 신청 내역 */}
      {tab === 'list' && (
        <div>
          {myLeaves.length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#8b91ab' }}>신청 내역이 없습니다</div>
          )}
          {myLeaves.map(leave => {
            const leaveType = LEAVE_TYPES.find(t => t.value === leave.type)
            return (
              <div key={leave.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>{leaveType?.icon}</span>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={s.leaveType(leave.type)}>{leaveType?.label}</span>
                        <span style={{ fontSize: 12, color: '#8b91ab' }}>·</span>
                        <span style={{ fontSize: 12, color: '#8b91ab' }}>{leave.days}일</span>
                        {isAdmin && <span style={{ fontSize: 12, color: '#8b91ab' }}>· {leave.name}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#f1f3f9', fontWeight: 500 }}>{leave.startDate} ~ {leave.endDate}</div>
                      <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>{leave.reason}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={s.badge(leave.status)}>{STATUS_COLORS[leave.status].label}</span>
                    {isAdmin && leave.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleApprove(leave.id)} style={{ padding: '4px 12px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>승인</button>
                        <button onClick={() => handleReject(leave.id)} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>거절</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>휴가 종류</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {LEAVE_TYPES.map(type => (
                    <div key={type.value} onClick={() => setForm({ ...form, type: type.value })}
                      style={{ padding: '10px', borderRadius: 8, border: `1px solid ${form.type === type.value ? type.color : 'rgba(255,255,255,0.1)'}`, background: form.type === type.value ? `${type.color}20` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 20 }}>{type.icon}</div>
                      <div style={{ fontSize: 11, color: form.type === type.value ? type.color : '#8b91ab', marginTop: 4, fontWeight: form.type === type.value ? 600 : 400 }}>{type.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>시작일</label>
                  <input type="date" style={s.input} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>{form.type === 'half' ? '반차 시간' : '종료일'}</label>
                  {form.type === 'half' ? (
                    <select style={s.select} value={form.halfPeriod} onChange={e => setForm({ ...form, halfPeriod: e.target.value })}>
                      <option value="morning">오전 반차</option>
                      <option value="afternoon">오후 반차</option>
                    </select>
                  ) : (
                    <input type="date" style={s.input} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} min={form.startDate} />
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
              <button style={{ ...s.btn, marginTop: 16, width: '100%' }} onClick={handleSubmit}>신청하기</button>
            </div>
          )}
        </div>
      )}

      {/* 캘린더 뷰 */}
      {tab === 'calendar' && (
        <div style={s.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 16 }}>📅 2026년 4월</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ fontSize: 11, color: '#8b91ab', padding: '6px 0', fontWeight: 600 }}>{d}</div>
            ))}
            {[...Array(3)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(30)].map((_, i) => {
              const day = i + 1
              const dateStr = `2026-04-${String(day).padStart(2, '0')}`
              const hasLeave = leaves.find(l => l.status === 'approved' && dateStr >= l.startDate && dateStr <= l.endDate)
              const hasPending = leaves.find(l => l.status === 'pending' && dateStr >= l.startDate && dateStr <= l.endDate)
              return (
                <div key={day} style={{ padding: '8px 4px', borderRadius: 6, fontSize: 12, background: hasLeave ? 'rgba(79,98,247,0.2)' : hasPending ? 'rgba(245,158,11,0.15)' : 'transparent', color: hasLeave ? '#818cf8' : hasPending ? '#fbbf24' : '#8b91ab', fontWeight: hasLeave || hasPending ? 600 : 400 }}>
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
