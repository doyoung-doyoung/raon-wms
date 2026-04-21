'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function ApproveQuotationPage() {
  const { token } = useParams()
  const [quotation, setQuotation] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [name,      setName]      = useState('')
  const [approved,  setApproved]  = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/quotations/approve?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setQuotation(data)
      })
      .catch(() => setError('Failed to load quotation.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleApprove = async () => {
    if (!name.trim()) return setError('Please enter your name to confirm approval.')
    setSubmitting(true)
    setError('')
    try {
      const res  = await fetch('/api/quotations/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, approverName: name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to approve.'); return }
      setApproved(true)
    } catch {
      setError('An error occurred. Please try again.')
    }
    setSubmitting(false)
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (approved) return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#15803d', margin: '0 0 12px' }}>Quotation Approved!</h1>
        <p style={{ color: '#166534', fontSize: 16, margin: '0 0 8px' }}>
          Thank you, <strong>{name}</strong>.
        </p>
        <p style={{ color: '#4ade80', fontSize: 14 }}>
          Quotation <strong>{quotation?.number}</strong> has been successfully approved.
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 24 }}>
          RAON (Thailand) Co., Ltd. will follow up with you shortly.
        </p>
      </div>
    </div>
  )

  if (error && !quotation) return (
    <div style={{ minHeight: '100vh', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#be123c', margin: '0 0 10px' }}>Link Not Valid</h1>
        <p style={{ color: '#9f1239', fontSize: 15 }}>{error}</p>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 16 }}>
          This link may have expired or already been used.<br />
          Please contact RAON (Thailand) at raonthailand23@gmail.com
        </p>
      </div>
    </div>
  )

  const items = quotation?.items || []
  const currency = quotation?.currency || 'THB'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', borderRadius: 16, padding: '28px 32px', color: '#fff', marginBottom: 20 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>RAON (Thailand) Co., Ltd.</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Quotation Approval</h1>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
            {quotation?.number} · For <strong>{quotation?.client_name}</strong>
          </div>
        </div>

        {/* 금액 요약 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Subtotal',        value: fmt(quotation?.subtotal) },
              { label: 'Management Fee',  value: fmt(quotation?.management_fee_amount) },
              { label: 'VAT (7%)',        value: fmt(quotation?.vat_amount) },
              { label: 'WHT',             value: `-${fmt(quotation?.wht_amount)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{row.label}</span>
                <span style={{ color: '#1e293b', fontWeight: 500 }}>{currency} {row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#1d4ed8', fontWeight: 600, fontSize: 14 }}>Grand Total</span>
            <span style={{ color: '#1d4ed8', fontWeight: 800, fontSize: 22 }}>{currency} {fmt(quotation?.grand_total)}</span>
          </div>
        </div>

        {/* 서비스 항목 */}
        {items.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Services</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Description', 'Qty', 'Unit Price', 'Amount'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Description' ? 'left' : 'right', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 10px', color: '#1e293b' }}>{item.description || item.name || '-'}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#475569' }}>{item.qty || item.quantity || 1}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#475569' }}>{fmt(item.unitPrice || item.unit_price)}</td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#1e293b', fontWeight: 500 }}>{fmt(item.amount || item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 승인 섹션 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Approve This Quotation</div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
            By clicking "Approve", you confirm that you have reviewed and agreed to the above quotation.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 6 }}>Your Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>
          )}
          <button
            onClick={handleApprove}
            disabled={submitting || !name.trim()}
            style={{ width: '100%', padding: '13px', background: submitting || !name.trim() ? '#d1fae5' : '#22c55e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
          >
            {submitting ? 'Approving...' : '✓ Approve Quotation'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
          RAON (Thailand) Co., Ltd. | raonthailand23@gmail.com | +66(0)62 124 7979
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
