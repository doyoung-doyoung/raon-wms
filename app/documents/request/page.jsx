'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const DOC_TYPES = [
  { value: 'salary-certificate', label: '재직증명서 (หนังสือรับรองเงินเดือน)' },
  { value: 'payslip', label: '월급명세서 (สลิปเงินเดือน)' },
]

export default function DocumentRequestPage() {
  const { data: session } = useSession()
  const [myRequests, setMyRequests] = useState([])
  const [form, setForm] = useState({ documentType: 'salary-certificate', requestNote: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [empInfo, setEmpInfo] = useState(null)

 useEffect(() => {
    if (!session?.user?.email) return
    fetch('/api/employees/me')
      .then(r => r.json())
      .then(data => {
        if (data?.id || data?.email) {
          setEmpInfo(data)
          loadMyRequests(data.id || data.email)
        }
      })
  }, [session])

  async function loadMyRequests(employeeId) {
    const res = await fetch(`/api/documents/request?employeeId=${employeeId}`)
    const data = await res.json()
    if (data.success) setMyRequests(data.requests.reverse())
  }

  async function handleSubmit() {
    if (!empInfo) return alert('직원 정보를 찾을 수 없어요.')
    if (!form.documentType) return alert('서류 종류를 선택해주세요.')
    setLoading(true)
    try {
      const res = await fetch('/api/documents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empInfo.id,
          employeeNameTh: empInfo.name_th || empInfo.name_ko || empInfo.name,
          employeeNameEn: empInfo.name_en || empInfo.name,
          documentType: form.documentType,
          requestNote: form.requestNote,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        setForm({ documentType: 'salary-certificate', requestNote: '' })
        loadMyRequests(empInfo.id)
        setTimeout(() => setSubmitted(false), 3000)
      } else {
        alert('오류: ' + data.error)
      }
    } catch (err) {
      alert('오류: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function statusBadge(status) {
    const map = {
      pending: { label: '대기 중', bg: '#2d3a6b', color: '#818cf8' },
      approved: { label: '승인 완료', bg: '#1a3a2a', color: '#4ade80' },
      rejected: { label: '반려', bg: '#3a1a1a', color: '#f87171' },
    }
    const s = map[status] || map.pending
    return (
      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
        {s.label}
      </span>
    )
  }

  function docLabel(type) {
    return DOC_TYPES.find(d => d.value === type)?.label || type
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f1f3f9', marginBottom: 24 }}>서류 발급 신청</h1>

      {/* 신청 폼 */}
      <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#8b91ab', marginBottom: 6 }}>서류 종류</label>
          <select
            value={form.documentType}
            onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
            style={{ width: '100%', background: '#0d1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f1f3f9', fontSize: 14 }}
          >
            {DOC_TYPES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#8b91ab', marginBottom: 6 }}>요청 메모 (선택사항)</label>
          <textarea
            value={form.requestNote}
            onChange={e => setForm(f => ({ ...f, requestNote: e.target.value }))}
            placeholder="예: 비자 신청용, 은행 제출용..."
            rows={3}
            style={{ width: '100%', background: '#0d1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f1f3f9', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {submitted && (
          <div style={{ background: '#1a3a2a', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#4ade80', fontSize: 13 }}>
            신청이 완료됐어요! 이사님 승인 후 이메일로 발송됩니다.
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', background: '#4f62f7', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}
        >
          {loading ? '신청 중...' : '발급 신청하기'}
        </button>
      </div>

      {/* 신청 내역 */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f1f3f9', marginBottom: 14 }}>내 신청 내역</h2>
      {myRequests.length === 0 ? (
        <div style={{ color: '#8b91ab', fontSize: 14, textAlign: 'center', padding: 32 }}>신청 내역이 없어요.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {myRequests.map(req => (
            <div key={req.id} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{docLabel(req.documentType)}</span>
                {statusBadge(req.status)}
              </div>
              <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 6 }}>
                신청일: {new Date(req.requestedAt).toLocaleDateString('ko-KR')}
              </div>
              {req.requestNote && (
                <div style={{ fontSize: 12, color: '#8b91ab' }}>메모: {req.requestNote}</div>
              )}
              {req.status === 'approved' && req.driveUrl && (
                <a href={req.driveUrl} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, background: '#1e2d5a', color: '#818cf8', padding: '6px 14px', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>
                  Drive에서 보기
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}