'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useLang } from '../../lib/i18n/useLang'

// 샘플 데이터 (추후 Google Sheets API 연동)
const SAMPLE_WARNINGS = [
  {
    id: 'w1',
    employeeId: 'emp001',
    employeeName: 'สมชาย ใจดี',
    employeeEmail: 'somchai@raon.co.th',
    position: 'Designer',
    warningNumber: 1,
    reason1: 'ขาดงานโดยไม่แจ้งล่วงหน้า 3 วัน (วันที่ 5-7 มกราคม 2568)',
    reason2: '',
    reason3: '',
    issuedAt: '2025-01-10',
    directorName: 'น.ส. โดยอง จอง',
    status: 'issued', // issued | acknowledged
    acknowledgedAt: null,
  },
]

// 직원별 경고 횟수 집계
function countWarnings(warnings, employeeId) {
  return warnings.filter(w => w.employeeId === employeeId).length
}

export default function WarningsPage() {
  const { data: session } = useSession()
  const { t } = useLang()
  const isAdmin = session?.isAdmin

  const [warnings, setWarnings] = useState(SAMPLE_WARNINGS)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    position: '',
    startDate: '',
    address: '',
    reason1: '',
    reason2: '',
    reason3: '',
  })
  const [saving, setSaving] = useState(false)

  // 직원은 자기 경고만 볼 수 있음
  const visibleWarnings = isAdmin
    ? warnings
    : warnings.filter(w => w.employeeEmail === session?.user?.email)

  const handleSubmit = async () => {
    if (!form.employeeName || !form.reason1) return
    setSaving(true)

    const prevCount = countWarnings(warnings, form.employeeId)
    const newWarning = {
      id: `w${Date.now()}`,
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      employeeEmail: form.employeeEmail,
      position: form.position,
      startDate: form.startDate,
      address: form.address,
      warningNumber: prevCount + 1,
      reason1: form.reason1,
      reason2: form.reason2,
      reason3: form.reason3,
      issuedAt: new Date().toISOString().slice(0, 10),
      directorName: session?.user?.name || 'กรรมการบริษัท',
      status: 'issued',
      acknowledgedAt: null,
    }

    setWarnings(prev => [newWarning, ...prev])
    // TODO: POST /api/warnings + Gmail 발송 + Google Sheets 저장
    setForm({ employeeId: '', employeeName: '', employeeEmail: '', position: '', startDate: '', address: '', reason1: '', reason2: '', reason3: '' })
    setShowForm(false)
    setSaving(false)
  }

  const handleAcknowledge = (id) => {
    setWarnings(prev => prev.map(w =>
      w.id === id ? { ...w, status: 'acknowledged', acknowledgedAt: new Date().toISOString().slice(0, 10) } : w
    ))
    // TODO: PATCH /api/warnings/:id
  }

  const severityColor = (num) => {
    if (num === 1) return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', label: '1차 경고' }
    if (num === 2) return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171', label: '2차 경고' }
    return { bg: 'rgba(139,0,0,0.15)', border: 'rgba(239,68,68,0.5)', text: '#fca5a5', label: `${num}차 경고` }
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>
            ⚠️ {isAdmin ? '경고장 관리' : '나의 경고장'}
          </h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>
            {isAdmin ? `총 ${visibleWarnings.length}건` : `총 ${visibleWarnings.length}건의 경고장`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setSelected(null) }}
            style={{
              padding: '9px 20px', background: '#ef4444', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            + 경고장 발행
          </button>
        )}
      </div>

      {/* 직원용 안내 배너 */}
      {!isAdmin && visibleWarnings.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>
              총 {visibleWarnings.length}건의 경고장이 있습니다
            </div>
            <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>
              경고장을 확인하고 아래 "확인 완료" 버튼을 눌러주세요
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: 20 }}>

        {/* 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleWarnings.length === 0 ? (
            <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#8b91ab', fontSize: 14 }}>
              {isAdmin ? '발행된 경고장이 없습니다.' : '경고장이 없습니다. 😊'}
            </div>
          ) : visibleWarnings.map(w => {
            const sev = severityColor(w.warningNumber)
            const active = selected?.id === w.id
            return (
              <div
                key={w.id}
                onClick={() => setSelected(active ? null : w)}
                style={{
                  background: active ? sev.bg : '#141828',
                  border: `1px solid ${active ? sev.border : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                        background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`,
                      }}>
                        {sev.label}
                      </span>
                      {w.status === 'acknowledged' ? (
                        <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: 5 }}>
                          ✓ 확인 완료
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 5 }}>
                          미확인
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9', marginBottom: 2 }}>
                        {w.employeeName}
                        <span style={{ fontSize: 12, color: '#8b91ab', fontWeight: 400, marginLeft: 8 }}>{w.position}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: '#8b91ab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.reason1}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#8b91ab', flexShrink: 0, textAlign: 'right' }}>
                    <div>{w.issuedAt}</div>
                    {isAdmin && (
                      <div style={{ marginTop: 4, fontSize: 11 }}>
                        총 <strong style={{ color: sev.text }}>{countWarnings(warnings, w.employeeId)}회</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 상세 + 서류 미리보기 */}
        {selected && (
          <div style={{
            background: '#141828', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 20, height: 'fit-content',
          }}>
            {/* 상단 바 */}
            <div style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>
                  ⚠️ หนังสือตักเตือน — {severityColor(selected.warningNumber).label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>

            {/* 서류 미리보기 (태국어 형식) */}
            <div style={{ padding: '24px 28px', fontFamily: "'Noto Sans Thai', 'Noto Sans KR', sans-serif" }}>
              {/* 회사 헤더 */}
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f3f9' }}>บริษัท ราอน(ไทยแลนด์) จำกัด</div>
                <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 2 }}>349 อาคารเอสเจ อินฟินิท วัน บิสซิเนส คอมเพล็กซ์ ชั้นที่ 29</div>
                <div style={{ fontSize: 11, color: '#8b91ab' }}>โทร 0621247979 | raonthailand23@gmail.com</div>
              </div>

              <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 12 }}>{selected.issuedAt}</div>

              <div style={{ fontSize: 15, fontWeight: 700, color: '#f87171', textAlign: 'center', marginBottom: 20 }}>
                หนังสือตักเตือน
              </div>

              <div style={{ fontSize: 13, color: '#c4c7d6', lineHeight: 2 }}>
                <div>บริษัทราอน(ไทยแลนด์)จำกัด ออกใบตักเตือนให้แก่</div>
                <div>ชื่อ <strong style={{ color: '#f1f3f9' }}>{selected.employeeName}</strong></div>
                <div>ตำแหน่ง <strong style={{ color: '#f1f3f9' }}>{selected.position}</strong></div>
                {selected.startDate && <div>เข้าทำงานตั้งแต่วันที่ <strong style={{ color: '#f1f3f9' }}>{selected.startDate}</strong></div>}
              </div>

              <div style={{ margin: '16px 0', padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 8 }}>เนื่องจาก</div>
                {selected.reason1 && <div style={{ fontSize: 13, color: '#f1f3f9', marginBottom: 4 }}>• {selected.reason1}</div>}
                {selected.reason2 && <div style={{ fontSize: 13, color: '#f1f3f9', marginBottom: 4 }}>• {selected.reason2}</div>}
                {selected.reason3 && <div style={{ fontSize: 13, color: '#f1f3f9' }}>• {selected.reason3}</div>}
              </div>

              {/* 이사 서명 영역 */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>กรรมการบริษัท</div>
                <div style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.15)', margin: '8px auto' }} />
                <div style={{ fontSize: 13, color: '#f1f3f9' }}>{selected.directorName}</div>
              </div>

              {/* 확인 완료 버튼 (직원 전용) */}
              {!isAdmin && selected.status === 'issued' && (
                <button
                  onClick={() => handleAcknowledge(selected.id)}
                  style={{
                    width: '100%', marginTop: 20, padding: '11px',
                    background: 'rgba(79,98,247,0.15)', color: '#818cf8',
                    border: '1px solid rgba(79,98,247,0.3)', borderRadius: 10,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✓ 경고장 확인 완료 (수신 확인)
                </button>
              )}
              {selected.status === 'acknowledged' && (
                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#4ade80' }}>
                  ✓ {selected.acknowledgedAt} 확인 완료
                </div>
              )}

              {/* 이사용 액션 */}
              {isAdmin && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px', background: 'rgba(79,98,247,0.15)', color: '#818cf8', border: '1px solid rgba(79,98,247,0.25)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    📄 PDF 다운로드
                  </button>
                  <button style={{ flex: 1, padding: '8px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✉️ 메일 재발송
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 경고장 발행 모달 */}
      {showForm && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{
            background: '#1e2235', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20, padding: '32px', width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflow: 'auto',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f87171', margin: 0 }}>⚠️ 경고장 발행</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20, fontFamily: 'inherit' }}>×</button>
            </div>

            {/* 직원 선택 */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#8b91ab', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>직원 정보</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'employeeName', label: '직원 이름 (태국어)', placeholder: 'สมชาย ใจดี' },
                  { key: 'position', label: '직책', placeholder: 'Designer' },
                  { key: 'employeeEmail', label: '직원 이메일', placeholder: 'employee@raon.co.th' },
                  { key: 'startDate', label: '입사일', placeholder: '2024-01-01', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#f1f3f9', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 경고 사유 */}
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>경고 사유 (태국어로 작성)</div>
              {['reason1', 'reason2', 'reason3'].map((key, i) => (
                <div key={key} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#8b91ab', marginBottom: 4 }}>사유 {i + 1}{i === 0 ? ' *' : ' (선택)'}</label>
                  <input
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={i === 0 ? 'ขาดงานโดยไม่แจ้งล่วงหน้า...' : '추가 사유 (선택사항)'}
                    style={{ width: '100%', background: '#141828', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#f1f3f9', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#fbbf24' }}>
              ✉️ 발행 즉시 직원 이메일로 자동 발송되며, 직원 로그인 시 알림이 표시됩니다.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.employeeName || !form.reason1} style={{
                padding: '9px 24px',
                background: !form.employeeName || !form.reason1 ? 'rgba(239,68,68,0.3)' : '#ef4444',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: !form.employeeName || !form.reason1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? '발행 중...' : '⚠️ 경고장 발행'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
