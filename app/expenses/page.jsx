'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'transport',     label: 'ค่าเดินทาง',      icon: '🚗', color: '#4f62f7' },
  { value: 'meal',          label: 'ค่าอาหาร',         icon: '🍽️', color: '#f59e0b' },
  { value: 'accommodation', label: 'ค่าที่พัก',         icon: '🏨', color: '#8b5cf6' },
  { value: 'supplies',      label: 'วัสดุสิ้นเปลือง',  icon: '📦', color: '#06b6d4' },
  { value: 'entertainment', label: 'ค่าบันเทิง',        icon: '🎉', color: '#ec4899' },
  { value: 'other',         label: 'อื่นๆ',             icon: '💼', color: '#6b7280' },
]
const CURRENCIES = ['THB', 'KRW', 'USD']

const ST = {
  pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: 'รอตรวจสอบ' },
  approved: { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', label: 'อนุมัติแล้ว' },
  rejected: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'ไม่อนุมัติ' },
}
const EMPTY_FORM = {
  title: '', category: 'transport', amount: '', currency: 'THB',
  expense_date: '', description: '', receipt_url: '',
}

const s = {
  page:     { color: '#f1f3f9' },
  title:    { fontSize: 24, fontWeight: 700, color: '#f1f3f9', margin: 0 },
  sub:      { fontSize: 13, color: '#8b91ab', marginTop: 4, marginBottom: 28 },
  tabs:     { display: 'flex', gap: 8, marginBottom: 24 },
  tab:      (a) => ({ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: a ? 600 : 400, background: a ? '#4f62f7' : 'rgba(255,255,255,0.06)', color: a ? '#fff' : '#8b91ab', transition: 'all 0.15s' }),
  card:     { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 12 },
  lbl:      { fontSize: 12, color: '#8b91ab', marginBottom: 6, display: 'block' },
  inp:      { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  sel:      { width: '100%', padding: '10px 14px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn:      { padding: '10px 24px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSm:    (bg, c, bc) => ({ padding: '4px 12px', background: bg, color: c, border: `1px solid ${bc}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }),
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  stats:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statCard: (c) => ({ background: '#141828', border: `1px solid ${c}30`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }),
}

export default function ExpensesPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [tab, setTab]           = useState('list')
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState('all')
  const [rejectModal, setRejectModal]   = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage]         = useState(1)
  const PAGE_SIZE = 5

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/expenses').then(r => r.json())
      setExpenses(Array.isArray(data) ? data : [])
    } catch { setExpenses([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.expense_date) {
      toast.error('กรุณากรอกชื่อรายการ จำนวนเงิน และวันที่จ่าย')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ยื่นคำขอไม่สำเร็จ')
      toast.success('ยื่นค่าใช้จ่ายเรียบร้อยแล้ว!')
      setForm(EMPTY_FORM)
      setTab('list')
      fetchExpenses()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      })
      if (!res.ok) throw new Error('อนุมัติไม่สำเร็จ')
      toast.success('อนุมัติแล้ว')
      fetchExpenses()
    } catch (err) { toast.error(err.message) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('กรุณากรอกเหตุผลที่ไม่อนุมัติ'); return }
    try {
      const res = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rejectModal.id, status: 'rejected', rejected_reason: rejectReason }),
      })
      if (!res.ok) throw new Error('ไม่อนุมัติไม่สำเร็จ')
      toast.success('ไม่อนุมัติเรียบร้อยแล้ว')
      setRejectModal(null); setRejectReason('')
      fetchExpenses()
    } catch (err) { toast.error(err.message) }
  }

  const getCat = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[5]

  const cutoff60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const myExpenses = isAdmin ? expenses : expenses.filter(e => e.employee_email === session?.user?.email)
  const pendingList = expenses.filter(e => e.status === 'pending')
  const filteredBase = (filterStatus === 'all' ? myExpenses : myExpenses.filter(e => e.status === filterStatus))
    .filter(e => isAdmin || (e.status === 'pending') || (e.submitted_at || '') >= cutoff60)
    .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''))
  const totalPages    = Math.max(1, Math.ceil(filteredBase.length / PAGE_SIZE))
  const displayedList = filteredBase.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0)

  const pendingCount = pendingList.length
  const TABS = [
    { id: 'list',  label: '📋 รายการของฉัน' },
    { id: 'apply', label: '✏️ ยื่นค่าใช้จ่าย' },
    ...(isAdmin ? [{ id: 'admin', label: `✅ จัดการการอนุมัติ${pendingCount > 0 ? ` (${pendingCount})` : ''}` }] : []),
  ]

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={s.title}>💰 ค่าใช้จ่าย</h1>
        <a href="/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>🏠 홈</a>
      </div>
      <p style={s.sub}>ยื่นค่าใช้จ่ายในการทำงานและตรวจสอบสถานะการอนุมัติ</p>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.statCard('#4f62f7')}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4f62f7' }}>{myExpenses.length} รายการ</div>
          <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{isAdmin ? 'ทั้งหมด' : 'การยื่นของฉัน'}</div>
        </div>
        <div style={s.statCard('#f59e0b')}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{pendingList.length} รายการ</div>
          <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>รอตรวจสอบ</div>
        </div>
        <div style={s.statCard('#4ade80')}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{expenses.filter(e => e.status === 'approved').length} รายการ</div>
          <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>อนุมัติแล้ว</div>
        </div>
        <div style={s.statCard('#4ade80')}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>{totalApproved.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>ยอดอนุมัติรวม (THB)</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── รายการของฉัน ── */}
      {tab === 'list' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['all','pending','approved','rejected'].map(f => (
              <button key={f} onClick={() => { setFilterStatus(f); setPage(1) }}
                style={{ ...s.tab(filterStatus === f), padding: '5px 14px', fontSize: 12 }}>
                {{ all:'ทั้งหมด', pending:'รอตรวจสอบ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ' }[f]}
              </button>
            ))}
          </div>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8b91ab' }}>กำลังโหลด...</div>}
          {!loading && displayedList.length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#8b91ab' }}>ไม่มีรายการ</div>
          )}
          {!loading && displayedList.map((exp, i) => <ExpenseCard key={exp.id || i} exp={exp} isAdmin={false} getCat={getCat} />)}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? '#555' : '#8b91ab', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                ก่อนหน้า
              </button>
              <span style={{ fontSize: 12, color: '#8b91ab' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === totalPages ? '#555' : '#8b91ab', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                ถัดไป
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── แบบฟอร์มยื่นค่าใช้จ่าย ── */}
      {tab === 'apply' && (
        <div style={s.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 20 }}>แบบฟอร์มค่าใช้จ่าย</div>

          {/* ประเภทรายจ่าย */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>ประเภทรายจ่าย</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.value} onClick={() => setForm({ ...form, category: cat.value })}
                  style={{ padding: '10px 8px', borderRadius: 8, border: `1px solid ${form.category === cat.value ? cat.color : 'rgba(255,255,255,0.1)'}`, background: form.category === cat.value ? `${cat.color}20` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 18 }}>{cat.icon}</div>
                  <div style={{ fontSize: 11, color: form.category === cat.value ? cat.color : '#8b91ab', marginTop: 4, fontWeight: form.category === cat.value ? 600 : 400 }}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ชื่อรายการ */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>ชื่อรายการ</label>
            <input style={s.inp} placeholder="เช่น: อาหารกลางวันลูกค้า" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          {/* จำนวนเงิน + สกุลเงิน */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>จำนวนเงิน</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" style={{ ...s.inp, flex: 1 }} placeholder="0" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} />
              <select style={{ ...s.sel, width: 100 }} value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* วันที่จ่าย */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>วันที่จ่าย</label>
            <input type="date" style={s.inp} value={form.expense_date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setForm({ ...form, expense_date: e.target.value })} />
          </div>

          {/* ลิงก์ใบเสร็จ */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>ลิงก์ใบเสร็จ (ไม่บังคับ) <span style={{ color: '#8b91ab' }}>(Google Drive)</span></label>
            <input style={s.inp} placeholder="https://drive.google.com/file/d/..."
              value={form.receipt_url}
              onChange={e => setForm({ ...form, receipt_url: e.target.value })} />
            <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 6 }}>
              💡 อัปโหลดใบเสร็จไปยัง Drive → คลิกขวา → คัดลอกลิงก์ → วางที่นี่
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.lbl}>รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
            <textarea style={{ ...s.inp, height: 72, resize: 'vertical' }}
              placeholder="กรุณาระบุวัตถุประสงค์หรือรายละเอียดการจ่าย"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ padding: 12, background: 'rgba(79,98,247,0.08)', borderRadius: 8, fontSize: 12, color: '#8b91ab', marginBottom: 16 }}>
            ℹ️ การแนบใบเสร็จจะช่วยให้อนุมัติได้รวดเร็วขึ้น
          </div>

          <button style={{ ...s.btn, width: '100%', opacity: submitting ? 0.6 : 1 }}
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'กำลังส่ง...' : 'ยื่นคำขอ'}
          </button>
        </div>
      )}

      {/* ── แท็บอนุมัติ (แอดมิน) ── */}
      {tab === 'admin' && isAdmin === true && (
        <AdminApprovalTab
          expenses={expenses}
          loading={loading}
          getCat={getCat}
          onApprove={handleApprove}
          onReject={(id) => { setRejectModal({ id }); setRejectReason('') }}
          onRefresh={fetchExpenses}
        />
      )}

      {/* โมดัลไม่อนุมัติ */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 400, maxWidth: '90vw' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f3f9', marginBottom: 16 }}>กรุณากรอกเหตุผล</div>
            <textarea style={{ ...s.inp, height: 96, resize: 'vertical', marginBottom: 16 }}
              placeholder="กรุณากรอกเหตุผลที่ไม่อนุมัติ"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectModal(null)}
                style={{ ...s.btn, background: 'rgba(255,255,255,0.06)', color: '#8b91ab' }}>ยกเลิก</button>
              <button onClick={handleReject}
                style={{ ...s.btn, background: '#ef4444' }}>ยืนยันไม่อนุมัติ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── คอมโพเนนต์แท็บอนุมัติ (แอดมิน) ──
function AdminApprovalTab({ expenses, loading, getCat, onApprove, onReject, onRefresh }) {
  const [filter, setFilter] = useState('pending')

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['pending','approved','rejected','all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                fontWeight: filter === f ? 600 : 400,
                background: filter === f ? '#4f62f7' : 'rgba(255,255,255,0.06)',
                color: filter === f ? '#fff' : '#8b91ab' }}>
              {{ pending:'รอตรวจสอบ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ', all:'ทั้งหมด' }[f]}
              {f === 'pending' && expenses.filter(e => e.status === 'pending').length > 0 &&
                <span style={{ marginLeft: 4, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>
                  {expenses.filter(e => e.status === 'pending').length}
                </span>
              }
            </button>
          ))}
        </div>
        <button onClick={onRefresh}
          style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8b91ab', fontSize: 12, cursor: 'pointer' }}>
          รีเฟรช
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8b91ab' }}>กำลังโหลด...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 40, textAlign: 'center', color: '#8b91ab' }}>
          {filter === 'pending' ? 'ไม่มีรายการรอตรวจสอบ ✓' : 'ไม่มีรายการ'}
        </div>
      )}
      {!loading && filtered.map((exp, i) => (
        <ExpenseCard key={exp.id || i} exp={exp} isAdmin getCat={getCat}
          onApprove={() => onApprove(exp.id)}
          onReject={() => onReject(exp.id)} />
      ))}
    </div>
  )
}

// ── คอมโพเนนต์การ์ดค่าใช้จ่าย ──
function ExpenseCard({ exp, isAdmin, getCat, onApprove, onReject }) {
  const cat = getCat(exp.category)
  const st  = ST[exp.status] || ST.pending

  return (
    <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {cat.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{exp.title}</span>
              <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.label}</span>
              {isAdmin && <span style={{ fontSize: 11, color: '#8b91ab' }}>· {exp.employee_name}</span>}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f3f9', marginBottom: 3 }}>
              {Number(exp.amount).toLocaleString()} <span style={{ fontSize: 12, color: '#8b91ab' }}>{exp.currency}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8b91ab' }}>
              วันที่จ่าย {exp.expense_date} · วันที่ยื่น {exp.submitted_at}
            </div>
            {exp.description && (
              <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 3 }}>{exp.description}</div>
            )}
            {/* ลิงก์ใบเสร็จ */}
            {exp.receipt_url && (
              exp.receipt_url.startsWith('http') ? (
                <a href={exp.receipt_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#818cf8', marginTop: 5, textDecoration: 'none' }}>
                  📎 ดูใบเสร็จ
                </a>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8b91ab', marginTop: 5 }}>
                  📎 {exp.receipt_url}
                </span>
              )
            )}
            {exp.status === 'rejected' && exp.rejected_reason && (
              <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>เหตุผลที่ไม่อนุมัติ: {exp.rejected_reason}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0, marginLeft: 12 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
            {st.label}
          </span>
          {isAdmin && exp.status === 'pending' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onApprove}
                style={{ padding: '5px 14px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                อนุมัติ
              </button>
              <button onClick={onReject}
                style={{ padding: '5px 14px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                ไม่อนุมัติ
              </button>
            </div>
          )}
          {exp.approved_by && (
            <div style={{ fontSize: 11, color: '#8b91ab', textAlign: 'right' }}>
              ผู้อนุมัติ: {exp.approved_by}<br />{exp.approved_at}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
