'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const DOC_TYPES = {
  'salary-certificate': '재직증명서 (หนังสือรับรองเงินเดือน)',
  'payslip': '월급명세서 (สลิปเงินเดือน)',
}

export default function MyDocumentsPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!session?.user?.email) return
    fetch('/api/employees/me')
      .then(r => r.json())
      .then(emp => {
        if (emp?.employee_id || emp?.id) loadDocuments(emp.employee_id || emp.id)
        else if (emp?.email) loadDocuments(emp.email)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session])

  async function loadDocuments(employeeId) {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/request?employeeId=${employeeId}`)
      const data = await res.json()
      if (data.success) setDocuments(data.requests.reverse())
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all'
    ? documents
    : documents.filter(d => d.status === filter)

  function statusBadge(status) {
    const map = {
      pending: { label: 'รอตรวจสอบ', bg: '#2d3a6b', color: '#818cf8' },
      approved: { label: 'ออกเอกสารแล้ว', bg: '#1a3a2a', color: '#4ade80' },
      rejected: { label: 'ไม่อนุมัติ', bg: '#3a1a1a', color: '#f87171' },
    }
    const s = map[status] || map.pending
    return (
      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
        {s.label}
      </span>
    )
  }

  const counts = {
    all: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f1f3f9' }}>เอกสารของฉัน</h1>
        <a href="/documents/request"
          style={{ background: '#4f62f7', color: 'white', padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          + ขอเอกสาร
        </a>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'pending', label: 'รอตรวจสอบ' },
          { key: 'approved', label: 'ออกเอกสารแล้ว' },
          { key: 'rejected', label: 'ไม่อนุมัติ' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              background: filter === tab.key ? '#4f62f7' : 'rgba(255,255,255,0.06)',
              color: filter === tab.key ? 'white' : '#8b91ab',
            }}
          >
            {tab.label} {counts[tab.key] > 0 && `(${counts[tab.key]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8b91ab', padding: 40 }}>로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗂️</div>
          <div style={{ color: '#8b91ab', fontSize: 14 }}>ไม่มีเอกสาร</div>
          <a href="/documents/request"
            style={{ display: 'inline-block', marginTop: 16, background: '#4f62f7', color: 'white', padding: '8px 20px', borderRadius: 10, fontSize: 13, textDecoration: 'none' }}>
            ยื่นขอเอกสาร
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(doc => (
            <div key={doc.id} style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 3 }}>
                    {DOC_TYPES[doc.documentType] || doc.documentType}
                  </div>
                  <div style={{ fontSize: 11, color: '#8b91ab' }}>
                    วันที่ยื่น: {new Date(doc.requestedAt).toLocaleDateString('th-TH')}
                  </div>
                </div>
                {statusBadge(doc.status)}
              </div>

              {doc.requestNote && (
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 8 }}>
                  메모: {doc.requestNote}
                </div>
              )}

              {doc.status === 'approved' && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8b91ab', flex: 1 }}>
                    วันที่ออก: {new Date(doc.approvedAt).toLocaleDateString('th-TH')}
                  </div>
                  {doc.driveUrl && (
                    <a href={doc.driveUrl} target="_blank" rel="noreferrer"
                      style={{ background: '#1e2d5a', color: '#818cf8', padding: '6px 14px', borderRadius: 8, fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
                      ดูเอกสาร
                    </a>
                  )}
                </div>
              )}

              {doc.status === 'rejected' && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#f87171' }}>
                  ไม่ได้รับการอนุมัติ{doc.rejectedReason ? ` · เหตุผล: ${doc.rejectedReason}` : ''} กรุณายื่นใหม่อีกครั้ง
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}