'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLang } from '../../lib/i18n/useLang'

export default function EmployeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    name_ko: '', name_th: '', name_en: '',
    email: '', phone: '', address: '', custom_1: '',
    position: '', department: '',
    start_date: '', salary: '',
    bank_account: '', bank_name: '',
    national_id: '', emergency_contact: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.isAdmin)) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.isAdmin) fetchEmployees()
  }, [session])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.name_ko || !form.email || !form.start_date) return
    setSaving(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        await fetchEmployees()
        setShowForm(false)
        setForm({
          name_ko: '', name_th: '', name_en: '',
          email: '', phone: '', address: '', custom_1: '',
          position: '', department: '',
          start_date: '', salary: '',
          bank_account: '', bank_name: '',
          national_id: '', emergency_contact: '',
        })
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const statusColor = (s) => {
    if (s === 'active') return { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', label: '재직 중' }
    if (s === 'probation') return { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', label: '수습 중' }
    return { bg: 'rgba(239,68,68,0.1)', color: '#f87171', label: '퇴직' }
  }

  const fields = [
    { key: 'name_ko', label: '이름 (한국어) *', placeholder: '홍길동' },
    { key: 'name_th', label: '이름 (태국어)', placeholder: 'สมชาย ใจดี' },
    { key: 'name_en', label: '이름 (영어)', placeholder: 'John Doe' },
    { key: 'email', label: '이메일 *', placeholder: 'employee@raon.co.th', type: 'email' },
    { key: 'phone', label: '전화번호', placeholder: '+66812345678' },
    { key: 'position', label: '직책', placeholder: 'Designer' },
    { key: 'department', label: '부서', placeholder: 'Creative' },
    { key: 'start_date', label: '입사일 *', type: 'date' },
    { key: 'salary', label: '월급 (THB)', placeholder: '25000', type: 'number' },
    { key: 'national_id', label: '주민등록번호', placeholder: '1234567890123' },
    { key: 'bank_name', label: '은행명', placeholder: 'KASIKORN BANK' },
    { key: 'bank_account', label: '계좌번호', placeholder: '174-2-88990-0' },
    { key: 'emergency_contact', label: '비상연락처', placeholder: '이름 / 전화번호' },
    { key: 'custom_1', label: '주소 (ID카드)', placeholder: '신분증상 주소...' },
    { key: 'address', label: '주소 (현재 거주지)', placeholder: '현재 거주 주소...' },
  ]

  if (status === 'loading') return null

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>👥 직원 관리</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>총 {employees.length}명</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/dashboard" style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8b91ab', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>🏠 홈</a>
          <button onClick={() => setShowForm(true)} style={{padding: '9px 20px', background: '#4f62f7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6}}>
            + 직원 등록
          </button>
        </div>
      </div>

      {/* 직원 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b91ab' }}>
          <div style={{ width: 32, height: 32, border: '2px solid rgba(79,98,247,0.3)', borderTop: '2px solid #4f62f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          불러오는 중...
        </div>
      ) : employees.length === 0 ? (
        <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#8b91ab' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f3f9', marginBottom: 6 }}>등록된 직원이 없습니다</div>
          <div style={{ fontSize: 13 }}>+ 직원 등록 버튼을 눌러 첫 직원을 등록해보세요!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {employees.map(emp => {
            const s = statusColor(emp.status)
            return (
              <div key={emp.id}
                onClick={() => setSelected(selected?.id === emp.id ? null : emp)}
                style={{
                  background: '#141828', border: `1px solid ${selected?.id === emp.id ? 'rgba(79,98,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = selected?.id === emp.id ? 'rgba(79,98,247,0.4)' : 'rgba(255,255,255,0.07)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {emp.name_ko?.[0] || emp.name_th?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f3f9' }}>{emp.name_ko || emp.name_th}</div>
                      <div style={{ fontSize: 12, color: '#8b91ab' }}>{emp.position}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#8b91ab', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>📧 {emp.email}</div>
                  <div>📅 입사일: {emp.start_date}</div>
                  {emp.probation_end_date && (
                    <div>🔄 수습 종료: {emp.probation_end_date}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 직원 상세 */}
      {selected && (
        <div style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
          background: '#141828', borderLeft: '1px solid rgba(255,255,255,0.07)',
          padding: '24px', overflow: 'auto', zIndex: 50, animation: 'slideIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>직원 상세</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #4f62f7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {selected.name_ko?.[0] || selected.name_th?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9' }}>{selected.name_ko}</div>
              <div style={{ fontSize: 13, color: '#8b91ab' }}>{selected.name_th}</div>
              <div style={{ fontSize: 12, color: '#8b91ab' }}>{selected.position} · {selected.department}</div>
            </div>
          </div>
          {[
            { label: '이메일', value: selected.email },
            { label: '전화번호', value: selected.phone },
            { label: '입사일', value: selected.start_date },
            { label: '수습 종료일', value: selected.probation_end_date },
            { label: '월급', value: selected.salary ? `฿${Number(selected.salary).toLocaleString()}` : '-' },
            { label: '은행', value: selected.bank_name },
            { label: '계좌번호', value: selected.bank_account },
            { label: '주민번호', value: selected.national_id },
            { label: '비상연락처', value: selected.emergency_contact },
            { label: '주소', value: selected.address },
          ].map(item => item.value ? (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#8b91ab', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: '#f1f3f9' }}>{item.value}</div>
            </div>
          ) : null)}
        </div>
      )}

      {/* 직원 등록 모달 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{
            background: '#1e2235', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20, padding: '32px', width: '100%', maxWidth: 600,
            maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>👤 직원 등록</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#8b91ab', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {fields.map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'address' ? '1 / -1' : 'auto' }}>
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
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', color: '#8b91ab', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.name_ko || !form.email || !form.start_date} style={{
                padding: '9px 24px',
                background: !form.name_ko || !form.email || !form.start_date ? 'rgba(79,98,247,0.4)' : '#4f62f7',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: !form.name_ko || !form.email || !form.start_date ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
                {saving ? '저장 중...' : '✓ 직원 등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  )
}