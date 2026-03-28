'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const DOC_TYPES = {
  'salary-certificate': '재직증명서',
  'payslip': '월급명세서',
}

export default function DocumentApprovePage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState([])
  const [directors, setDirectors] = useState([])
  const [selectedDirector, setSelectedDirector] = useState('')
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    loadRequests()
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => {
        const dirs = (data.employees || []).filter(e => e.isDirector === true || e.isDirector === 'true')
        setDirectors(dirs)
        if (dirs.length > 0) setSelectedDirector(dirs[0].id)
      })
  }, [])

  async function loadRequests() {
    setLoading(true)
    try {
      const res = await fetch('/api/documents/request?status=pending')
      const data = await res.json()
      if (data.success) setRequests(data.requests.reverse())
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(requestId, approved) {
    if (!selectedDirector) return alert('승인자를 선택해주세요.')
    setProcessingId(requestId)
    try {
      const res = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          approved,
          directorId: selectedDirector,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert(approved ? '승인 완료! 직원 이메일로 발송됐어요.' : '반려 처리됐어요.')
        loadRequests()
      } else {
        alert('오류: ' + data.error)
      }
    } catch (err) {
      alert('오류: ' + err.message)
    } finally {
      setProcessingId(null)
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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f1f3f9', marginBottom: 8 }}>서류 발급 승인</h1>
      <p style={{ fontSize: 13, color: '#8b91ab', marginBottom: 24 }}>대기 중인 서류 발급 요청을 승인하거나 반려할 수 있어요.</p>

      {/* 승인자 선택 */}
      <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: '#8b91ab', marginBottom: 8, display: 'block' }}>승인자 (서명)</label>
        <select
          value={selectedDirector}
          onChange={e => setSelectedDirector(e.target.value)}
          style={{ width: '100%', background: '#0d1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f1f3f9', fontSize: 14 }}
        >
          {directors.map(d => (
            <option key={d.id} value={d.id}>{d.nameEn || d.name} ({d.position})</option>
          ))}
        </select>
      </div>

      {/* 요청 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#8b91ab', padding: 40 }}>로딩 중...</div>
      ) : requests.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 40, textAlign: 'center', color: '#8b91ab', fontSize: 14 }}>
          대기 중인 요청이 없어요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <div key={req.id} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 4 }}>
                    {req.employeeNameTh} ({req.employeeNameEn})
                  </div>
                  <div style={{ fontSize: 13, color: '#818cf8', fontWeight: 500 }}>
                    {DOC_TYPES[req.documentType] || req.documentType}
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>

              {req.requestNote && (
                <div style={{ fontSize: 12, color: '#8b91ab', background: '#0d1020', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                  메모: {req.requestNote}
                </div>
              )}

              <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 16 }}>
                신청일: {new Date(req.requestedAt).toLocaleDateString('ko-KR')}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleApprove(req.id, true)}
                  disabled={processingId === req.id}
                  style={{ flex: 1, background: '#1a3a2a', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: processingId === req.id ? 0.6 : 1 }}
                >
                  {processingId === req.id ? 'PDF 생성 중...' : '승인 및 PDF 발급'}
                </button>
                <button
                  onClick={() => handleApprove(req.id, false)}
                  disabled={processingId === req.id}
                  style={{ flex: 1, background: '#3a1a1a', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: processingId === req.id ? 0.6 : 1 }}
                >
                  반려
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}