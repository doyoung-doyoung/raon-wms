'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.isAdmin

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', pinned: false })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSaveMsg(`ลงทะเบียนเรียบร้อย! ส่งอีเมลไปยังพนักงาน ${data.emailsSent} คน`)
        setForm({ title: '', content: '', pinned: false })
        setShowForm(false)
        await fetchAnnouncements()
      } else {
        alert(data.error || 'บันทึกล้มเหลว')
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned === 'true' ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })

  const s = {
    page: { color: '#f1f3f9' },
    card: {
      background: '#141828',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '16px 20px',
      cursor: 'pointer', transition: 'all 0.15s', marginBottom: 12,
    },
    activeCard: {
      background: 'rgba(79,98,247,0.08)',
      border: '1px solid rgba(79,98,247,0.35)',
      borderRadius: 14, padding: '16px 20px',
      cursor: 'pointer', marginBottom: 12,
    },
    label: { display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 6, fontWeight: 500 },
    input: { width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f1f3f9', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  }

  return (
    <div style={s.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>ประกาศ</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>{announcements.length} รายการ</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>🏠 หน้าหลัก</a>
          {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setSelected(null) }}
            style={{ padding: '9px 20px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + เขียนประกาศ
          </button>
        )}
        </div>
      </div>

      {saveMsg && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#4ade80' }}>
          {saveMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b91ab' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          กำลังโหลด...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 20 }}>

          {/* 목록 */}
          <div>
            {sorted.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px', color: '#8b91ab', fontSize: 14 }}>
                ไม่มีประกาศ
              </div>
            ) : sorted.map(item => (
              <div
                key={item.id}
                onClick={async () => {
                  if (selected?.id === item.id) {
                    setSelected(null)
                  } else {
                    // 최신 confirmed_by 데이터를 위해 목록 새로고침
                    const res = await fetch('/api/announcements')
                    const data = await res.json()
                    if (Array.isArray(data)) {
                      setAnnouncements(data)
                      const fresh = data.find(a => a.id === item.id)
                      setSelected(fresh || item)
                    } else {
                      setSelected(item)
                    }
                  }
                }}
                style={selected?.id === item.id ? s.activeCard : s.card}
                onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {item.pinned === 'true' && (
                        <span style={{ fontSize: 10, background: 'rgba(79,98,247,0.2)', color: '#818cf8', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>ปักหมุด</span>
                      )}
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#8b91ab', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.content}
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: '#8b91ab', flexShrink: 0, textAlign: 'right' }}>
                    <div>{item.author}</div>
                    <div style={{ marginTop: 2 }}>{item.createdAt}</div>
                    {isAdmin && (() => { const cnt = JSON.parse(item.confirmed_by || '[]').length; return cnt > 0 ? <div style={{ marginTop: 3, color: '#4ade80', fontWeight: 600 }}>✓ {cnt} คน ยืนยัน</div> : null })()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 상세 보기 */}
          {selected && (
            <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 28px', position: 'sticky', top: 20, height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 18 }}>x</button>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', margin: '0 0 12px' }}>{selected.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(79,98,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#818cf8' }}>
                  {selected.authorImage
                    ? <img src={selected.authorImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    : 'D'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9' }}>{selected.author}</div>
                  <div style={{ fontSize: 12, color: '#8b91ab' }}>{selected.createdAt}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#c4c7d6', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: '0 0 20px' }}>
                {selected.content}
              </p>
              {isAdmin && (() => {
                const confirmed = JSON.parse(selected.confirmed_by || '[]')
                return (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#8b91ab', marginBottom: 8 }}>✓ พนักงานที่ยืนยัน ({confirmed.length} คน)</div>
                    {confirmed.length === 0
                      ? <div style={{ fontSize: 12, color: '#555' }}>ยังไม่มีพนักงานยืนยัน</div>
                      : confirmed.map((c, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#8b91ab', marginBottom: 3 }}>
                          {c.name || c.email} — {c.confirmedAt?.slice(0, 16).replace('T', ' ')}
                        </div>
                      ))
                    }
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* 공지 작성 모달 */}
      {showForm && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>เขียนประกาศ</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20 }}>x</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>หัวข้อ *</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="กรุณากรอกหัวข้อประกาศ"
                style={s.input}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>เนื้อหา *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="กรุณากรอกเนื้อหาประกาศ"
                rows={7}
                style={{ ...s.input, resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>

            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="pinned"
                checked={form.pinned}
                onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="pinned" style={{ fontSize: 13, color: '#c4c7d6', cursor: 'pointer' }}>ปักหมุดด้านบน</label>
            </div>

            <div style={{ background: 'rgba(79,98,247,0.08)', border: '1px solid rgba(79,98,247,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#818cf8' }}>
              เมื่อลงทะเบียน จะส่ง PDF ประกาศไปยังพนักงานทุกคนทันที
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.title || !form.content}
                style={{ padding: '9px 24px', background: !form.title || !form.content ? 'rgba(79,98,247,0.4)' : '#4f62f7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: !form.title || !form.content ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {saving ? 'กำลังส่ง...' : 'ลงทะเบียนและส่ง'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
