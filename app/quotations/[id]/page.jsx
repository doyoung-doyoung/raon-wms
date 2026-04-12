'use client'

import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS_FLOW = [
  { key: 'draft',             label: 'Draft',             color: '#8b91ab' },
  { key: 'pending_director',  label: 'Pending Approval',  color: '#f59e0b' },
  { key: 'approved',          label: 'Director Approved', color: '#4f62f7' },
  { key: 'customer_approved', label: 'Customer Approved', color: '#06b6d4' },
  { key: 'invoiced',          label: 'Invoice Issued',    color: '#a78bfa' },
  { key: 'paid',              label: 'Paid',              color: '#4ade80' },
]

const STATUS_INFO = Object.fromEntries(
  STATUS_FLOW.map(s => [s.key, s])
)

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return String(d)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

const s = {
  page:   { color: '#f1f3f9' },
  card:   { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 22, marginBottom: 14 },
  lbl:    { fontSize: 12, color: '#8b91ab', marginBottom: 5, display: 'block' },
  inp:    { width: '100%', padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  numInp: { padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
  sel:    { width: '100%', padding: '9px 13px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn:    (bg, c) => ({ padding: '9px 20px', background: bg, color: c, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  btnSm:  (bg, c, bc) => ({ padding: '6px 14px', background: bg, color: c, border: `1px solid ${bc || 'transparent'}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }),
  grid2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  totRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  totGT:  { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: 4 },
  overlay:{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:  { background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 440, maxWidth: '94vw' },
}

const EMPTY_ITEM = { name: '', qty: 1, unitPrice: 0, total: 0, details: [''] }

function calcTotals(items, mgmtRate, clientType) {
  const itemsSum   = items.reduce((s, it) => s + (Number(it.total) || 0), 0)
  const mgmtAmt    = itemsSum * (Number(mgmtRate) || 0) / 100
  const subtotal   = itemsSum + mgmtAmt
  const vatAmount  = clientType === 'domestic' ? subtotal * 0.07 : 0
  const whtAmount  = clientType === 'domestic' ? subtotal * 0.03 : 0
  const grandTotal = clientType === 'domestic' ? subtotal + vatAmount - whtAmount : subtotal
  return { itemsSum, mgmtAmt, subtotal, vatAmount, whtAmount, grandTotal }
}

export default function QuotationDetailPage() {
  const { data: session } = useSession()
  const router   = useRouter()
  const { id }   = useParams()
  const [q,       setQ]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [acting,  setActing]  = useState(false)
  const [modal,   setModal]   = useState(null) // 'email' | 'paid' | 'reject'
  const [emailTo, setEmailTo] = useState('')
  const [paidNote,setPaidNote]= useState('')
  const [rejectR, setRejectR] = useState('')

  // Edit state
  const [editClient, setEditClient] = useState({})
  const [editItems,  setEditItems]  = useState([])
  const [editMgmt,   setEditMgmt]   = useState(0)
  const [editPayDays,setEditPayDays]= useState(3)
  const [editRemark, setEditRemark] = useState('')

  const fetchQ = useCallback(async () => {
    try {
      const data = await fetch(`/api/quotations/${id}`).then(r => r.json())
      if (data.error) { toast.error(data.error); router.push('/quotations'); return }
      setQ(data)
      setEmailTo(data.client_email || '')
    } catch (err) { toast.error('Failed to load'); }
    finally { setLoading(false) }
  }, [id, router])

  useEffect(() => { fetchQ() }, [fetchQ])

  const startEdit = () => {
    if (!q) return
    setEditClient({ name: q.client_name, address: q.client_address, taxId: q.client_tax_id, email: q.client_email, tel: q.client_tel })
    setEditItems(q.items?.length ? q.items.map(it => ({ ...it, details: it.details?.length ? it.details : [''] })) : [{ ...EMPTY_ITEM }])
    setEditMgmt(q.management_fee_rate || 0)
    setEditPayDays(q.payment_days || 3)
    setEditRemark(q.remark || '')
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editClient.name.trim()) { toast.error('Client name is required.'); return }
    setActing(true)
    try {
      const tot = calcTotals(editItems.filter(it => it.name.trim()), editMgmt, q.client_type)
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          clientName: editClient.name, clientAddress: editClient.address,
          clientTaxId: editClient.taxId, clientEmail: editClient.email, clientTel: editClient.tel,
          items: editItems.filter(it => it.name.trim()).map(it => ({
            ...it, details: it.details.filter(d => d.trim()),
            total: Number(it.total) || 0,
          })),
          managementFeeRate: Number(editMgmt) || 0,
          managementFeeAmount: tot.mgmtAmt,
          subtotal: tot.subtotal, vatAmount: tot.vatAmount, whtAmount: tot.whtAmount, grandTotal: tot.grandTotal,
          paymentDays: Number(editPayDays) || 3, remark: editRemark,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Saved!')
      setEditing(false)
      fetchQ()
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  const doAction = async (action, extra = {}) => {
    setActing(true)
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      toast.success('Done!')
      setModal(null)
      fetchQ()
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  const downloadPdf = async () => {
    setActing(true)
    try {
      const res  = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_pdf' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const bytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))
      const url   = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      const a     = document.createElement('a')
      a.href = url; a.download = data.filename; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  const sendEmail = async () => {
    if (!emailTo.trim()) { toast.error('Email address required'); return }
    setActing(true)
    try {
      const res  = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_email', email: emailTo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Email sent to ${emailTo}!`)
      setModal(null)
    } catch (err) { toast.error(err.message) }
    finally { setActing(false) }
  }

  // Edit item helpers
  const updateEditItem = (idx, field, val) => {
    setEditItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [field]: val }
      if (field === 'qty' || field === 'unitPrice')
        updated.total = (Number(field === 'qty' ? val : it.qty) || 0) * (Number(field === 'unitPrice' ? val : it.unitPrice) || 0)
      return updated
    }))
  }
  const updateEditDetail = (iIdx, dIdx, val) => setEditItems(prev => prev.map((it, i) => i !== iIdx ? it : { ...it, details: it.details.map((d, j) => j === dIdx ? val : d) }))
  const addEditDetailRow = (iIdx) => setEditItems(prev => prev.map((it, i) => i !== iIdx ? it : { ...it, details: [...it.details, ''] }))
  const removeEditDetail = (iIdx, dIdx) => setEditItems(prev => prev.map((it, i) => i !== iIdx ? it : { ...it, details: it.details.filter((_, j) => j !== dIdx) }))
  const addEditItem   = () => setEditItems(prev => [...prev, { ...EMPTY_ITEM, details: [''] }])
  const removeEditItem = (idx) => setEditItems(prev => prev.filter((_, i) => i !== idx))

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#8b91ab' }}>Loading...</div>
  if (!q) return null

  const isAdmin   = session?.isAdmin
  const isMine    = q.created_by_email === session?.user?.email
  const stInfo    = STATUS_INFO[q.status] || STATUS_INFO.draft
  const docType   = q.status === 'paid' ? 'receipt' : q.status === 'invoiced' ? 'invoice' : 'quotation'
  const docLabel  = { quotation: 'Quotation', invoice: 'Invoice', receipt: 'Receipt' }[docType]
  const docNum    = docType === 'quotation' ? q.number : (q.invoice_number || q.number)
  const isDomestic= q.client_type === 'domestic'

  const editTot = editing ? calcTotals(editItems.filter(it => it.name.trim()), editMgmt, q.client_type) : null

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button style={{ ...s.btnSm('rgba(255,255,255,0.06)', '#8b91ab'), marginBottom: 10 }}
            onClick={() => router.push('/quotations')}>← Back</button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>
            {docLabel} <span style={{ color: '#8b91ab', fontWeight: 400 }}>{docNum}</span>
          </h1>
          <div style={{ fontSize: 13, color: '#8b91ab', marginTop: 3 }}>{q.client_name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${stInfo.color}25`, color: stInfo.color }}>
            {stInfo.label}
          </span>
          <button style={s.btnSm('rgba(79,98,247,0.15)', '#818cf8', 'rgba(79,98,247,0.3)')}
            onClick={downloadPdf} disabled={acting}>
            ⬇ PDF
          </button>
          <button style={s.btnSm('rgba(6,182,212,0.12)', '#22d3ee', 'rgba(6,182,212,0.3)')}
            onClick={() => setModal('email')}>
            ✉ Email
          </button>
        </div>
      </div>

      {/* ── Status Timeline ── */}
      <div style={{ ...s.card, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {STATUS_FLOW.map((st, idx) => {
            const isActive   = q.status === st.key
            const isPast     = STATUS_FLOW.findIndex(s => s.key === q.status) > idx
            const isCancelled= q.status === 'cancelled'
            return (
              <React.Fragment key={st.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: isActive ? st.color : isPast ? `${st.color}50` : 'rgba(255,255,255,0.08)', color: isActive || isPast ? '#fff' : '#8b91ab', transition: 'all 0.2s', flexShrink: 0 }}>
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <div style={{ fontSize: 10, color: isActive ? st.color : '#8b91ab', marginTop: 4, textAlign: 'center', lineHeight: 1.3, maxWidth: 80 }}>
                    {st.label}
                  </div>
                </div>
                {idx < STATUS_FLOW.length - 1 && (
                  <div style={{ flex: 1, height: 1, minWidth: 16, background: isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', marginBottom: 18 }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
        {q.status === 'cancelled' && (
          <div style={{ textAlign: 'center', color: '#f87171', fontSize: 12, marginTop: 8 }}>This document has been cancelled.</div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      {!editing && (
        <div style={{ ...s.card, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8b91ab', marginBottom: 12 }}>Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Edit */}
            {q.status === 'draft' && (isMine || isAdmin) && (
              <button style={s.btn('rgba(79,98,247,0.15)', '#818cf8')} onClick={startEdit}>✏ Edit</button>
            )}
            {/* Submit for approval */}
            {q.status === 'draft' && (isMine || isAdmin) && (
              <button style={s.btn('rgba(245,158,11,0.15)', '#fbbf24')}
                onClick={() => { if (window.confirm('이사에게 승인을 요청할까요?')) doAction('request_approval') }}>
                📩 Submit for Director Approval
              </button>
            )}
            {/* Director approve/reject */}
            {q.status === 'pending_director' && isAdmin && (
              <>
                <button style={s.btn('rgba(74,222,128,0.15)', '#4ade80')}
                  onClick={() => { if (window.confirm('승인하시겠습니까?')) doAction('director_approve') }}>
                  ✅ Approve
                </button>
                <button style={s.btn('rgba(248,113,113,0.15)', '#f87171')}
                  onClick={() => setModal('reject')}>
                  ❌ Reject
                </button>
              </>
            )}
            {/* Customer approved */}
            {q.status === 'approved' && (isMine || isAdmin) && (
              <button style={s.btn('rgba(6,182,212,0.15)', '#22d3ee')}
                onClick={() => { if (window.confirm('고객이 견적서를 승인했습니까?')) doAction('customer_approve') }}>
                🤝 Customer Approved
              </button>
            )}
            {/* Convert to invoice */}
            {q.status === 'customer_approved' && (isMine || isAdmin) && (
              <button style={s.btn('#4f62f7', '#fff')}
                onClick={() => { if (window.confirm('인보이스를 발행할까요?')) doAction('to_invoice') }}>
                📋 Issue Invoice
              </button>
            )}
            {/* Mark paid */}
            {q.status === 'invoiced' && (isMine || isAdmin) && (
              <button style={s.btn('rgba(74,222,128,0.15)', '#4ade80')}
                onClick={() => setModal('paid')}>
                💰 Mark as Paid → Receipt
              </button>
            )}
            {/* Cancel */}
            {!['paid', 'cancelled'].includes(q.status) && (isMine || isAdmin) && (
              <button style={s.btn('rgba(248,113,113,0.08)', '#f87171')}
                onClick={() => { if (window.confirm('이 견적서를 취소할까요?')) doAction('cancel') }}>
                Cancel
              </button>
            )}
          </div>
          {q.director_reject_reason && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 6, fontSize: 12, color: '#f87171' }}>
              반려 사유: {q.director_reject_reason}
            </div>
          )}
        </div>
      )}

      {/* ── View Mode ── */}
      {!editing && (
        <>
          {/* Document Info */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', marginBottom: 2 }}>{docLabel.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: '#8b91ab' }}>
                  {docType === 'quotation' ? q.number : q.invoice_number} · {fmtDate(q.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, background: q.client_type === 'domestic' ? 'rgba(79,98,247,0.15)' : 'rgba(245,158,11,0.15)', color: q.client_type === 'domestic' ? '#818cf8' : '#fbbf24', fontWeight: 600 }}>
                  {q.client_type === 'domestic' ? '🇹🇭 Thailand' : '🌍 International'}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#f1f3f9', fontWeight: 600 }}>
                  {q.currency}
                </span>
              </div>
            </div>

            {/* Client info */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 8, fontWeight: 600 }}>CLIENT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', gridColumn: '1 / -1' }}>{q.client_name}</div>
                {q.client_address && <div style={{ fontSize: 12, color: '#8b91ab' }}>📍 {q.client_address}</div>}
                {q.client_email   && <div style={{ fontSize: 12, color: '#8b91ab' }}>✉ {q.client_email}</div>}
                {q.client_tel     && <div style={{ fontSize: 12, color: '#8b91ab' }}>📞 {q.client_tel}</div>}
                {q.client_tax_id  && <div style={{ fontSize: 12, color: '#8b91ab' }}>🪪 Tax ID: {q.client_tax_id}</div>}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 100px', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#8b91ab', fontWeight: 600 }}>DETAIL</span>
                <span style={{ fontSize: 11, color: '#8b91ab', fontWeight: 600, textAlign: 'center' }}>UNIT</span>
                <span style={{ fontSize: 11, color: '#8b91ab', fontWeight: 600, textAlign: 'right' }}>COST</span>
                <span style={{ fontSize: 11, color: '#8b91ab', fontWeight: 600, textAlign: 'right' }}>TOTAL</span>
              </div>
              {(q.items || []).map((item, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 100px', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9' }}>{item.name}</span>
                    <span style={{ fontSize: 12, color: '#8b91ab', textAlign: 'center' }}>{item.qty} Set</span>
                    <span style={{ fontSize: 12, color: '#8b91ab', textAlign: 'right' }}>{fmt(item.unitPrice)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9', textAlign: 'right' }}>{fmt(item.total)}</span>
                  </div>
                  {(item.details || []).filter(d => d.trim()).map((d, di) => (
                    <div key={di} style={{ fontSize: 12, color: '#8b91ab', paddingLeft: 12, paddingTop: 2 }}>· {d}</div>
                  ))}
                </div>
              ))}
              {Number(q.management_fee_rate) > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 100px', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 12, color: '#8b91ab' }}>Management Fee ({q.management_fee_rate}%)</span>
                  <span /><span />
                  <span style={{ fontSize: 12, color: '#8b91ab', textAlign: 'right' }}>{fmt(q.management_fee_amount)}</span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <div style={{ minWidth: 280 }}>
                <div style={s.totRow}>
                  <span style={{ fontSize: 13, color: '#8b91ab' }}>Total Amount (A)</span>
                  <span style={{ fontSize: 13, color: '#f1f3f9', fontWeight: 600 }}>{fmt(q.subtotal)} {q.currency}</span>
                </div>
                {isDomestic && (
                  <>
                    <div style={s.totRow}>
                      <span style={{ fontSize: 12, color: '#8b91ab' }}>VAT 7% (B)</span>
                      <span style={{ fontSize: 12, color: '#8b91ab' }}>{fmt(q.vat_amount)} {q.currency}</span>
                    </div>
                    <div style={s.totRow}>
                      <span style={{ fontSize: 12, color: '#8b91ab' }}>WHT 3% (C)</span>
                      <span style={{ fontSize: 12, color: '#f87171' }}>− {fmt(q.wht_amount)} {q.currency}</span>
                    </div>
                    <div style={s.totGT}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9' }}>Grand Total (A+B−C)</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>{fmt(q.grand_total)} {q.currency}</span>
                    </div>
                  </>
                )}
                {!isDomestic && (
                  <div style={s.totGT}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f9' }}>Grand Total</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>{fmt(q.grand_total)} {q.currency}</span>
                  </div>
                )}
              </div>
            </div>
            {q.remark && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#8b91ab' }}>
                <strong style={{ color: '#f1f3f9' }}>Remark:</strong> {q.remark}
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ ...s.card, padding: '14px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 20px' }}>
              <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Created by</span><div style={{ fontSize: 13, color: '#f1f3f9' }}>{q.created_by_name}</div></div>
              <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Created</span><div style={{ fontSize: 13, color: '#f1f3f9' }}>{fmtDate(q.created_at)}</div></div>
              {q.director_approved_at && <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Director Approved</span><div style={{ fontSize: 13, color: '#f1f3f9' }}>{fmtDate(q.director_approved_at)}</div></div>}
              {q.invoiced_at && <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Invoice Issued</span><div style={{ fontSize: 13, color: '#f1f3f9' }}>{fmtDate(q.invoiced_at)}</div></div>}
              {q.paid_at     && <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Paid</span><div style={{ fontSize: 13, color: '#4ade80' }}>{fmtDate(q.paid_at)}</div></div>}
              {q.paid_note   && <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Payment Note</span><div style={{ fontSize: 13, color: '#f1f3f9' }}>{q.paid_note}</div></div>}
              <div><span style={{ fontSize: 11, color: '#8b91ab' }}>Payment Terms</span><div style={{ fontSize: 13, color: '#f1f3f9' }}>{q.payment_days} days</div></div>
            </div>
          </div>
        </>
      )}

      {/* ── Edit Mode ── */}
      {editing && (
        <div>
          <div style={{ ...s.card, borderColor: 'rgba(79,98,247,0.3)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#818cf8', marginBottom: 16 }}>✏ Editing Quotation</div>

            {/* Client */}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b91ab', marginBottom: 10 }}>CLIENT INFO</div>
            <div style={s.grid2}>
              <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
                <label style={s.lbl}>Company Name</label>
                <input style={s.inp} value={editClient.name} onChange={e => setEditClient(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
                <label style={s.lbl}>Address</label>
                <input style={s.inp} value={editClient.address} onChange={e => setEditClient(c => ({ ...c, address: e.target.value }))} />
              </div>
              {q.client_type === 'domestic' && (
                <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
                  <label style={s.lbl}>Tax ID</label>
                  <input style={s.inp} value={editClient.taxId} onChange={e => setEditClient(c => ({ ...c, taxId: e.target.value }))} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={s.lbl}>Email</label>
                <input style={s.inp} value={editClient.email} onChange={e => setEditClient(c => ({ ...c, email: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={s.lbl}>Tel</label>
                <input style={s.inp} value={editClient.tel} onChange={e => setEditClient(c => ({ ...c, tel: e.target.value }))} />
              </div>
            </div>

            {/* Items */}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b91ab', marginBottom: 10, marginTop: 8 }}>ITEMS</div>
            {editItems.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 14, marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#f1f3f9', fontWeight: 600 }}>Item {idx + 1}</span>
                  {editItems.length > 1 && <button style={s.btnSm('rgba(248,113,113,0.1)', '#f87171')} onClick={() => removeEditItem(idx)}>Remove</button>}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={s.lbl}>Name</label>
                  <input style={s.inp} value={item.name} onChange={e => updateEditItem(idx, 'name', e.target.value)} />
                </div>
                <div style={s.grid3}>
                  <div><label style={s.lbl}>Qty</label><input type="number" style={s.numInp} value={item.qty} onChange={e => updateEditItem(idx, 'qty', e.target.value)} /></div>
                  <div><label style={s.lbl}>Unit Price</label><input type="number" style={s.numInp} value={item.unitPrice} onChange={e => updateEditItem(idx, 'unitPrice', e.target.value)} /></div>
                  <div><label style={s.lbl}>Total</label><div style={{ padding: '9px 13px', background: 'rgba(79,98,247,0.08)', borderRadius: 8, color: '#a5b4fc', fontSize: 13, fontWeight: 600 }}>{fmt(item.total)}</div></div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ ...s.lbl, marginBottom: 6 }}>Details</label>
                  {item.details.map((d, di) => (
                    <div key={di} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: '#8b91ab', paddingTop: 9 }}>–</span>
                      <input style={{ ...s.inp, flex: 1 }} value={d} onChange={e => updateEditDetail(idx, di, e.target.value)} />
                      <button style={s.btnSm('transparent', '#8b91ab')} onClick={() => removeEditDetail(idx, di)}>×</button>
                    </div>
                  ))}
                  {item.details.length < 12 && <button style={s.btnSm('rgba(255,255,255,0.04)', '#8b91ab')} onClick={() => addEditDetailRow(idx)}>+ Add Detail</button>}
                </div>
              </div>
            ))}
            <button style={s.btnSm('#4f62f7', '#fff')} onClick={addEditItem}>+ Add Item</button>

            {/* Fee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
              <div><label style={s.lbl}>Management Fee (%)</label><input type="number" style={s.numInp} value={editMgmt} onChange={e => setEditMgmt(e.target.value)} /></div>
              <div><label style={s.lbl}>Payment Days</label><input type="number" style={s.numInp} value={editPayDays} onChange={e => setEditPayDays(e.target.value)} /></div>
              <div />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={s.lbl}>Remark</label>
              <textarea style={{ ...s.inp, height: 60, resize: 'vertical' }} value={editRemark} onChange={e => setEditRemark(e.target.value)} />
            </div>

            {/* Edit totals preview */}
            {editTot && (
              <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                <div style={{ maxWidth: 280 }}>
                  <div style={s.totRow}><span style={{ color: '#8b91ab', fontSize: 12 }}>Total Amount (A)</span><span style={{ color: '#f1f3f9', fontSize: 12 }}>{fmt(editTot.subtotal)}</span></div>
                  {isDomestic && <>
                    <div style={s.totRow}><span style={{ color: '#8b91ab', fontSize: 12 }}>VAT 7% (B)</span><span style={{ color: '#8b91ab', fontSize: 12 }}>{fmt(editTot.vatAmount)}</span></div>
                    <div style={s.totRow}><span style={{ color: '#8b91ab', fontSize: 12 }}>WHT 3% (C)</span><span style={{ color: '#f87171', fontSize: 12 }}>− {fmt(editTot.whtAmount)}</span></div>
                  </>}
                  <div style={s.totGT}><span style={{ color: '#f1f3f9', fontSize: 14, fontWeight: 700 }}>Grand Total</span><span style={{ color: '#4ade80', fontSize: 14, fontWeight: 700 }}>{fmt(editTot.grandTotal)} {q.currency}</span></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button style={s.btn('rgba(255,255,255,0.06)', '#8b91ab')} onClick={() => setEditing(false)}>Cancel</button>
              <button style={{ ...s.btn('#4f62f7', '#fff'), opacity: acting ? 0.6 : 1 }} onClick={saveEdit} disabled={acting}>
                {acting ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal === 'email' && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modal}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 16 }}>✉ Send {docLabel} by Email</div>
            <label style={s.lbl}>Recipient Email</label>
            <input style={{ ...s.inp, marginBottom: 16 }} type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@example.com" />
            <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 16 }}>
              The {docLabel} PDF will be attached to the email.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn('rgba(255,255,255,0.06)', '#8b91ab')} onClick={() => setModal(null)}>Cancel</button>
              <button style={{ ...s.btn('#4f62f7', '#fff'), opacity: acting ? 0.6 : 1 }} onClick={sendEmail} disabled={acting}>
                {acting ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'paid' && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modal}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 16 }}>💰 Mark as Paid</div>
            <div style={{ background: 'rgba(74,222,128,0.08)', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 13 }}>
              <div style={{ color: '#f1f3f9', fontWeight: 600 }}>Amount: {fmt(q.grand_total)} {q.currency}</div>
              <div style={{ color: '#8b91ab', fontSize: 12, marginTop: 2 }}>This will generate a Receipt.</div>
            </div>
            <label style={s.lbl}>Payment Note (optional)</label>
            <input style={{ ...s.inp, marginBottom: 16 }} value={paidNote} onChange={e => setPaidNote(e.target.value)} placeholder="e.g. Bank transfer confirmed" />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn('rgba(255,255,255,0.06)', '#8b91ab')} onClick={() => setModal(null)}>Cancel</button>
              <button style={{ ...s.btn('rgba(74,222,128,0.2)', '#4ade80'), opacity: acting ? 0.6 : 1 }}
                onClick={() => doAction('paid', { paidNote })} disabled={acting}>
                {acting ? 'Processing...' : '✅ Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reject' && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modal}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 16 }}>❌ Reject Quotation</div>
            <label style={s.lbl}>Rejection Reason</label>
            <textarea style={{ ...s.inp, height: 80, resize: 'vertical', marginBottom: 16 }}
              value={rejectR} onChange={e => setRejectR(e.target.value)} placeholder="Enter reason for rejection..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn('rgba(255,255,255,0.06)', '#8b91ab')} onClick={() => setModal(null)}>Cancel</button>
              <button style={{ ...s.btn('rgba(248,113,113,0.15)', '#f87171'), opacity: acting ? 0.6 : 1 }}
                onClick={() => doAction('director_reject', { reason: rejectR })} disabled={acting}>
                {acting ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

