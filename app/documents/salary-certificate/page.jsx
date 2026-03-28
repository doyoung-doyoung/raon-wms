'use client'
import { useState, useEffect } from 'react'

export default function SalaryCertificatePage() {
  const [employees, setEmployees] = useState([])
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [directors, setDirectors] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({
    directorId: '',
    issueDate: '',
    issueDateEn: '',
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

  function handleDateChange(e) {
    const val = e.target.value
    if (!val) return
    const d = new Date(val)
    const thaiYear = d.getFullYear() + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const enMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const issueDateTh = `${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiYear}`
    const issueDateEn = `${d.getDate()} ${enMonths[d.getMonth()]} ${d.getFullYear()}`
    setForm(f => ({ ...f, issueDate: issueDateTh, issueDateEn: issueDateEn }))
  }

  async function handleSubmit() {
    if (!selectedEmp || !form.directorId || !form.issueDate) {
      alert('직원, 승인자, 발급일을 모두 선택해주세요.')
      return
    }
    const director = employees.find(e => e.id === form.directorId)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/documents/salary-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueDate: form.issueDate,
          issueDateEn: form.issueDateEn,
          nameTh: selectedEmp.nameTh || selectedEmp.name,
          nameEn: selectedEmp.nameEn || selectedEmp.name,
          employeeId: selectedEmp.employeeId || selectedEmp.id,
          idCardAddress: selectedEmp.idCardAddress || '-',
          currentAddress: selectedEmp.currentAddress || '-',
          startDateTh: selectedEmp.startDateTh || selectedEmp.startDate,
          startDateEn: selectedEmp.startDateEn || selectedEmp.startDate,
          position: selectedEmp.position,
          salary: selectedEmp.salary,
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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">급여 재직증명서 발급</h1>
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
            <p><span className="text-gray-400">월급: </span>{Number(selectedEmp.salary).toLocaleString()} THB</p>
            <p><span className="text-gray-400">입사일: </span>{selectedEmp.startDate}</p>
            <p><span className="text-gray-400">ID카드 주소: </span>{selectedEmp.idCardAddress || '-'}</p>
            <p><span className="text-gray-400">현재 주소: </span>{selectedEmp.currentAddress || '-'}</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-500 mb-1">발급일</label>
          <input type="date" onChange={handleDateChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          {form.issueDate && <p className="text-xs text-gray-400 mt-1">{form.issueDate} / {form.issueDateEn}</p>}
        </div>

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