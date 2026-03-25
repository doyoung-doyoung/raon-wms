'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useLang } from '../../lib/i18n/useLang'

// 임시 샘플 데이터 (추후 Google Sheets API 연동)
const SAMPLE_ANNOUNCEMENTS = [
  {
    id: '1',
    title: '2025년 태국 공휴일 안내',
    content: '2025년 태국 정부 공휴일 일정을 안내드립니다. 달력을 통해 확인하실 수 있습니다.',
    author: '이사',
    authorImage: null,
    createdAt: '2025-01-02',
    pinned: true,
  },
  {
    id: '2',
    title: 'Office Hours 변경 안내',
    content: '2월부터 사무실 운영 시간이 09:00 ~ 18:00으로 변경됩니다.',
    author: '이사',
    authorImage: null,
    createdAt: '2025-01-15',
    pinned: false,
  },
]

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const { t } = useLang()
  const isAdmin = session?.isAdmin

  const [announcements, setAnnouncements] = useState(SAMPLE_ANNOUNCEMENTS)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null) // 선택된 공지 (상세 보기)
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    // TODO: POST /api/announcements
    const newItem = {
      id: Date.now().toString(),
      title: form.title,
      content: form.content,
      author: session?.user?.name || '이사',
      authorImage: session?.user?.image,
      createdAt: new Date().toISOString().slice(0, 10),
      pinned: false,
    }
    setAnnouncements(prev => [newItem, ...prev])
    setForm({ title: '', content: '' })
    setShowForm(false)
    setSaving(false)
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>
            📢 {t('announcements.title')}
          </h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>{announcements.length}개의 공지사항</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setSelected(null) }}
            style={{
              padding: '9px 20px', background: '#4f62f7', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            + {t('announcements.new')}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 20 }}>

        {/* 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.length === 0 ? (
            <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#8b91ab', fontSize: 14 }}>
              {t('announcements.noAnnouncements')}
            </div>
          ) : sorted.map(item => (
            <div
              key={item.id}
              onClick={() => setSelected(selected?.id === item.id ? null : item)}
              style={{
                background: selected?.id === item.id ? 'rgba(79,98,247,0.08)' : '#141828',
                border: selected?.id === item.id ? '1px solid rgba(79,98,247,0.35)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '16px 20px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {item.pinned && (
                      <span style={{ fontSize: 10, background: 'rgba(79,98,247,0.2)', color: '#818cf8', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>📌 고정</span>
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
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 상세 보기 */}
        {selected && (
          <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 28px', position: 'sticky', top: 20, height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selected.pinned && (
                  <span style={{ fontSize: 10, background: 'rgba(79,98,247,0.2)', color: '#818cf8', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>📌 고정</span>
                )}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>×</button>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', margin: '0 0 12px' }}>{selected.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {selected.authorImage
                ? <img src={selected.authorImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(79,98,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#818cf8' }}>👑</div>
              }
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9' }}>{selected.author}</div>
                <div style={{ fontSize: 12, color: '#8b91ab' }}>{selected.createdAt}</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#c4c7d6', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
              {selected.content}
            </p>
            {isAdmin && (
              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <button style={{ padding: '6px 14px', background: 'rgba(79,98,247,0.15)', color: '#818cf8', border: '1px solid rgba(79,98,247,0.25)', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ 수정
                </button>
                <button style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🗑 삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 공지 작성 모달 (이사 전용) */}
      {showForm && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 540, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>📢 {t('announcements.new')}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20, fontFamily: 'inherit' }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b91ab', marginBottom: 6, fontWeight: 500 }}>{t('announcements.form.title')}</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={t('announcements.form.titlePlaceholder')}
                style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f1f3f9', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#8b91ab', marginBottom: 6, fontWeight: 500 }}>{t('announcements.form.content')}</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder={t('announcements.form.contentPlaceholder')}
                rows={6}
                style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f1f3f9', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('common.cancel')}
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.title || !form.content} style={{ padding: '9px 20px', background: !form.title || !form.content ? 'rgba(79,98,247,0.4)' : '#4f62f7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: !form.title || !form.content ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '저장 중...' : t('announcements.form.publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
