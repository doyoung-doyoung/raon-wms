'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const EMPTY = {
  name: '', address: '', taxId: '', email: '', tel: '',
  type: 'domestic', currency: 'THB', contactPerson: '', notes: '',
}

const s = {
  page:     { color: '#f1f3f9' },
  title:    { fontSize: 24, fontWeight: 700, color: '#f1f3f9', margin: 0 },
  sub:      { fontSize: 13, color: '#8b91ab', marginTop: 4, marginBottom: 28 },
  card:     { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 12 },
  lbl:      { fontSize: 12, color: '#8b91ab', marginBottom: 5, display: 'block' },
  inp:      { width: '100%', padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  sel:      { width: '100%', padding: '9px 13px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn:      { padding: '10px 22px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSm:    (bg, c) => ({ padding: '4px 12px', background: bg, color: c, border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }),
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  topRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge:    (c) => ({ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c}22`, color: c }),
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:    { background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: 560, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' },
  search:   { padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', width: 260 },
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)  // null | 'new' | client object
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetch('/api/clients').then(r => r.json())
      setClients(Array.isArray(data) ? data : [])
    } catch { setClients([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const openNew = () => { setForm(EMPTY); setModal('new') }
  const openEdit = (c) => {
    setForm({
      name: c.name || '', address: c.address || '', taxId: c.tax_id || '',
      email: c.email || '', tel: c.tel || '', type: c.type || 'domestic',
      currency: c.currency || 'THB', contactPerson: c.contact_person || '', notes: c.notes || '',
    })
    setModal(c)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Client name is required.'); return }
    setSaving(true)
    try {
      const isNew = modal === 'new'
      const url   = isNew ? '/api/clients' : `/api/clients/${modal.id}`
      const res   = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(isNew ? 'Client added!' : 'Client updated!')
      setModal(null)
      fetch_()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const onTypeChange = (type) => {
    setForm(f => ({ ...f, type, currency: type === 'domestic' ? 'THB' : 'USD' }))
  }

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={s.page}>
      <div style={s.topRow}>
        <div>
          <h1 style={s.title}>👥 Client Management</h1>
          <p style={s.sub}>견적서·인보이스에 사용할 고객 정보를 관리합니다</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>🏠 홈</a>
          <button style={s.btn} onClick={openNew}>+ New Client</button>
        </div>
      </div>

      {/* Search + Stats */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input style={s.search} placeholder="Search by name or email..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <span style={{ color: '#8b91ab', fontSize: 13 }}>
          Total: {clients.length} |
          <span style={{ color: '#4f62f7', marginLeft: 6 }}>
            TH {clients.filter(c => c.type === 'domestic').length}
          </span>
          <span style={{ color: '#f59e0b', marginLeft: 6 }}>
            Intl {clients.filter(c => c.type === 'international').length}
          </span>
        </span>
      </div>

      {/* List */}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8b91ab' }}>Loading...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ ...s.card, textAlign: 'center', padding: 40, color: '#8b91ab' }}>
          {search ? 'No clients match your search.' : 'No clients yet. Add one to get started.'}
        </div>
      )}
      {!loading && filtered.map(c => (
        <div key={c.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9' }}>{c.name}</span>
                <span style={s.badge(c.type === 'domestic' ? '#4f62f7' : '#f59e0b')}>
                  {c.type === 'domestic' ? '🇹🇭 Thailand' : '🌍 International'}
                </span>
                <span style={s.badge('#6b7280')}>{c.currency}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '3px 20px' }}>
                {c.address && <div style={{ fontSize: 12, color: '#8b91ab' }}>📍 {c.address}</div>}
                {c.email   && <div style={{ fontSize: 12, color: '#8b91ab' }}>✉️ {c.email}</div>}
                {c.tel     && <div style={{ fontSize: 12, color: '#8b91ab' }}>📞 {c.tel}</div>}
                {c.tax_id  && <div style={{ fontSize: 12, color: '#8b91ab' }}>🪪 Tax ID: {c.tax_id}</div>}
                {c.contact_person && <div style={{ fontSize: 12, color: '#8b91ab' }}>👤 {c.contact_person}</div>}
              </div>
            </div>
            <button style={s.btnSm('rgba(79,98,247,0.15)', '#818cf8')} onClick={() => openEdit(c)}>Edit</button>
          </div>
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modal}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f3f9', marginBottom: 20 }}>
              {modal === 'new' ? '➕ New Client' : `✏️ Edit: ${modal.name}`}
            </div>

            {/* Type selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={s.lbl}>Client Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { v: 'domestic',      label: '🇹🇭 Thailand (THB)', color: '#4f62f7' },
                  { v: 'international', label: '🌍 International (USD)', color: '#f59e0b' },
                ].map(o => (
                  <div key={o.v} onClick={() => onTypeChange(o.v)}
                    style={{ padding: '12px 16px', borderRadius: 10, border: `2px solid ${form.type === o.v ? o.color : 'rgba(255,255,255,0.08)'}`, background: form.type === o.v ? `${o.color}15` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.type === o.v ? o.color : '#8b91ab' }}>{o.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.grid2}>
              <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                <label style={s.lbl}>Company Name *</label>
                <input style={s.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. ABC Company Ltd." />
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                <label style={s.lbl}>Address</label>
                <input style={s.inp} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
              </div>
              {form.type === 'domestic' && (
                <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                  <label style={s.lbl}>Tax ID (เลขประจำตัวผู้เสียภาษี)</label>
                  <input style={s.inp} value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} placeholder="0 1234 56789 01 2" />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={s.lbl}>Email</label>
                <input style={s.inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@company.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.lbl}>Phone / Tel</label>
                <input style={s.inp} value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="+66 2 xxx xxxx" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.lbl}>Contact Person</label>
                <input style={s.inp} value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Name of contact" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.lbl}>Currency</label>
                <select style={s.sel} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="THB">THB — Thai Baht</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                  <option value="KRW">KRW — Korean Won</option>
                </select>
              </div>
              <div style={{ marginBottom: 14, gridColumn: '1 / -1' }}>
                <label style={s.lbl}>Notes (optional)</label>
                <textarea style={{ ...s.inp, height: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setModal(null)} style={{ ...s.btn, background: 'rgba(255,255,255,0.06)', color: '#8b91ab' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ ...s.btn, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
