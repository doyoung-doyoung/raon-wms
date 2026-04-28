'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

export default function AnnounceConfirmPage() {
  const { token } = useParams()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/announcements/confirm?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setAnnouncement(data)
      })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้'))
      .finally(() => setLoading(false))
  }, [token])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/announcements/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, employeeEmail: email }),
      })
      const data = await res.json()
      if (data.success) setConfirmed(true)
      else setError(data.error || 'เกิดข้อผิดพลาด')
    } catch { setError('เกิดข้อผิดพลาด') }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d1020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (confirmed) return (
    <div style={{ minHeight: '100vh', background: '#0d1020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
        <h1 style={{ color: '#4ade80', fontSize: 24, marginBottom: 10 }}>รับทราบแล้ว!</h1>
        <p style={{ color: '#8b91ab', fontSize: 15 }}>ขอบคุณที่ยืนยันการรับทราบประกาศนี้</p>
        <p style={{ color: '#555', fontSize: 13, marginTop: 8 }}>RAON (Thailand) Co., Ltd.</p>
      </div>
    </div>
  )

  if (error && !announcement) return (
    <div style={{ minHeight: '100vh', background: '#0d1020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: '#f87171', fontSize: 20, marginBottom: 10 }}>ลิงก์ไม่ถูกต้อง</h1>
        <p style={{ color: '#8b91ab', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d1020', fontFamily: 'sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', borderRadius: 16, padding: '28px 32px', color: '#fff', marginBottom: 20 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>RAON (Thailand) Co., Ltd.</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>ประกาศ / 공지사항</h1>
        </div>
        <div style={{ background: '#141828', borderRadius: 12, padding: '24px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ color: '#f1f3f9', margin: '0 0 16px', fontSize: 18 }}>{announcement?.title}</h2>
          <p style={{ color: '#8b91ab', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>{announcement?.content}</p>
          <div style={{ fontSize: 12, color: '#555', marginTop: 16 }}>{announcement?.createdAt}</div>
        </div>
        <div style={{ background: '#141828', borderRadius: 12, padding: '24px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ color: '#8b91ab', fontSize: 14, marginBottom: 20 }}>กรุณายืนยันว่าท่านได้รับทราบประกาศนี้แล้ว</p>
          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button onClick={handleConfirm} disabled={submitting} style={{ padding: '13px 40px', background: submitting ? '#334' : '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'กำลังบันทึก...' : '✓ รับทราบ / 확인했습니다'}
          </button>
        </div>
        <p style={{ textAlign: 'center', color: '#444', fontSize: 12, marginTop: 20 }}>RAON (Thailand) Co., Ltd. | raonthailand23@gmail.com</p>
      </div>
    </div>
  )
}
