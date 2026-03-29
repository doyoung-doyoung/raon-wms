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
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    if (session?.isAdmin) loadRequests()
    else setLoading(false)
  }, [session])

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
    setProcessingId(requestId)
    try {
      const res = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          approved,
          directorId: session.user.email,
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

  if (!session?.isAdmin) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🚫</div>
        <div style={{ color: '#f87171', fontSize: 15 }}>관리자만 접근할 수 있어요.</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f1f3f9', marginBottom: 8 }}>서류 발급 승인</h1>
      <p style={{ fontSize: 13, color: '#8b91ab', marginBottom: 24 }}>
        승인자: <span style={{ color: '#818cf8', fontWeight: 600 }}>{session?.user?.name}</span>
      </p>

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
                <span style={{ background: '#2d3a6b', color: '#818cf8', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  대기 중
                </span>
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