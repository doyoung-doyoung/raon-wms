'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function WarningsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [warnings, setWarnings] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [autoChecking, setAutoChecking] = useState(false)
  const [form, setForm] = useState({
    employeeId: '', employeeName: '', employeeEmail: '',
    position: '', startDate: '', address: '',
    reason1: '', reason2: '', reason3: '',
  })

  useEffect(() => {
    fetchWarnings()
    if (isAdmin) fetchEmployees()
  }, [session])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  const fetchWarnings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/warnings')
      const data = await res.json()
      setWarnings(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.employeeName || !form.reason1) return
    setSaving(true)
    try {
      const res = await fetch('/api/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId:    form.employeeEmail,
          employeeName:  form.employeeName,
          employeeEmail: form.employeeEmail,
          position:      form.position,
          startDate:     form.startDate,
          address:       form.address,
          reason1:       form.reason1,
          reason2:       form.reason2,
          reason3:       form.reason3,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchWarnings()
        setShowForm(false)
        setForm({ employeeId: '', employeeName: '', employeeEmail: '', position: '', startDate: '', address: '', reason1: '', reason2: '', reason3: '' })
      } else {
        alert(data.error || '발행 실패')
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleAutoCheck = async () => {
    setAutoChecking(true)
    try {
      const res = await fetch('/api/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'auto_check' }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.count === 0) {
          alert('3일 이상 무단결근 직원이 없습니다.')
        } else {
          alert(`${data.count}명에게 경고장이 발행되었습니다.`)
        }
        await fetchWarnings()
      }
    } catch (e) { console.error(e) }
    setAutoChecking(false)
  }

  const handleAcknowledge = async (id) => {
    try {
      await fetch('/api/warnings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await fetchWarnings()
      setSelected(null)
    } catch (e) { console.error(e) }
  }

  const severityColor = (num) => {
    if (num === 1) return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', label: '1차 경고' }
    if (num === 2) return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171', label: '2차 경고' }
    return { bg: 'rgba(139,0,0,0.15)', border: 'rgba(239,68,68,0.5)', text: '#fca5a5', label: `${num}차 경고` }
  }

  const visibleWarnings = isAdmin
    ? warnings
    : warnings.filter(w => w.employee_email === session?.user?.email)

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>
            {isAdmin ? '경고장 관리' : '나의 경고장'}
          </h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>총 {visibleWarnings.length}건</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleAutoCheck}
              disabled={autoChecking}
              style={{
                padding: '9px 20px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {autoChecking ? '확인 중...' : '자동 결근 체크'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '9px 20px', background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + 경고장 발행
            </button>
          </div>
        )}
      </div>

      {/* 직원용 안내 배너 */}
      {!isAdmin && visibleWarnings.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>
              총 {visibleWarnings.length}건의 경고장이 있습니다
            </div>
            <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>
              경고장을 확인하고 확인 완료 버튼을 눌러주세요
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b91ab' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          불러오는 중...
        </div>
      ) : visibleWarnings.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8b91ab' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 6 }}>
            {isAdmin ? '발행된 경고장이 없습니다.' : '경고장이 없습니다!'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleWarnings.map(w => {
            const sev = severityColor(Number(w.warning_number) || 1)
            const active = selected?.id === w.id
            return (
              <div
                key={w.id}
                onClick={() => setSelected(active ? null : w)}
                style={{
                  background: active ? sev.bg : '#141828',
                  border: `1px solid ${active ? sev.border : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                        {sev.label}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 5,
                        background: w.status === 'acknowledged' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: w.status === 'acknowledged' ? '#4ade80' : '#fbbf24',
                        border: `1px solid ${w.status === 'acknowledged' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      }}>
                        {w.status === 'acknowledged' ? '확인 완료' : '미확인'}
                      </span>
                    </div>
                    {isAdmin && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 2 }}>
                        {w.employee_name}
                        <span style={{ fontSize: 12, color: '#8b91ab', fontWeight: 400, marginLeft: 8 }}>{w.position}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: '#8b91ab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.reason1}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#8b91ab', flexShrink: 0, textAlign: 'right' }}>
                    {w.issued_at}
                  </div>
                </div>

                {/* 상세 펼치기 */}
                {active && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {[
                      { label: '직원', value: w.employee_name },
                      { label: '직책', value: w.position },
                      { label: '사유 1', value: w.reason1 },
                      { label: '사유 2', value: w.reason2 },
                      { label: '발행일', value: w.issued_at },
                      { label: '담당자', value: w.director_name },
                    ].map(item => item.value ? (
                      <div key={item.label} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#8b91ab', minWidth: 60 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: '#f1f3f9' }}>{item.value}</div>
                      </div>
                    ) : null)}

                    {!isAdmin && w.status === 'issued' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleAcknowledge(w.id) }}
                        style={{
                          width: '100%', marginTop: 12, padding: '10px',
                          background: 'rgba(79,98,247,0.15)', color: '#818cf8',
                          border: '1px solid rgba(79,98,247,0.3)', borderRadius: 10,
                          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        경고장 확인 완료
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 경고장 발행 모달 */}
      {showForm && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f87171', margin: 0 }}>경고장 발행</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20 }}>x</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>직원 선택 *</label>
              <select
                value={form.employeeEmail}
                onChange={e => {
                  const emp = employees.find(emp => emp.email === e.target.value)
                  if (emp) {
                    setForm(p => ({
                      ...p,
                      employeeEmail: emp.email,
                      employeeName: emp.name_ko || emp.name_th || emp.name_en || '',
                      position: emp.position || '',
                      startDate: emp.start_date || '',
                      address: emp.currentAddress || emp.address || '',
                    }))
                  } else {
                    setForm(p => ({ ...p, employeeEmail: '', employeeName: '', position: '', startDate: '', address: '' }))
                  }
                }}
                style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: form.employeeEmail ? '#f1f3f9' : '#8b91ab', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              >
                <option value="">직원을 선택하세요</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.email}>
                    {emp.name_ko || emp.name_th || emp.name_en} ({emp.position || '-'})
                  </option>
                ))}
              </select>
            </div>

            {form.employeeEmail && (
              <div style={{ background: 'rgba(79,98,247,0.06)', border: '1px solid rgba(79,98,247,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: '이름', value: form.employeeName },
                  { label: '직책', value: form.position },
                  { label: '이메일', value: form.employeeEmail },
                  { label: '입사일', value: form.startDate },
                ].map(item => (
                  <div key={item.label}>
                    <span style={{ fontSize: 11, color: '#8b91ab' }}>{item.label}: </span>
                    <span style={{ fontSize: 12, color: '#c4c7d6' }}>{item.value || '-'}</span>
                  </div>
                ))}
              </div>
            )}

            {[
              { key: 'reason1', label: '사유 1 *', placeholder: '무단결근 3일 이상...' },
              { key: 'reason2', label: '사유 2 (선택)', placeholder: '추가 사유' },
              { key: 'reason3', label: '사유 3 (선택)', placeholder: '추가 사유' },
            ].map((f, i) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>{f.label}</label>
                <textarea
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                  style={{
                    width: '100%', background: '#141828',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '8px 12px',
                    color: '#f1f3f9', fontSize: 13, outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    resize: 'vertical', lineHeight: 1.6,
                    maxHeight: 160, overflowY: 'auto',
                  }}
                />
              </div>
            ))}

            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#fbbf24' }}>
              발행 즉시 직원 이메일로 자동 발송됩니다
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
              <button onClick={handleSubmit} disabled={saving || !form.employeeName || !form.reason1} style={{
                padding: '9px 24px',
                background: !form.employeeName || !form.reason1 ? 'rgba(239,68,68,0.3)' : '#ef4444',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: !form.employeeName || !form.reason1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? '발행 중...' : '경고장 발행'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}