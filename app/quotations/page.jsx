'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS = {
  draft:             { label: 'Draft',             color: '#8b91ab', bg: 'rgba(139,145,171,0.15)' },
  pending_director:  { label: 'Awaiting Approval', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  approved:          { label: 'Director Approved', color: '#4f62f7', bg: 'rgba(79,98,247,0.15)'   },
  customer_approved: { label: 'Customer Approved', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'   },
  invoiced:          { label: 'Invoice Issued',    color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  paid:              { label: 'Paid',              color: '#4ade80', bg: 'rgba(74,222,128,0.15)'  },
  cancelled:         { label: 'Cancelled',         color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
}

const s = {
  page:  { color: '#f1f3f9' },
  title: { fontSize: 24, fontWeight: 700, color: '#f1f3f9', margin: 0 },
  sub:   { fontSize: 13, color: '#8b91ab', marginTop: 4, marginBottom: 28 },
  card:  { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18, marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s' },
  tab:   (a) => ({ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: a ? 600 : 400, background: a ? '#4f62f7' : 'rgba(255,255,255,0.06)', color: a ? '#fff' : '#8b91ab', transition: 'all 0.15s' }),
  badge: (st) => {
    const info = STATUS[st] || STATUS.draft
    return { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: info.bg, color: info.color }
  },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statC: (c) => ({ background: '#141828', border: `1px solid ${c}30`, borderRadius: 12, padding: '14px 18px', textAlign: 'center' }),
}

const TABS = [
  { id: 'all',             label: 'All' },
  { id: 'draft',           label: 'Draft' },
  { id: 'pending_director',label: '🔔 Pending' },
  { id: 'approved',        label: 'Approved' },
  { id: 'customer_approved',label: 'Customer ✓' },
  { id: 'invoiced',        label: 'Invoice' },
  { id: 'paid',            label: '✅ Paid' },
]

export default function QuotationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [quotations, setQuotations] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('all')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/quotations').then(r => r.json())
      setQuotations(Array.isArray(data) ? data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')) : [])
    } catch { setQuotations([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const isAdmin = session?.isAdmin
  const pendingCount = quotations.filter(q => q.status === 'pending_director').length

  const displayed = tab === 'all' ? quotations : quotations.filter(q => q.status === tab)

  const statData = [
    { label: 'Total',    count: quotations.length,                                      color: '#8b91ab' },
    { label: 'Pending',  count: pendingCount,                                            color: '#f59e0b' },
    { label: 'Invoiced', count: quotations.filter(q => q.status === 'invoiced').length,  color: '#a78bfa' },
    { label: 'Paid',     count: quotations.filter(q => q.status === 'paid').length,      color: '#4ade80' },
  ]

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={s.title}>📄 Quotations</h1>
          <p style={{ ...s.sub, marginBottom: 0 }}>견적서·인보이스·영수증을 관리합니다</p>
        </div>
        <button
          style={{ padding: '10px 22px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => router.push('/quotations/new')}>
          + New Quotation
        </button>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        {statData.map(st => (
          <div key={st.label} style={s.statC(st.color)}>
            <div style={{ fontSize: 22, fontWeight: 700, color: st.color }}>{st.count}</div>
            <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 3 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'pending_director' && pendingCount > 0 && (
              <span style={{ marginLeft: 5, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8b91ab' }}>Loading...</div>}
      {!loading && displayed.length === 0 && (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 40, textAlign: 'center', color: '#8b91ab' }}>
          No quotations found.
        </div>
      )}

      {!loading && displayed.map(q => (
        <QuotationCard key={q.id} q={q} isAdmin={isAdmin} onRefresh={fetch_}
          onClick={() => router.push(`/quotations/${q.id}`)} />
      ))}
    </div>
  )
}

function QuotationCard({ q, isAdmin, onRefresh, onClick }) {
  const st  = STATUS[q.status] || STATUS.draft
  const num = q.status === 'invoiced' || q.status === 'paid' ? (q.invoice_number || q.number) : q.number
  const docLabel = q.status === 'paid' ? 'Receipt' : (q.status === 'invoiced' ? 'Invoice' : 'Quotation')

  const handleApprove = async (e) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/quotations/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'director_approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Approved!')
      onRefresh()
    } catch (err) { toast.error(err.message) }
  }

  const handleReject = async (e) => {
    e.stopPropagation()
    const reason = window.prompt('반려 사유를 입력해주세요:')
    if (reason === null) return
    try {
      const res = await fetch(`/api/quotations/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'director_reject', reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Rejected.')
      onRefresh()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18, marginBottom: 10, cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,98,247,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{q.client_name}</span>
            <span style={{ fontSize: 12, color: '#8b91ab' }}>{num}</span>
            <span style={{ fontSize: 11, color: '#8b91ab' }}>·</span>
            <span style={{ fontSize: 12, color: '#8b91ab' }}>{docLabel}</span>
            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, background: q.client_type === 'domestic' ? 'rgba(79,98,247,0.15)' : 'rgba(245,158,11,0.15)', color: q.client_type === 'domestic' ? '#818cf8' : '#fbbf24' }}>
              {q.client_type === 'domestic' ? '🇹🇭 THB' : '🌍 USD'}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9', marginBottom: 3 }}>
            {Number(q.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span style={{ fontSize: 12, color: '#8b91ab', marginLeft: 5 }}>{q.currency}</span>
          </div>
          {isAdmin && (
            <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>
              by {q.created_by_name}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 2 }}>
            {q.created_at?.slice(0, 10)}
          </div>
          {q.director_reject_reason && (
            <div style={{ fontSize: 11, color: '#f87171', marginTop: 3 }}>
              반려 사유: {q.director_reject_reason}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
            {st.label}
          </span>
          {isAdmin && q.status === 'pending_director' && (
            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              <button onClick={handleApprove}
                style={{ padding: '4px 12px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Approve
              </button>
              <button onClick={handleReject}
                style={{ padding: '4px 12px', background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
