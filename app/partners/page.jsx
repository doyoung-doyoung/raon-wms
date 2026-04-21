'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

const CATEGORIES = [
  'IT / Software', 'Logistics', 'Marketing', 'Design', 'Legal',
  'Accounting', 'HR / Recruitment', 'Manufacturing', 'Consulting', 'Other',
]

const EMPTY = {
  name: '', category: '', type: 'domestic', currency: 'THB',
  contactPerson: '', email: '', tel: '', address: '', taxId: '',
  bankName: '', bankAccount: '', bankBeneficiary: '', bankBranch: '', swiftCode: '',
  notes: '',
}

const CATEGORY_COLORS = {
  'IT / Software': '#818cf8', 'Logistics': '#38bdf8', 'Marketing': '#f59e0b',
  'Design': '#a78bfa', 'Legal': '#64748b', 'Accounting': '#4ade80',
  'HR / Recruitment': '#fb923c', 'Manufacturing': '#94a3b8',
  'Consulting': '#22d3ee', 'Other': '#8b91ab',
}

const s = {
  page:    { color: '#f1f3f9' },
  title:   { fontSize: 24, fontWeight: 700, color: '#f1f3f9', margin: 0 },
  sub:     { fontSize: 13, color: '#8b91ab', marginTop: 4, marginBottom: 28 },
  card:    { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 12 },
  lbl:     { fontSize: 12, color: '#8b91ab', marginBottom: 5, display: 'block' },
  inp:     { width: '100%', padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  sel:     { width: '100%', padding: '9px 13px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:     { padding: '10px 22px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSm:   (bg, c) => ({ padding: '4px 12px', background: bg, color: c, border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }),
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  topRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge:   (c) => ({ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c}22`, color: c }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 600, maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  search:  { padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', width: 260, fontFamily: 'inherit' },
  error:   { padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171', marginBottom: 16 },
  secTitle: { fontSize: 11, fontWeight: 700, color: '#8b91ab', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, marginTop: 4 },
}

export default function PartnersPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [partners,   setPartners]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [filterCat,  setFilterCat]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/partners').then(r => r.json())
      setPartners(Array.isArray(data) ? data.filter(p => p.status !== 'deleted') : [])
    } catch { setPartners([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setForm(EMPTY); setError(''); setModal('new') }
  const openEdit = (p) => {
    setForm({
      name:            p.name             || '',
      category:        p.category         || '',
      type:            p.type             || 'domestic',
      currency:        p.currency         || 'THB',
      contactPerson:   p.contact_person   || '',
      email:           p.email            || '',
      tel:             p.tel              || '',
      address:         p.address          || '',
      taxId:           p.tax_id           || '',
      bankName:        p.bank_name        || '',
      bankAccount:     p.bank_account     || '',
      bankBeneficiary: p.bank_beneficiary || '',
      bankBranch:      p.bank_branch      || '',
      swiftCode:       p.swift_code       || '',
      notes:           p.notes            || '',
    })
    setError('')
    setModal(p)
  }

  const onTypeChange = (type) => {
    setForm(f => ({ ...f, type, currency: type === 'domestic' ? 'THB' : 'USD' }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Partner name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const isNew = modal === 'new'
      const url   = isNew ? '/api/partners' : `/api/partners/${modal.id}`
      const res   = await fetch(url, {
        method:  isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setModal(null)
      load()
    } catch { setError('Server error.') }
    finally { setSaving(false) }
  }

  const handleStatusToggle = async (p) => {
    const newStatus = p.status === 'inactive' ? 'active' : 'inactive'
    if (newStatus === 'inactive' && !confirm(`"${p.name}"을 비활성화할까요?`)) return
    try {
      await fetch(`/api/partners/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      load()
    } catch { /* ignore */ }
  }

  const filtered = partners.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.contact_person?.toLowerCase().includes(q)
    const matchCat    = !filterCat || p.category === filterCat
    return matchSearch && matchCat
  })

  const activeCount   = partners.filter(p => p.status !== 'inactive').length
  const inactiveCount = partners.filter(p => p.status === 'inactive').length

  const F = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={s.lbl}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.topRow}>
        <div>
          <h1 style={s.title}>🤝 파트너 관리</h1>
          <p style={s.sub}>협력업체 및 외주사 정보를 관리합니다</p>
        </div>
        {isAdmin && <button style={s.btn} onClick={openNew}>+ New Partner</button>}
      </div>

      {/* 검색 + 필터 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={s.search} placeholder="이름 / 이메일 / 담당자 검색..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...s.sel, width: 'auto', padding: '9px 13px' }}>
          <option value="">전체 업종</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ color: '#8b91ab', fontSize: 13 }}>
          활성 <span style={{ color: '#4ade80', fontWeight: 600 }}>{activeCount}</span>
          {inactiveCount > 0 && <span style={{ marginLeft: 8 }}>비활성 <span style={{ color: '#8b91ab' }}>{inactiveCount}</span></span>}
        </span>
      </div>

      {/* 파트너 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#8b91ab' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#8b91ab' }}>
          {search || filterCat ? '검색 결과가 없습니다.' : '등록된 파트너가 없습니다.'}
        </div>
      ) : (
        filtered.map(p => {
          const catColor  = CATEGORY_COLORS[p.category] || '#8b91ab'
          const isInactive = p.status === 'inactive'
          const isDomestic = p.type !== 'international'
          return (
            <div key={p.id} style={{ ...s.card, opacity: isInactive ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 이름 + 뱃지 */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9' }}>{p.name}</span>
                    {p.category && <span style={s.badge(catColor)}>{p.category}</span>}
                    <span style={s.badge(isDomestic ? '#4f62f7' : '#f59e0b')}>
                      {isDomestic ? '🇹🇭 Thailand' : '🌍 International'}
                    </span>
                    <span style={s.badge('#6b7280')}>{p.currency || 'THB'}</span>
                    {isInactive && <span style={s.badge('#64748b')}>비활성</span>}
                  </div>

                  {/* 기본 정보 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '4px 20px', marginBottom: p.bank_account ? 8 : 0 }}>
                    {p.contact_person && <div style={{ fontSize: 12, color: '#8b91ab' }}>👤 {p.contact_person}</div>}
                    {p.email          && <div style={{ fontSize: 12, color: '#8b91ab' }}>✉️ {p.email}</div>}
                    {p.tel            && <div style={{ fontSize: 12, color: '#8b91ab' }}>📞 {p.tel}</div>}
                    {p.address        && <div style={{ fontSize: 12, color: '#8b91ab' }}>📍 {p.address}</div>}
                    {p.tax_id         && <div style={{ fontSize: 12, color: '#8b91ab' }}>🪪 Tax ID: {p.tax_id}</div>}
                  </div>

                  {/* 은행 정보 */}
                  {(p.bank_account || p.bank_name) && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(79,98,247,0.06)', borderRadius: 8, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {p.bank_name    && <span style={{ fontSize: 12, color: '#8b91ab' }}>🏦 {p.bank_name}</span>}
                      {p.bank_account && <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>A/C: {p.bank_account}</span>}
                      {p.bank_branch  && <span style={{ fontSize: 12, color: '#8b91ab' }}>Branch: {p.bank_branch}</span>}
                      {p.swift_code   && <span style={{ fontSize: 12, color: '#8b91ab' }}>SWIFT: {p.swift_code}</span>}
                    </div>
                  )}

                  {p.notes && <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 6, fontStyle: 'italic' }}>💬 {p.notes}</div>}
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button style={s.btnSm('rgba(79,98,247,0.15)', '#818cf8')} onClick={() => openEdit(p)}>수정</button>
                    <button
                      style={s.btnSm(isInactive ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)', isInactive ? '#4ade80' : '#8b91ab')}
                      onClick={() => handleStatusToggle(p)}
                    >
                      {isInactive ? '활성화' : '비활성화'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}

      {/* 모달 */}
      {modal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modal}>
            {/* 헤더 */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f3f9' }}>
                {modal === 'new' ? '➕ New Partner' : `✏️ 수정: ${modal.name}`}
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8b91ab', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* 바디 (스크롤) */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
              {error && <div style={s.error}>{error}</div>}

              {/* 국내/해외 타입 */}
              <div style={{ marginBottom: 16 }}>
                <label style={s.lbl}>Partner Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { v: 'domestic',      label: '🇹🇭 Thailand (THB)', color: '#4f62f7' },
                    { v: 'international', label: '🌍 International',    color: '#f59e0b' },
                  ].map(o => (
                    <div key={o.v} onClick={() => onTypeChange(o.v)}
                      style={{ padding: '12px 16px', borderRadius: 10, border: `2px solid ${form.type === o.v ? o.color : 'rgba(255,255,255,0.08)'}`, background: form.type === o.v ? `${o.color}15` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.type === o.v ? o.color : '#8b91ab' }}>{o.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 기본 정보 ── */}
              <div style={s.secTitle}>기본 정보</div>

              <F label="회사명 / Partner Name *">
                <input style={s.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. XYZ Solutions Co., Ltd." />
              </F>

              <div style={{ ...s.grid2, marginBottom: 14 }}>
                <F label="업종 카테고리">
                  <select style={s.sel} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">선택 안함</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </F>
                <F label="통화 (Currency)">
                  <select style={s.sel} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="THB">THB — Thai Baht</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="SGD">SGD — Singapore Dollar</option>
                    <option value="KRW">KRW — Korean Won</option>
                  </select>
                </F>
              </div>

              <F label="주소">
                <input style={s.inp} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
              </F>

              <F label="Tax ID (เลขประจำตัวผู้เสียภาษี)">
                <input style={s.inp} value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} placeholder="0 1234 56789 01 2" />
              </F>

              <div style={{ ...s.grid2, marginBottom: 14 }}>
                <F label="담당자 (Contact Person)">
                  <input style={s.inp} value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Contact name" />
                </F>
                <F label="전화번호 (Tel)">
                  <input style={s.inp} value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="+66 2 xxx xxxx" />
                </F>
              </div>

              <F label="이메일 (Email)">
                <input style={s.inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@partner.com" />
              </F>

              {/* ── 은행 정보 ── */}
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={s.secTitle}>💳 은행 정보 (Bank Info)</div>

                <div style={{ ...s.grid2, marginBottom: 14 }}>
                  <F label="Bank Name">
                    <input style={s.inp} value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. KASIKORN BANK" />
                  </F>
                  <F label="Account Number">
                    <input style={s.inp} value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} placeholder="xxx-x-xxxxx-x" />
                  </F>
                </div>

                <div style={{ ...s.grid2, marginBottom: 14 }}>
                  <F label="Account Name (Beneficiary)">
                    <input style={s.inp} value={form.bankBeneficiary} onChange={e => setForm(f => ({ ...f, bankBeneficiary: e.target.value }))} placeholder="Account holder name" />
                  </F>
                  <F label="Branch">
                    <input style={s.inp} value={form.bankBranch} onChange={e => setForm(f => ({ ...f, bankBranch: e.target.value }))} placeholder="e.g. EMQUARTIER" />
                  </F>
                </div>

                {form.type === 'international' && (
                  <F label="SWIFT / BIC Code">
                    <input style={s.inp} value={form.swiftCode} onChange={e => setForm(f => ({ ...f, swiftCode: e.target.value }))} placeholder="e.g. KASITHBK" />
                  </F>
                )}
              </div>

              {/* ── 메모 ── */}
              <div style={{ marginTop: 4 }}>
                <F label="메모 (Notes)">
                  <textarea style={{ ...s.inp, height: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="내부 메모..." />
                </F>
              </div>
            </div>

            {/* 푸터 */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => setModal(null)} style={{ ...s.btn, background: 'rgba(255,255,255,0.06)', color: '#8b91ab' }}>취소</button>
              <button onClick={handleSave} disabled={saving} style={{ ...s.btn, opacity: saving ? 0.6 : 1 }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
