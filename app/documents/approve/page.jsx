'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const DOC_TYPES = {
  'salary-certificate': 'หนังสือรับรองเงินเดือน',
  'payslip': 'สลิปเงินเดือน',
}

const STATUS = {
  pending:  { label: 'รอตรวจสอบ',  bg: '#2d3a6b', color: '#818cf8' },
  approved: { label: 'อนุมัติแล้ว', bg: '#1a3a2a', color: '#4ade80' },
  rejected: { label: 'ไม่อนุมัติ',  bg: '#3a1a1a', color: '#f87171' },
}

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export default function DocumentApprovePage() {
  const { data: session } = useSession()
  const now = new Date()
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (session?.isAdmin) loadRequests()
    else setLoading(false)
  }, [session, selYear, selMonth])

  async function loadRequests() {
    setLoading(true)
    try {
      const res = await fetch('/api/documents/request')
      const data = await res.json()
      if (data.success) {
        const monthStr = `${selYear}-${String(selMonth).padStart(2,'0')}`
        const filtered = data.requests.filter(r => (r.requestedAt || '').startsWith(monthStr))
        setRequests(filtered.reverse())
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(requestId) {
    setProcessingId(requestId)
    try {
      const res = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approved: true, directorId: session.user.email }),
      })
      const data = await res.json()
      if (data.success) { alert('อนุมัติเรียบร้อย! ส่งอีเมลถึงพนักงานแล้ว'); loadRequests() }
      else alert('เกิดข้อผิดพลาด: ' + data.error)
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message) }
    finally { setProcessingId(null) }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { alert('กรุณากรอกเหตุผลที่ไม่อนุมัติ'); return }
    setProcessingId(rejectModal)
    try {
      const res = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: rejectModal, approved: false, directorId: session.user.email, rejectedReason: rejectReason }),
      })
      const data = await res.json()
      if (data.success) { setRejectModal(null); setRejectReason(''); loadRequests() }
      else alert('เกิดข้อผิดพลาด: ' + data.error)
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message) }
    finally { setProcessingId(null) }
  }

  const prevMonth = () => { if (selMonth === 1) { setSelYear(y => y-1); setSelMonth(12) } else setSelMonth(m => m-1) }
  const nextMonth = () => { if (selMonth === 12) { setSelYear(y => y+1); setSelMonth(1) } else setSelMonth(m => m+1) }

  const displayed = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)

  if (!session?.isAdmin) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🚫</div>
        <div style={{ color: '#f87171', fontSize: 15 }}>ผู้จัดการเท่านั้นที่เข้าถึงได้</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f1f3f9', margin: 0 }}>อนุมัติเอกสาร</h1>
          <p style={{ fontSize: 13, color: '#8b91ab', margin: '4px 0 0' }}>ผู้อนุมัติ: <span style={{ color: '#818cf8' }}>{session?.user?.name}</span></p>
        </div>
        <a href="/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>🏠 홈</a>
      </div>

      {/* 월 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', cursor: 'pointer', fontSize: 14 }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', minWidth: 100, textAlign: 'center' }}>
          {MONTHS[selMonth-1]} {selYear}
        </div>
        <button onClick={nextMonth} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', cursor: 'pointer', fontSize: 14 }}>›</button>
        <button onClick={loadRequests} style={{ marginLeft: 8, padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', cursor: 'pointer', fontSize: 12 }}>รีเฟรช</button>
      </div>

      {/* 상태 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filterStatus === f ? 600 : 400,
              background: filterStatus === f ? '#4f62f7' : 'rgba(255,255,255,0.06)',
              color: filterStatus === f ? '#fff' : '#8b91ab' }}>
            {{ all:'ทั้งหมด', pending:'รอตรวจสอบ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ' }[f]}
            {f === 'pending' && requests.filter(r => r.status === 'pending').length > 0 &&
              <span style={{ marginLeft: 5, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{requests.filter(r => r.status === 'pending').length}</span>
            }
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8b91ab', alignSelf: 'center' }}>รวม {displayed.length} รายการ</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8b91ab', padding: 40 }}>กำลังโหลด...</div>
      ) : displayed.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 40, textAlign: 'center', color: '#8b91ab', fontSize: 14 }}>
          ไม่มีรายการในเดือนนี้
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map(req => {
            const st = STATUS[req.status] || STATUS.pending
            return (
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
                  <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {st.label}
                  </span>
                </div>

                {req.requestNote && (
                  <div style={{ fontSize: 12, color: '#8b91ab', background: '#0d1020', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                    หมายเหตุ: {req.requestNote}
                  </div>
                )}

                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: req.status === 'pending' ? 16 : 8 }}>
                  วันที่ยื่น: {new Date(req.requestedAt).toLocaleDateString('th-TH')}
                  {req.approvedAt && ` · วันที่ดำเนินการ: ${new Date(req.approvedAt).toLocaleDateString('th-TH')}`}
                </div>

                {req.status === 'rejected' && req.rejectedReason && (
                  <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                    เหตุผลที่ไม่อนุมัติ: {req.rejectedReason}
                  </div>
                )}

                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApprove(req.id)} disabled={processingId === req.id}
                      style={{ flex: 1, background: '#1a3a2a', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: processingId === req.id ? 0.6 : 1 }}>
                      {processingId === req.id ? 'กำลังสร้าง PDF...' : 'อนุมัติและออกเอกสาร'}
                    </button>
                    <button onClick={() => { setRejectModal(req.id); setRejectReason('') }} disabled={processingId === req.id}
                      style={{ flex: 1, background: '#3a1a1a', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: processingId === req.id ? 0.6 : 1 }}>
                      ไม่อนุมัติ
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 반려 사유 모달 */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f3f9', margin: '0 0 16px' }}>เหตุผลที่ไม่อนุมัติ</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="กรุณากรอกเหตุผลที่ไม่อนุมัติ..."
              rows={4}
              style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#f1f3f9', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.06)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ยกเลิก
              </button>
              <button onClick={handleReject} disabled={processingId !== null}
                style={{ padding: '9px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
