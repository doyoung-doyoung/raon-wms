'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const EMPTY_ITEM = { name: '', qty: 1, unitPrice: 0, total: 0, details: ['', '', ''] }

function calcTotals(items, mgmtRate, clientType) {
  const itemsSum   = items.reduce((s, it) => s + (Number(it.total) || 0), 0)
  const mgmtAmt    = itemsSum * (Number(mgmtRate) || 0) / 100
  const subtotal   = itemsSum + mgmtAmt
  const vatAmount  = clientType === 'domestic' ? subtotal * 0.07 : 0
  const whtAmount  = clientType === 'domestic' ? subtotal * 0.03 : 0
  const grandTotal = clientType === 'domestic' ? subtotal + vatAmount - whtAmount : subtotal
  return { itemsSum, mgmtAmt, subtotal, vatAmount, whtAmount, grandTotal }
}

const s = {
  page:   { color: '#f1f3f9', maxWidth: 860, margin: '0 auto' },
  title:  { fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: '0 0 4px' },
  sub:    { fontSize: 13, color: '#8b91ab', marginBottom: 28 },
  sec:    { background: '#141828', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 22, marginBottom: 16 },
  secH:   { fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  lbl:    { fontSize: 12, color: '#8b91ab', marginBottom: 5, display: 'block' },
  inp:    { width: '100%', padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  sel:    { width: '100%', padding: '9px 13px', background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn:    { padding: '10px 22px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSm:  (bg, c) => ({ padding: '5px 12px', background: bg, color: c, border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }),
  grid2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  numInp: { padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f3f9', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
  totRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  totGT:  { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.3)', marginTop: 4 },
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [clients,     setClients]     = useState([])
  const [clientType,  setClientType]  = useState('domestic')
  const [currency,    setCurrency]    = useState('THB')
  const [selClient,   setSelClient]   = useState('')
  const [manualClient,setManualClient]= useState(false)
  const [client,      setClient]      = useState({ name: '', address: '', taxId: '', email: '', tel: '' })
  const [items,       setItems]       = useState([{ ...EMPTY_ITEM }])
  const [mgmtRate,    setMgmtRate]    = useState(0)
  const [payDays,     setPayDays]     = useState(3)
  const [remark,      setRemark]      = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const onTypeChange = (type) => {
    setClientType(type)
    setCurrency(type === 'domestic' ? 'THB' : 'USD')
    setSelClient('')
    setClient({ name: '', address: '', taxId: '', email: '', tel: '' })
    setManualClient(false)
  }

  const onClientSelect = (id) => {
    setSelClient(id)
    if (!id) { setClient({ name: '', address: '', taxId: '', email: '', tel: '' }); return }
    const c = clients.find(c => c.id === id)
    if (c) {
      setClient({ name: c.name, address: c.address, taxId: c.tax_id, email: c.email, tel: c.tel })
      if (c.currency) setCurrency(c.currency)
    }
  }

  // Items
  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [field]: val }
      if (field === 'qty' || field === 'unitPrice') {
        updated.total = (Number(field === 'qty' ? val : it.qty) || 0) * (Number(field === 'unitPrice' ? val : it.unitPrice) || 0)
      }
      return updated
    }))
  }

  const updateDetail = (itemIdx, detailIdx, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== itemIdx) return it
      const details = [...it.details]
      details[detailIdx] = val
      return { ...it, details }
    }))
  }

  const addDetailRow = (itemIdx) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== itemIdx) return it
      return { ...it, details: [...it.details, ''] }
    }))
  }

  const removeDetail = (itemIdx, detailIdx) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== itemIdx) return it
      return { ...it, details: it.details.filter((_, di) => di !== detailIdx) }
    }))
  }

  const addItem  = () => setItems(prev => [...prev, { ...EMPTY_ITEM, details: ['', '', ''] }])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const tot = calcTotals(items, mgmtRate, clientType)

  const handleSave = async () => {
    if (!client.name.trim()) { toast.error('Client name is required.'); return }
    if (items.every(it => !it.name.trim())) { toast.error('At least one item is required.'); return }

    setSaving(true)
    try {
      const payload = {
        clientType,
        currency,
        clientId:      selClient || '',
        clientName:    client.name,
        clientAddress: client.address,
        clientTaxId:   client.taxId,
        clientEmail:   client.email,
        clientTel:     client.tel,
        items: items.filter(it => it.name.trim()).map(it => ({
          ...it,
          details: it.details.filter(d => d.trim()),
          total: Number(it.total) || 0,
        })),
        managementFeeRate:   Number(mgmtRate) || 0,
        managementFeeAmount: tot.mgmtAmt,
        subtotal:   tot.subtotal,
        vatAmount:  tot.vatAmount,
        whtAmount:  tot.whtAmount,
        grandTotal: tot.grandTotal,
        paymentDays: Number(payDays) || 3,
        remark,
      }

      const res  = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create quotation')
      toast.success(`Quotation ${data.quotation?.number} created!`)
      router.push(`/quotations/${data.quotation?.id}`)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const filteredClients = clients.filter(c => c.type === clientType)

  return (
    <div style={s.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={s.title}>📝 New Quotation</h1>
        <p style={s.sub}>새 견적서를 작성합니다</p>
      </div>

      {/* ── STEP 1: Document Type ── */}
      <div style={s.sec}>
        <div style={s.secH}>1️⃣ Document Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { v: 'domestic',      label: '🇹🇭 Thailand',      sub: 'THB · VAT 7% + WHT 3%', color: '#4f62f7' },
            { v: 'international', label: '🌍 International', sub: 'USD · No VAT / No WHT',  color: '#f59e0b' },
          ].map(o => (
            <div key={o.v} onClick={() => onTypeChange(o.v)}
              style={{ padding: '16px 20px', borderRadius: 10, border: `2px solid ${clientType === o.v ? o.color : 'rgba(255,255,255,0.08)'}`, background: clientType === o.v ? `${o.color}15` : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: clientType === o.v ? o.color : '#f1f3f9', marginBottom: 4 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: '#8b91ab' }}>{o.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 2: Client ── */}
      <div style={s.sec}>
        <div style={s.secH}>2️⃣ Client Information</div>

        {/* Select from DB */}
        <div style={{ marginBottom: 14 }}>
          <label style={s.lbl}>Select Client from Database</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={{ ...s.sel, flex: 1 }} value={selClient} onChange={e => { onClientSelect(e.target.value); setManualClient(false) }}>
              <option value="">— Select a client —</option>
              {filteredClients.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ''}</option>
              ))}
            </select>
            <button style={s.btnSm('rgba(255,255,255,0.06)', '#8b91ab')}
              onClick={() => { setSelClient(''); setClient({ name: '', address: '', taxId: '', email: '', tel: '' }); setManualClient(true) }}>
              + Enter Manually
            </button>
          </div>
          {filteredClients.length === 0 && (
            <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 6 }}>
              No {clientType === 'domestic' ? 'Thailand' : 'international'} clients in database.
              <a href="/clients" target="_blank" style={{ color: '#818cf8', marginLeft: 4 }}>Add one →</a>
            </div>
          )}
        </div>

        {/* Client fields */}
        {(selClient || manualClient) && (
          <div style={s.grid2}>
            <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
              <label style={s.lbl}>Company Name *</label>
              <input style={s.inp} value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))} placeholder="Client company name" readOnly={!!selClient && !manualClient} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
              <label style={s.lbl}>Address</label>
              <input style={s.inp} value={client.address} onChange={e => setClient(c => ({ ...c, address: e.target.value }))} placeholder="Client address" readOnly={!!selClient && !manualClient} />
            </div>
            {clientType === 'domestic' && (
              <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
                <label style={s.lbl}>Tax ID</label>
                <input style={s.inp} value={client.taxId} onChange={e => setClient(c => ({ ...c, taxId: e.target.value }))} placeholder="0 1234 56789 01 2" readOnly={!!selClient && !manualClient} />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={s.lbl}>Email</label>
              <input style={s.inp} value={client.email} onChange={e => setClient(c => ({ ...c, email: e.target.value }))} placeholder="contact@client.com" readOnly={!!selClient && !manualClient} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.lbl}>Phone / Tel</label>
              <input style={s.inp} value={client.tel} onChange={e => setClient(c => ({ ...c, tel: e.target.value }))} placeholder="+66 2 xxx xxxx" readOnly={!!selClient && !manualClient} />
            </div>
            <div style={{ marginBottom: 0 }}>
              <label style={s.lbl}>Currency</label>
              <select style={s.sel} value={currency} onChange={e => setCurrency(e.target.value)}>
                {clientType === 'domestic'
                  ? <option value="THB">THB — Thai Baht</option>
                  : <>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="SGD">SGD — Singapore Dollar</option>
                    </>
                }
              </select>
            </div>
          </div>
        )}
        {!selClient && !manualClient && (
          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 13, color: '#8b91ab', textAlign: 'center' }}>
            Select a client from the list or enter manually
          </div>
        )}
      </div>

      {/* ── STEP 3: Items ── */}
      <div style={s.sec}>
        <div style={{ ...s.secH, justifyContent: 'space-between' }}>
          <span>3️⃣ Service Items</span>
          <button style={s.btnSm('#4f62f7', '#fff')} onClick={addItem}>+ Add Item</button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9' }}>Item {idx + 1}</span>
              {items.length > 1 && (
                <button style={s.btnSm('rgba(248,113,113,0.12)', '#f87171')} onClick={() => removeItem(idx)}>Remove</button>
              )}
            </div>

            {/* Item name */}
            <div style={{ marginBottom: 10 }}>
              <label style={s.lbl}>Service / Product Name</label>
              <input style={s.inp} value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="e.g. IT Consulting Service" />
            </div>

            {/* Qty, Unit Price, Total */}
            <div style={s.grid3}>
              <div>
                <label style={s.lbl}>Quantity (Unit)</label>
                <input type="number" min="0" style={s.numInp} value={item.qty}
                  onChange={e => updateItem(idx, 'qty', e.target.value)} />
              </div>
              <div>
                <label style={s.lbl}>Unit Price ({currency})</label>
                <input type="number" min="0" style={s.numInp} value={item.unitPrice}
                  onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
              </div>
              <div>
                <label style={s.lbl}>Total ({currency})</label>
                <div style={{ padding: '9px 13px', background: 'rgba(79,98,247,0.08)', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 8, color: '#a5b4fc', fontSize: 13, fontWeight: 600 }}>
                  {Number(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ marginTop: 12 }}>
              <label style={{ ...s.lbl, marginBottom: 8 }}>
                Detail Lines
                <span style={{ color: '#555', marginLeft: 6 }}>(optional — shown as bullet points)</span>
              </label>
              {item.details.map((d, di) => (
                <div key={di} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: '#8b91ab', paddingTop: 9, fontSize: 13 }}>–</span>
                  <input style={{ ...s.inp, flex: 1 }} value={d} onChange={e => updateDetail(idx, di, e.target.value)}
                    placeholder={`Detail ${di + 1}`} />
                  <button style={{ ...s.btnSm('transparent', '#8b91ab'), padding: '4px 8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => removeDetail(idx, di)}>×</button>
                </div>
              ))}
              {item.details.length < 12 && (
                <button style={s.btnSm('rgba(255,255,255,0.05)', '#8b91ab')} onClick={() => addDetailRow(idx)}>
                  + Add Detail Line
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── STEP 4: Fee & Terms ── */}
      <div style={s.sec}>
        <div style={s.secH}>4️⃣ Fee & Terms</div>
        <div style={s.grid3}>
          <div>
            <label style={s.lbl}>Management Fee (%)</label>
            <input type="number" min="0" max="100" style={s.numInp} value={mgmtRate}
              onChange={e => setMgmtRate(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={s.lbl}>Payment Due (days)</label>
            <input type="number" min="1" style={s.numInp} value={payDays}
              onChange={e => setPayDays(e.target.value)} />
          </div>
          <div />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={s.lbl}>Remark</label>
          <textarea style={{ ...s.inp, height: 64, resize: 'vertical' }} value={remark}
            onChange={e => setRemark(e.target.value)} placeholder="Optional remark for this quotation..." />
        </div>
      </div>

      {/* ── STEP 5: Summary ── */}
      <div style={s.sec}>
        <div style={s.secH}>5️⃣ Summary</div>
        <div style={{ maxWidth: 360 }}>
          <div style={s.totRow}>
            <span style={{ color: '#8b91ab', fontSize: 13 }}>Items Subtotal</span>
            <span style={{ color: '#f1f3f9', fontSize: 13 }}>
              {tot.itemsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          {Number(mgmtRate) > 0 && (
            <div style={s.totRow}>
              <span style={{ color: '#8b91ab', fontSize: 13 }}>Management Fee ({mgmtRate}%)</span>
              <span style={{ color: '#f1f3f9', fontSize: 13 }}>
                {tot.mgmtAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          )}
          <div style={s.totRow}>
            <span style={{ color: '#f1f3f9', fontSize: 13, fontWeight: 600 }}>Total Amount (A)</span>
            <span style={{ color: '#f1f3f9', fontSize: 13, fontWeight: 600 }}>
              {tot.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          {clientType === 'domestic' && (
            <>
              <div style={s.totRow}>
                <span style={{ color: '#8b91ab', fontSize: 13 }}>VAT 7% (B)</span>
                <span style={{ color: '#8b91ab', fontSize: 13 }}>
                  {tot.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
              <div style={s.totRow}>
                <span style={{ color: '#8b91ab', fontSize: 13 }}>WHT 3% (C)</span>
                <span style={{ color: '#f87171', fontSize: 13 }}>
                  − {tot.whtAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
              <div style={s.totGT}>
                <span style={{ color: '#f1f3f9', fontSize: 15, fontWeight: 700 }}>Grand Total (A+B−C)</span>
                <span style={{ color: '#4ade80', fontSize: 15, fontWeight: 700 }}>
                  {tot.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                </span>
              </div>
            </>
          )}
          {clientType === 'international' && (
            <div style={s.totGT}>
              <span style={{ color: '#f1f3f9', fontSize: 15, fontWeight: 700 }}>Grand Total</span>
              <span style={{ color: '#4ade80', fontSize: 15, fontWeight: 700 }}>
                {tot.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 40 }}>
        <button style={{ ...s.btn, background: 'rgba(255,255,255,0.06)', color: '#8b91ab' }}
          onClick={() => router.push('/quotations')}>
          Cancel
        </button>
        <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Creating...' : '💾 Save as Draft'}
        </button>
      </div>
    </div>
  )
}
