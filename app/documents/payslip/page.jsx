'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const s = {
  page:    { maxWidth: 720, margin: '0 auto', color: '#f1f3f9' },
  title:   { fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: '0 0 4px' },
  sub:     { fontSize: 13, color: '#8b91ab', marginBottom: 28 },
  card:    { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 16 },
  lbl:     { display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6 },
  inp:     { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  sel:     { width: '100%', padding: '10px 14px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:     (bg) => ({ padding: '10px 24px', background: bg || '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 14 },
}

export default function PayslipPage() {
  const [employees, setEmployees]   = useState([])
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [directors, setDirectors]   = useState([])

  // 급여 지불 상태
  const [payrollRecord, setPayrollRecord] = useState(null)  // 이번 달 지불 기록
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [creatingPayroll, setCreatingPayroll] = useState(false)

  // 폼
  const [form, setForm] = useState({
    directorId: '',
    yearMonth: '',
    periodTh: '', periodEn: '', payDateTh: '',
    housing: 0, transport: 0, meal: 0, ot: 0, otherIncome: 0,
    tax: 0, socialSecurity: 0, otherDeduction: 0,
  })

  // 결과
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  // 해당 월 승인된 경비
  const [approvedExpenses, setApprovedExpenses] = useState([])

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => {
        const emps = Array.isArray(data) ? data : (data.employees || [])
        setEmployees(emps)
        const dirs = emps.filter(e => e.isDirector === true || e.isDirector === 'true')
        setDirectors(dirs.length > 0 ? dirs : emps)
      })
  }, [])

  // 직원 + 월 선택 시 payroll 기록 + 경비 조회
  useEffect(() => {
    if (!selectedEmp || !form.yearMonth) { setPayrollRecord(null); setApprovedExpenses([]); return }
    fetchPayrollAndExpenses()
  }, [selectedEmp, form.yearMonth])

  async function fetchPayrollAndExpenses() {
    setLoadingPayroll(true)
    try {
      const [prRes, expRes] = await Promise.all([
        fetch(`/api/payroll?employee_id=${selectedEmp.email}&year_month=${form.yearMonth}`),
        fetch(`/api/expenses`),
      ])
      const prData  = await prRes.json()
      const expData = await expRes.json()

      const record = Array.isArray(prData) ? prData.find(r => r.year_month === form.yearMonth) : null
      setPayrollRecord(record || null)

      const approved = Array.isArray(expData)
        ? expData.filter(e =>
            e.employee_email === selectedEmp.email &&
            e.status === 'approved' &&
            e.expense_date?.startsWith(form.yearMonth)
          )
        : []
      setApprovedExpenses(approved)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPayroll(false)
    }
  }

  function handleSelectEmployee(e) {
    const emp = employees.find(em => em.id === e.target.value)
    setSelectedEmp(emp || null)
    setResult(null)
    setPayrollRecord(null)
  }

  function handleMonthChange(e) {
    const val = e.target.value
    if (!val) return
    const [year, month] = val.split('-')
    const thaiYear  = parseInt(year) + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const enMonths   = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const lastDay    = new Date(parseInt(year), parseInt(month), 0).getDate()
    setForm(f => ({
      ...f,
      yearMonth: val,
      periodTh:  `${thaiMonths[parseInt(month) - 1]} ${thaiYear}`,
      periodEn:  `${enMonths[parseInt(month) - 1]} ${year}`,
      payDateTh: `${lastDay} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`,
    }))
    setResult(null)
  }

  function num(field, val) {
    setForm(f => ({ ...f, [field]: Number(val) || 0 }))
  }

  // 급여 지불 등록
  async function handleRegisterPayment() {
    if (!selectedEmp || !form.yearMonth) return
    setCreatingPayroll(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id:    selectedEmp.email,
          employee_email: selectedEmp.email,
          employee_name:  selectedEmp.nameTh || selectedEmp.name,
          year_month:     form.yearMonth,
          base_salary:    selectedEmp.salary || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '등록 실패')
      toast.success('급여 지불 등록 완료!')
      fetchPayrollAndExpenses()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingPayroll(false)
    }
  }

  // 지불 완료 처리
  async function handleMarkPaid() {
    if (!payrollRecord) return
    try {
      const res = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payrollRecord.id, action: 'mark_paid' }),
      })
      if (!res.ok) throw new Error('처리 실패')
      toast.success('급여 지불 완료 처리됐습니다!')
      fetchPayrollAndExpenses()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // PDF 발급
  async function handleSubmit() {
    if (!selectedEmp || !form.directorId || !form.periodTh) {
      toast.error('직원, 승인자, 급여 월을 선택해주세요.')
      return
    }
    if (!payrollRecord || payrollRecord.status !== 'paid') {
      toast.error('급여 지불 완료 후 명세서를 발급할 수 있습니다.')
      return
    }
    const director = employees.find(e => e.id === form.directorId)
    const expenseTotal = approvedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)

    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/documents/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodTh:     form.periodTh,
          periodEn:     form.periodEn,
          payDateTh:    form.payDateTh,
          nameTh:       selectedEmp.name_th || selectedEmp.name_ko || selectedEmp.name_en,
          nameEn:       selectedEmp.name_en || selectedEmp.name_ko,
          employeeId:   selectedEmp.id,
          position:     selectedEmp.position,
          startDateTh:  selectedEmp.start_date,
          baseSalary:   Number(selectedEmp.salary) || 0,
          housing:      form.housing,
          transport:    form.transport,
          meal:         form.meal,
          ot:           form.ot,
          otherIncome:  form.otherIncome,
          expenseReimbursement: expenseTotal,
          tax:          form.tax,
          socialSecurity: form.socialSecurity,
          otherDeduction: form.otherDeduction,
          directorName: director?.name_en || director?.name_ko,
          directorRole: director?.position || 'Managing Director',
        }),
      })
      const data = await res.json()
      if (data.success) setResult(data)
      else toast.error('오류: ' + data.error)
    } catch (err) {
      toast.error('오류: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result?.pdfBase64) return
    const bytes = atob(result.pdfBase64)
    const arr   = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob  = new Blob([arr], { type: 'application/pdf' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url; a.download = result.fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const baseSalary    = Number(selectedEmp?.salary || 0)
  const expenseTotal  = approvedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalIncome   = baseSalary + form.housing + form.transport + form.meal + form.ot + form.otherIncome + expenseTotal
  const totalDeduction = form.tax + form.socialSecurity + form.otherDeduction
  const netPay        = totalIncome - totalDeduction

  const isPaid = payrollRecord?.status === 'paid'

  return (
    <div style={s.page}>
      <h1 style={s.title}>월급명세서 발급</h1>
      <p style={s.sub}>급여 지불 완료 후 명세서를 발급할 수 있습니다</p>

      {/* 직원 선택 */}
      <div style={s.card}>
        <div style={s.sectionTitle}>👤 직원 선택</div>
        <div style={s.grid2}>
          <div>
            <label style={s.lbl}>직원</label>
            <select onChange={handleSelectEmployee} style={s.sel}>
              <option value="">-- 선택 --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name_th || e.name_ko || e.name_en || e.id} ({e.position})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={s.lbl}>급여 월</label>
            <input type="month" onChange={handleMonthChange} style={s.inp} />
            {form.periodTh && <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{form.periodTh} · 지급일: {form.payDateTh}</div>}
          </div>
        </div>

        {selectedEmp && (
          <div style={{ marginTop: 14, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 13 }}>
            <div style={s.row}><span style={{ color: '#8b91ab' }}>이름 (EN)</span><span>{selectedEmp.name_en || '-'}</span></div>
            <div style={s.row}><span style={{ color: '#8b91ab' }}>직책</span><span>{selectedEmp.position}</span></div>
            <div style={{ ...s.row, borderBottom: 'none' }}><span style={{ color: '#8b91ab' }}>기본급</span><span style={{ fontWeight: 600, color: '#4ade80' }}>{Number(selectedEmp.salary || 0).toLocaleString()} THB</span></div>
          </div>
        )}
      </div>

      {/* 급여 지불 상태 */}
      {selectedEmp && form.yearMonth && (
        <div style={s.card}>
          <div style={s.sectionTitle}>💳 급여 지불 상태</div>
          {loadingPayroll ? (
            <div style={{ color: '#8b91ab', fontSize: 13 }}>확인 중...</div>
          ) : payrollRecord ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  color: isPaid ? '#4ade80' : '#fbbf24',
                }}>
                  {isPaid ? '✓ 지불 완료' : '⏳ 지불 대기'}
                </span>
                {isPaid && <span style={{ fontSize: 12, color: '#8b91ab' }}>{payrollRecord.paid_at} · {payrollRecord.paid_by}</span>}
              </div>
              {!isPaid && (
                <button onClick={handleMarkPaid} style={{ ...s.btn('#22c55e'), fontSize: 13 }}>
                  급여 지불 완료 처리
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: '#8b91ab', marginBottom: 12 }}>
                이 직원의 {form.yearMonth} 급여 지불 기록이 없습니다.
              </div>
              <button onClick={handleRegisterPayment} disabled={creatingPayroll}
                style={{ ...s.btn('#4f62f7'), opacity: creatingPayroll ? 0.6 : 1 }}>
                {creatingPayroll ? '등록 중...' : '급여 지불 등록'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 승인된 경비 */}
      {selectedEmp && form.yearMonth && approvedExpenses.length > 0 && (
        <div style={s.card}>
          <div style={s.sectionTitle}>💰 이번 달 승인된 경비 ({approvedExpenses.length}건)</div>
          {approvedExpenses.map(e => (
            <div key={e.id} style={s.row}>
              <span style={{ color: '#8b91ab' }}>{e.title} ({e.expense_date})</span>
              <span style={{ fontWeight: 600, color: '#818cf8' }}>{Number(e.amount).toLocaleString()} {e.currency}</span>
            </div>
          ))}
          <div style={{ ...s.row, borderBottom: 'none', marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>경비 합계</span>
            <span style={{ fontWeight: 700, color: '#4ade80' }}>{expenseTotal.toLocaleString()} THB</span>
          </div>
        </div>
      )}

      {/* 수당/공제 항목 */}
      {selectedEmp && (
        <div style={s.card}>
          <div style={s.sectionTitle}>📊 수당 및 공제 항목</div>
          <div style={{ ...s.grid2, marginBottom: 16 }}>
            {[
              { label: 'ค่าที่พัก / Housing',    field: 'housing' },
              { label: 'ค่าเดินทาง / Transport', field: 'transport' },
              { label: 'ค่าอาหาร / Meal',        field: 'meal' },
              { label: 'ค่าล่วงเวลา / OT',       field: 'ot' },
              { label: 'อื่นๆ / Other income',   field: 'otherIncome' },
            ].map(item => (
              <div key={item.field}>
                <label style={s.lbl}>{item.label}</label>
                <input type="number" min="0" defaultValue={0} style={s.inp}
                  onChange={e => num(item.field, e.target.value)} />
              </div>
            ))}
          </div>

          <div style={s.grid2}>
            {[
              { label: 'ภาษี / Income tax',             field: 'tax' },
              { label: 'ประกันสังคม / Social security', field: 'socialSecurity' },
              { label: 'หักอื่นๆ / Other deductions',  field: 'otherDeduction' },
            ].map(item => (
              <div key={item.field}>
                <label style={s.lbl}>{item.label}</label>
                <input type="number" min="0" defaultValue={0} style={s.inp}
                  onChange={e => num(item.field, e.target.value)} />
              </div>
            ))}
          </div>

          {/* 합계 미리보기 */}
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(79,98,247,0.08)', borderRadius: 10 }}>
            <div style={s.row}><span style={{ color: '#8b91ab' }}>기본급</span><span>{baseSalary.toLocaleString()} THB</span></div>
            {expenseTotal > 0 && <div style={s.row}><span style={{ color: '#818cf8' }}>경비 정산</span><span style={{ color: '#818cf8' }}>+{expenseTotal.toLocaleString()} THB</span></div>}
            <div style={s.row}><span style={{ color: '#8b91ab' }}>총 수입</span><span style={{ color: '#4ade80', fontWeight: 600 }}>{totalIncome.toLocaleString()} THB</span></div>
            <div style={s.row}><span style={{ color: '#8b91ab' }}>총 공제</span><span style={{ color: '#f87171', fontWeight: 600 }}>-{totalDeduction.toLocaleString()} THB</span></div>
            <div style={{ ...s.row, borderBottom: 'none', marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>실수령액</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#4f62f7' }}>{netPay.toLocaleString()} THB</span>
            </div>
          </div>
        </div>
      )}

      {/* 승인자 + 발급 버튼 */}
      {selectedEmp && (
        <div style={s.card}>
          <div style={s.sectionTitle}>✍️ 승인자</div>
          <select onChange={e => setForm(f => ({ ...f, directorId: e.target.value }))} style={s.sel}>
            <option value="">-- 승인자 선택 --</option>
            {directors.map(d => (
              <option key={d.id} value={d.id}>{d.name_en || d.name_ko || d.id} ({d.position})</option>
            ))}
          </select>

          {!isPaid && (
            <div style={{ marginTop: 14, padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: '#fbbf24' }}>
              ⚠️ 급여 지불 완료 후 명세서를 발급할 수 있습니다.
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !isPaid}
            style={{ ...s.btn(isPaid ? '#4f62f7' : '#374151'), marginTop: 16, width: '100%', opacity: loading ? 0.6 : 1, cursor: isPaid ? 'pointer' : 'not-allowed' }}>
            {loading ? 'PDF 생성 중...' : isPaid ? 'PDF 생성' : '급여 지불 완료 후 발급 가능'}
          </button>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div style={{ ...s.card, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80', marginBottom: 10 }}>✓ PDF 생성 완료!</div>
          <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 12 }}>{result.fileName}</div>
          <button onClick={handleDownload}
            style={{ ...s.btn('#1a2035'), border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
            PDF 다운로드
          </button>
        </div>
      )}
    </div>
  )
}
