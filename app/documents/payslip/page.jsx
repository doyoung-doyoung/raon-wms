'use client'
import { useState, useEffect } from 'react'

export default function PayslipPage() {
  const [employees, setEmployees] = useState([])
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [directors, setDirectors] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({
    directorId: '',
    periodTh: '',
    periodEn: '',
    payDateTh: '',
    housing: 0,
    transport: 0,
    meal: 0,
    ot: 0,
    otherIncome: 0,
    tax: 0,
    socialSecurity: 0,
    otherDeduction: 0,
  })

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => {
        const emps = data.employees || []
        setEmployees(emps)
        const dirs = emps.filter(e => e.isDirector === true || e.isDirector === 'true')
        setDirectors(dirs)
      })
  }, [])

  function handleSelectEmployee(e) {
    const emp = employees.find(em => em.id === e.target.value)
    setSelectedEmp(emp || null)
    setResult(null)
  }

  function handleMonthChange(e) {
    const val = e.target.value
    if (!val) return
    const [year, month] = val.split('-')
    const thaiYear = parseInt(year) + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const enMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const periodTh = `${thaiMonths[parseInt(month) - 1]} ${thaiYear}`
    const periodEn = `${enMonths[parseInt(month) - 1]} ${year}`

    // 마지막 날 계산
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const payDateTh = `${lastDay} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`

    setForm(f => ({ ...f, periodTh, periodEn, payDateTh }))
  }

  function handleNum(field, val) {
    setForm(f => ({ ...f, [field]: Number(val) || 0 }))
  }

  async function handleSubmit() {
    if (!selectedEmp || !form.directorId || !form.periodTh) {
      alert('직원, 승인자, 급여 월을 모두 선택해주세요.')
      return
    }
    const director = employees.find(e => e.id === form.directorId)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/documents/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodTh: form.periodTh,
          periodEn: form.periodEn,
          payDateTh: form.payDateTh,
          nameTh: selectedEmp.nameTh || selectedEmp.name,
          nameEn: selectedEmp.nameEn || selectedEmp.name,
          employeeId: selectedEmp.employeeId || selectedEmp.id,
          position: selectedEmp.position,
          startDateTh: selectedEmp.startDateTh || selectedEmp.startDate,
          startDateEn: selectedEmp.startDateEn || selectedEmp.startDate,
          baseSalary: Number(selectedEmp.salary) || 0,
          housing: form.housing,
          transport: form.transport,
          meal: form.meal,
          ot: form.ot,
          otherIncome: form.otherIncome,
          tax: form.tax,
          socialSecurity: form.socialSecurity,
          otherDeduction: form.otherDeduction,
          directorName: director?.nameEn || director?.name,
          directorRole: director?.position || 'Managing Director',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
      } else {
        alert('오류: ' + data.error)
      }
    } catch (err) {
      alert('오류가 발생했어요: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result?.pdfBase64) return
    const bytes = atob(result.pdfBase64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalIncome = Number(selectedEmp?.salary || 0) + form.housing + form.transport + form.meal + form.ot + form.otherIncome
  const totalDeduction = form.tax + form.socialSecurity + form.otherDeduction
  const netPay = totalIncome - totalDeduction

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">월급명세서 발급</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        <div>
          <label className="block text-sm text-gray-500 mb-1">직원 선택</label>
          <select onChange={handleSelectEmployee} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">-- 직원을 선택하세요 --</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.nameTh || e.name} ({e.position})</option>
            ))}
          </select>
        </div>

        {selectedEmp && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <p><span className="text-gray-400">이름 (EN): </span>{selectedEmp.nameEn || '-'}</p>
            <p><span className="text-gray-400">직책: </span>{selectedEmp.position}</p>
            <p><span className="text-gray-400">기본급: </span>{Number(selectedEmp.salary).toLocaleString()} THB</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-500 mb-1">급여 월</label>
          <input type="month" onChange={handleMonthChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          {form.periodTh && <p className="text-xs text-gray-400 mt-1">{form.periodTh} / {form.periodEn} | 지급일: {form.payDateTh}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">수당 항목</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ค่าที่พัก / Housing', field: 'housing' },
              { label: 'ค่าเดินทาง / Transport', field: 'transport' },
              { label: 'ค่าอาหาร / Meal', field: 'meal' },
              { label: 'ค่าล่วงเวลา / OT', field: 'ot' },
              { label: 'อื่นๆ / Other income', field: 'otherIncome' },
            ].map(item => (
              <div key={item.field}>
                <label className="block text-xs text-gray-400 mb-1">{item.label}</label>
                <input
                  type="number"
                  min="0"
                  defaultValue={0}
                  onChange={e => handleNum(item.field, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-2">공제 항목</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ภาษี / Income tax', field: 'tax' },
              { label: 'ประกันสังคม / Social security', field: 'socialSecurity' },
              { label: 'หักอื่นๆ / Other deductions', field: 'otherDeduction' },
            ].map(item => (
              <div key={item.field}>
                <label className="block text-xs text-gray-400 mb-1">{item.label}</label>
                <input
                  type="number"
                  min="0"
                  defaultValue={0}
                  onChange={e => handleNum(item.field, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {selectedEmp && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">총 수입</span><span className="text-green-700 font-medium">{totalIncome.toLocaleString()} THB</span></div>
            <div className="flex justify-between"><span className="text-gray-500">총 공제</span><span className="text-red-600 font-medium">{totalDeduction.toLocaleString()} THB</span></div>
            <div className="flex justify-between border-t border-blue-100 pt-1 mt-1"><span className="font-medium">실수령액</span><span className="font-semibold text-blue-700">{netPay.toLocaleString()} THB</span></div>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-500 mb-1">승인자 (서명)</label>
          <select onChange={e => setForm(f => ({ ...f, directorId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">-- 승인자를 선택하세요 --</option>
            {directors.map(d => (
              <option key={d.id} value={d.id}>{d.nameEn || d.name} ({d.position})</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'PDF 생성 중...' : 'PDF 생성 및 Drive 저장'}
        </button>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-green-700">Drive 저장 완료!</p>
            <p className="text-xs text-gray-500">{result.fileName}</p>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="flex-1 bg-white border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">
                PDF 다운로드
              </button>
              <a href={result.driveUrl} target="_blank" rel="noreferrer" className="flex-1 text-center bg-white border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">
                Drive에서 보기
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}