'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useLang } from '../../lib/i18n/useLang'

export default function LeavesPage() {
  const { data: session } = useSession()
  const { t } = useLang()
  const isAdmin = session?.isAdmin

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [form, setForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    attachment_url: '',
  })

  useEffect(() => {
    fetchLeaves()
  }, [session])

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leaves')
      const data = await res.json()
      setLeaves(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const calculateDays = (start, end) => {
    if (!start || !end) return 0
    const s = new Date(start)
    const e = new Date(end)
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date || !form.reason) return
    setSaving(true)
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          days: calculateDays(form.start_date, form.end_date),
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchLeaves()
        setShowForm(false)
        setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '', attachment_url: '' })
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const handleApprove = async (id, status) => {
    try {
      await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      await fetchLeaves()
      setSelected(null)
    } catch (e) {
      console.error(e)
    }
  }

  const leaveTypeInfo = {
    annual:   { label: '🌴 연차',    color: '#4f62f7', bg: 'rgba(79,98,247,0.1)' },
    sick:     { label: '🏥 병가',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    personal: { label: '🌸 경조사',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    unpaid:   { label: '💸 무급',    color: '#8b91ab', bg: 'rgba(139,145,171,0.1)' },
  }

  const statusInfo = {
    pending:  { label: '대기 중', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
    approved: { label: '승인됨',  color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
    rejected: { label: '반려됨',  color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  }

  const filteredLeaves = leaves.filter(l => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return l.status === 'pending'
    return l.leave_type === activeTab
  })

  const tabs = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '⏳ 대기 중' },
    { key: 'annual', label: '🌴 연차' },
    { key: 'sick', label: '🏥 병가' },
    { key: 'personal', label: '🌸 경조사' },
  ]

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>🗓️ 휴가 / 병가</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>총 {leaves.length}건</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(true)} style={{
            padding: '9px 20px', background: '#4f62f7', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + 휴가 신청
          </button>
        )}
      </div>

      {/* 잔여 일수 카드 (직원용) */}
      {!isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: '🌴 잔여 연차', value: '-', sub: '올해 기준' },
            { label: '🏥 잔여 병가', value: '-', sub: '연 30일 한도' },
            { label: '🌸 잔여 경조사', value: '-', sub: '연 3일 유급' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f3f9' }}>{item.value}일</div>
              <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1e2235', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '6px 14px', border: 'none', borderRadius: 7,
            background: activeTab === tab.key ? '#4f62f7' : 'transparent',
            color: activeTab === tab.key ? '#fff' : '#8b91ab',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b91ab' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          불러오는 중...
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8b91ab' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗓️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 6 }}>신청 내역이 없습니다</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredLeaves.map(leave => {
            const lt = leaveTypeInfo[leave.leave_type] || leaveTypeInfo.annual
            const st = statusInfo[leave.status] || statusInfo.pending
            const active = selected?.id === leave.id
            return (
              <div key={leave.id} onClick={() => setSelected(active ? null : leave)} style={{
                background: '#141828',
                border: `1px solid ${active ? 'rgba(79,98,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: lt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {lt.label.split(' ')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{lt.label.split(' ')[1]}</span>
                      {isAdmin && <span style={{ fontSize: 12, color: '#8b91ab' }}>{leave.employee_name}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#8b91ab' }}>
                      {leave.start_date} ~ {leave.end_date} ({leave.days}일)
                    </div>
                    <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leave.reason}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  {leave.is_paid === 'false' && (
                    <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 6px', borderRadius: 4 }}>무급</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 상세 + 승인 패널 (이사용) */}
      {selected && (
        <div style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
          background: '#141828', borderLeft: '1px solid rgba(255,255,255,0.07)',
          padding: '24px', overflow: 'auto', zIndex: 50, animation: 'slideIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>휴가 상세</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          {[
            { label: '직원', value: selected.employee_name },
            { label: '휴가 종류', value: leaveTypeInfo[selected.leave_type]?.label },
            { label: '시작일', value: selected.start_date },
            { label: '종료일', value: selected.end_date },
            { label: '일수', value: `${selected.days}일` },
            { label: '사유', value: selected.reason },
            { label: '유급/무급', value: selected.is_paid === 'true' ? '유급' : '무급' },
            { label: '상태', value: statusInfo[selected.status]?.label },
          ].map(item => item.value ? (
            <div key={item.label} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 14, color: '#f1f3f9' }}>{item.value}</div>
            </div>
          ) : null)}

          {/* 이사 승인/반려 버튼 */}
          {isAdmin && selected.status === 'pending' && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => handleApprove(selected.id, 'approved')} style={{
                flex: 1, padding: '10px', background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                ✓ 승인
              </button>
              <button onClick={() => handleApprove(selected.id, 'rejected')} style={{
                flex: 1, padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                ✕ 반려
              </button>
            </div>
          )}
        </div>
      )}

      {/* 휴가 신청 모달 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{
            background: '#1e2235', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20, padding: '32px', width: '100%', maxWidth: 480,
            maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>🗓️ 휴가 신청</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            {/* 휴가 종류 선택 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 8 }}>휴가 종류 *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {Object.entries(leaveTypeInfo).map(([key, info]) => (
                  <button key={key} onClick={() => setForm(p => ({ ...p, leave_type: key }))} style={{
                    padding: '10px', border: `1px solid ${form.leave_type === key ? info.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, background: form.leave_type === key ? info.bg : 'transparent',
                    color: form.leave_type === key ? info.color : '#8b91ab',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}>
                    {info.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 날짜 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>시작일 *</label>
                <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#f1f3f9', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>종료일 *</label>
                <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#f1f3f9', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* 총 일수 표시 */}
            {form.start_date && form.end_date && (
              <div style={{ background: 'rgba(79,98,247,0.08)', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#818cf8' }}>
                총 <strong>{calculateDays(form.start_date, form.end_date)}일</strong> 신청
                {form.leave_type !== 'sick' && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#8b91ab' }}>※ 5일 전 신청 필요</span>
                )}
              </div>
            )}

            {/* 사유 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>사유 *</label>
              <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="휴가 사유를 입력해주세요..."
                rows={3}
                style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#f1f3f9', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            {/* 병가 3일 초과 안내 */}
            {form.leave_type === 'sick' && calculateDays(form.start_date, form.end_date) > 3 && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#fbbf24' }}>
                ⚠️ 병가 3일 초과 시 진단서 첨부가 필요합니다
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.start_date || !form.end_date || !form.reason} style={{
                padding: '9px 24px',
                background: !form.start_date || !form.end_date || !form.reason ? 'rgba(79,98,247,0.4)' : '#4f62f7',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: !form.start_date || !form.end_date || !form.reason ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
                {saving ? '신청 중...' : '✓ 휴가 신청'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  )
}