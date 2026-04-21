'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const EMPTY_FORM = {
  housing: 0, transport: 0, meal: 0, ot: 0, other_income: 0,
  tax: 0, social_security: 875, other_deduction: 0, notes: '',
}

function calcNet(r) {
  const income = Number(r.base_salary||0) + Number(r.housing||0) + Number(r.transport||0)
    + Number(r.meal||0) + Number(r.ot||0) + Number(r.other_income||0) + Number(r.expense_total||0)
  const deduct = Number(r.tax||0) + Number(r.social_security||0) + Number(r.other_deduction||0)
  return { income, deduct, net: income - deduct }
}

export default function PayrollPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [selYear,  setSelYear]  = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1)
  const [employees, setEmployees] = useState([])
  const [payrolls,  setPayrolls]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null) // { mode: 'create'|'edit', employee?, payroll? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')

  const yearMonth = `${selYear}-${String(selMonth).padStart(2, '0')}`

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.isAdmin)) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchData = useCallback(async () => {
    if (!session?.isAdmin) return
    setLoading(true)
    try {
      const [empRes, payRes] = await Promise.all([
        fetch('/api/employees'),
        fetch(`/api/payroll?year_month=${yearMonth}`),
      ])
      const empData = await empRes.json()
      const payData = await payRes.json()
      setEmployees(Array.isArray(empData) ? empData.filter(e => e.status !== 'inactive') : [])
      setPayrolls(Array.isArray(payData) ? payData.filter(p => p.status !== 'deleted') : [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [session, yearMonth])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = (emp) => {
    setForm({ ...EMPTY_FORM, base_salary: Number(emp.salary || 0) })
    setFormError('')
    setModal({ mode: 'create', employee: emp })
  }

  const openEdit = (emp, payroll) => {
    setForm({
      base_salary:     Number(payroll.base_salary || 0),
      housing:         Number(payroll.housing || 0),
      transport:       Number(payroll.transport || 0),
      meal:            Number(payroll.meal || 0),
      ot:              Number(payroll.ot || 0),
      other_income:    Number(payroll.other_income || 0),
      tax:             Number(payroll.tax || 0),
      social_security: Number(payroll.social_security || 875),
      other_deduction: Number(payroll.other_deduction || 0),
      notes:           payroll.notes || '',
    })
    setFormError('')
    setModal({ mode: 'edit', employee: emp, payroll })
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError('')
    try {
      if (modal.mode === 'create') {
        const res = await fetch('/api/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id:    modal.employee.id || modal.employee.email,
            employee_email: modal.employee.email,
            employee_name:  modal.employee.name_th || modal.employee.name_ko || modal.employee.name_en,
            year_month:     yearMonth,
            ...form,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setFormError(data.error || '저장 실패'); return }
      } else {
        const res = await fetch('/api/payroll', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: modal.payroll.id, action: 'update', ...form }),
        })
        if (!res.ok) { setFormError('수정 실패'); return }
      }
      setModal(null)
      await fetchData()
    } catch { setFormError('서버 오류가 발생했습니다.') }
    setSaving(false)
  }

  const handleMarkPaid = async (payroll) => {
    try {
      await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payroll.id, action: 'mark_paid' }),
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const handleDelete = async (payroll) => {
    if (!confirm('이 급여 기록을 삭제할까요?')) return
    try {
      await fetch('/api/payroll', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payroll.id }),
      })
      await fetchData()
    } catch { /* ignore */ }
  }

  const totalPaid    = payrolls.filter(p => p.status === 'paid').reduce((s, p) => s + calcNet(p).net, 0)
  const totalPending = payrolls.filter(p => p.status === 'pending').reduce((s, p) => s + calcNet(p).net, 0)
  const coveredIds   = new Set(payrolls.map(p => p.employee_id))

  if (status === 'loading') return null

  const s = {
    page:  { color: '#f1f3f9' },
    card:  { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 },
    th:    { padding: '10px 14px', fontSize: 12, color: '#8b91ab', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' },
    td:    { padding: '12px 14px', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)' },
    input: { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    label: { fontSize: 12, color: '#8b91ab', marginBottom: 5, display: 'block' },
  }

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>💰 급여 관리</h1>
        <p style={{ fontSize: 13, color: '#8b91ab', marginTop: 4 }}>직원별 월급을 입력하고 지급 처리하세요</p>
      </div>

      {/* 월 선택 */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
        <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={{ ...s.input, width: 'auto', padding: '7px 12px' }}>
          {[now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2].map(y => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={{ ...s.input, width: 'auto', padding: '7px 12px' }}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <div style={{ fontSize: 13, color: '#8b91ab' }}>
          {yearMonth} 급여
        </div>
      </div>

      {/* 요약 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '전체 직원', value: `${employees.length}명`, color: '#818cf8' },
          { label: '급여 입력 완료', value: `${payrolls.length}명`, color: '#38bdf8' },
          { label: '지급 완료', value: `฿${totalPaid.toLocaleString()}`, color: '#4ade80' },
          { label: '미지급 합계', value: `฿${totalPending.toLocaleString()}`, color: '#fbbf24' },
        ].map((stat, i) => (
          <div key={i} style={{ ...s.card, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 테이블 */}
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(79,98,247,0.08)' }}>
              {['직원', '기본급', '수당 합계', '공제 합계', '경비', '실수령액', '상태', ''].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#8b91ab' }}>불러오는 중...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#8b91ab' }}>직원이 없습니다</td></tr>
            ) : (
              employees.map(emp => {
                const empId  = emp.id || emp.email
                const payroll = payrolls.find(p => p.employee_id === empId || p.employee_email === emp.email)
                const hasData = !!payroll
                const { income, deduct, net } = hasData ? calcNet(payroll) : { income: 0, deduct: 0, net: 0 }
                const allowances = hasData
                  ? Number(payroll.housing||0) + Number(payroll.transport||0) + Number(payroll.meal||0) + Number(payroll.ot||0) + Number(payroll.other_income||0)
                  : 0

                return (
                  <tr key={empId} style={{ background: 'transparent' }}>
                    <td style={{ ...s.td, color: '#f1f3f9', fontWeight: 500 }}>
                      <div>{emp.name_th || emp.name_ko || emp.name_en}</div>
                      <div style={{ fontSize: 11, color: '#8b91ab' }}>{emp.position || ''}</div>
                    </td>
                    <td style={{ ...s.td, color: '#c4c7d6' }}>
                      {hasData ? `฿${Number(payroll.base_salary).toLocaleString()}` : <span style={{ color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ ...s.td, color: '#4ade80' }}>
                      {hasData && allowances > 0 ? `+฿${allowances.toLocaleString()}` : <span style={{ color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ ...s.td, color: '#f87171' }}>
                      {hasData && deduct > 0 ? `-฿${deduct.toLocaleString()}` : <span style={{ color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ ...s.td, color: '#38bdf8' }}>
                      {hasData && Number(payroll.expense_total) > 0 ? `+฿${Number(payroll.expense_total).toLocaleString()}` : <span style={{ color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ ...s.td }}>
                      {hasData
                        ? <span style={{ fontWeight: 700, color: '#f1f3f9', fontSize: 14 }}>฿{net.toLocaleString()}</span>
                        : <span style={{ color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={s.td}>
                      {hasData ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          background: payroll.status === 'paid' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                          color: payroll.status === 'paid' ? '#4ade80' : '#fbbf24',
                        }}>
                          {payroll.status === 'paid' ? `✓ 지급완료 ${payroll.paid_at}` : '미지급'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#3d4260' }}>미입력</span>
                      )}
                    </td>
                    <td style={{ ...s.td }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!hasData ? (
                          <button onClick={() => openCreate(emp)} style={{ padding: '4px 12px', background: 'rgba(79,98,247,0.15)', color: '#818cf8', border: '1px solid rgba(79,98,247,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            입력
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openEdit(emp, payroll)} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                              수정
                            </button>
                            {payroll.status !== 'paid' && (
                              <button onClick={() => handleMarkPaid(payroll)} style={{ padding: '4px 10px', background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                지급처리
                              </button>
                            )}
                            <button onClick={() => handleDelete(payroll)} style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* 합계 행 */}
        {payrolls.length > 0 && (
          <div style={{ padding: '14px 20px', borderTop: '2px solid rgba(79,98,247,0.2)', background: 'rgba(79,98,247,0.04)', display: 'flex', justifyContent: 'flex-end', gap: 32 }}>
            <div style={{ fontSize: 12, color: '#8b91ab' }}>
              총 지급예정: <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f3f9' }}>฿{(totalPaid + totalPending).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8b91ab' }}>
              지급완료: <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>฿{totalPaid.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8b91ab' }}>
              미지급: <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>฿{totalPending.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* 급여 입력/수정 모달 */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}
        >
          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 560, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 모달 헤더 */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9' }}>
                  {modal.mode === 'create' ? '급여 입력' : '급여 수정'} — {modal.employee.name_th || modal.employee.name_ko}
                </div>
                <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>{yearMonth}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8b91ab', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* 모달 바디 */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px' }}>
              {formError && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>{formError}</div>
              )}

              {/* 수입 섹션 */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>💵 수입 항목</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={s.label}>기본급 (Base Salary)</label>
                  <input type="number" style={s.input} value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>주거수당 (Housing)</label>
                  <input type="number" style={s.input} value={form.housing} onChange={e => setForm(f => ({ ...f, housing: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>교통비 (Transport)</label>
                  <input type="number" style={s.input} value={form.transport} onChange={e => setForm(f => ({ ...f, transport: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>식비 (Meal)</label>
                  <input type="number" style={s.input} value={form.meal} onChange={e => setForm(f => ({ ...f, meal: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>초과근무수당 (OT)</label>
                  <input type="number" style={s.input} value={form.ot} onChange={e => setForm(f => ({ ...f, ot: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>기타수당 (Other)</label>
                  <input type="number" style={s.input} value={form.other_income} onChange={e => setForm(f => ({ ...f, other_income: Number(e.target.value) }))} />
                </div>
              </div>

              {/* 공제 섹션 */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>📉 공제 항목</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={s.label}>소득세 (Income Tax)</label>
                  <input type="number" style={s.input} value={form.tax} onChange={e => setForm(f => ({ ...f, tax: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>사회보험 (Social Security)</label>
                  <input type="number" style={s.input} value={form.social_security} onChange={e => setForm(f => ({ ...f, social_security: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={s.label}>기타공제 (Other Deduction)</label>
                  <input type="number" style={s.input} value={form.other_deduction} onChange={e => setForm(f => ({ ...f, other_deduction: Number(e.target.value) }))} />
                </div>
              </div>

              {/* 메모 */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>메모</label>
                <input type="text" style={s.input} placeholder="특이사항 입력" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* 실수령 미리보기 */}
              {(() => {
                const totalIncome = (form.base_salary||0) + (form.housing||0) + (form.transport||0) + (form.meal||0) + (form.ot||0) + (form.other_income||0)
                const totalDeduct = (form.tax||0) + (form.social_security||0) + (form.other_deduction||0)
                const net = totalIncome - totalDeduct
                return (
                  <div style={{ background: 'rgba(79,98,247,0.08)', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#8b91ab' }}>
                      총수입 <span style={{ color: '#4ade80', fontWeight: 600 }}>฿{totalIncome.toLocaleString()}</span>
                      {' '}&nbsp;−&nbsp;{' '}
                      공제 <span style={{ color: '#f87171', fontWeight: 600 }}>฿{totalDeduct.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: '#8b91ab' }}>실수령 </span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9' }}>฿{net.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* 모달 푸터 */}
            <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.06)', color: '#8b91ab', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
