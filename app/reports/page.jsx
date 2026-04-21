'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const currentYear  = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [viewMode, setViewMode]         = useState('monthly')
  const [selectedYear, setSelectedYear]   = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [report, setReport]             = useState(null)
  const [loading, setLoading]           = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent]       = useState(false)
  const [docDetailEmp, setDocDetailEmp] = useState(null) // 선택된 직원 서류 상세 모달

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.isAdmin)) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.isAdmin) return
    fetchReport()
  }, [status, session, selectedYear, selectedMonth, viewMode])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const month = viewMode === 'monthly' ? selectedMonth : null
      const params = new URLSearchParams({ year: selectedYear })
      if (month) params.set('month', month)
      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      setReport(data)
    } catch {
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      const month = viewMode === 'monthly' ? selectedMonth : null
      await fetch('/api/reports/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, month }),
      })
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch {}
    setSendingEmail(false)
  }

  if (status === 'loading') return null

  const StatCard = ({ label, value, sub, color = '#4f62f7', icon }) => (
    <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#8b91ab' }}>{label}</div>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#8b91ab', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '24px 0 12px' }}>
      {children}
    </div>
  )

  const Skeleton = () => (
    <div style={{ background: '#1e2235', borderRadius: 12, height: 80, animation: 'pulse 1.5s ease-in-out infinite' }} />
  )

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>📊 업무 리포트</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>
            생성일: {report?.generatedAt || new Date().toISOString().slice(0, 10)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 월간/연간 토글 */}
          <div style={{ display: 'flex', background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
            {['monthly', 'annual'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '7px 16px', border: 'none',
                background: viewMode === mode ? '#4f62f7' : 'transparent',
                color: viewMode === mode ? '#fff' : '#8b91ab',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
                {mode === 'monthly' ? '월간' : '연간'}
              </button>
            ))}
          </div>

          {/* 연도 선택 */}
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{
            background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
            color: '#f1f3f9', padding: '7px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
          }}>
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          {/* 월 선택 (월간만) */}
          {viewMode === 'monthly' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{
              background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
              color: '#f1f3f9', padding: '7px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
            }}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          )}

          {/* 이메일 발송 버튼 */}
          <button onClick={handleSendEmail} disabled={sendingEmail || loading} style={{
            padding: '8px 18px',
            background: emailSent ? 'rgba(34,197,94,0.15)' : 'rgba(79,98,247,0.15)',
            color: emailSent ? '#4ade80' : '#818cf8',
            border: `1px solid ${emailSent ? 'rgba(34,197,94,0.3)' : 'rgba(79,98,247,0.3)'}`,
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: (sendingEmail || loading) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
            {sendingEmail ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(129,140,248,0.3)', borderTop: '2px solid #818cf8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />발송 중...</>
            ) : emailSent ? (
              <>✓ 발송 완료</>
            ) : (
              <>✉️ 이메일로 받기</>
            )}
          </button>
        </div>
      </div>

      {/* 리포트 제목 배너 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,98,247,0.12) 0%, rgba(124,58,237,0.08) 100%)',
        border: '1px solid rgba(79,98,247,0.2)', borderRadius: 16,
        padding: '18px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9' }}>{report?.period || '...'} 리포트</div>
          <div style={{ fontSize: 13, color: '#8b91ab', marginTop: 2 }}>RAON (Thailand) Co., Ltd. — 이사 전용</div>
        </div>
        <div style={{ fontSize: 32 }}>{viewMode === 'monthly' ? '📋' : '📅'}</div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : !report ? (
        <div style={{ textAlign: 'center', color: '#8b91ab', padding: '60px 0' }}>데이터를 불러올 수 없습니다.</div>
      ) : (
        <>
          {/* ===== 직원 현황 ===== */}
          <SectionTitle>👥 직원 현황</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <StatCard label="전체 직원"  value={`${report.employees.total}명`}  icon="👥" color="#818cf8" />
            <StatCard label="재직 중"    value={`${report.employees.active}명`}  icon="✅" color="#4ade80" />
            <StatCard label="수습 중"    value={`${report.employees.onProbation}명`} icon="🔄" color="#fbbf24" />
            <StatCard label={viewMode === 'monthly' ? '신규 입사' : '연간 입사'} value={`${report.employees.newHires}명`} icon="🆕" color="#38bdf8" />
            {viewMode === 'annual' && (
              <StatCard label="퇴직" value={`${report.employees.resigned}명`} icon="🚪" color="#f87171" />
            )}
          </div>

          {/* ===== 출퇴근 현황 ===== */}
          <SectionTitle>⏰ 출퇴근 현황</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <StatCard label="총 출근 기록"  value={`${report.attendance.totalWorkDays}건`}   icon="📅" color="#818cf8" />
            <StatCard label="평균 출근율"   value={`${report.attendance.avgAttendanceRate}%`} icon="📊" color="#4ade80" sub="전 직원 평균" />
            <StatCard label="지각 횟수"     value={`${report.attendance.lateCount}회`}       icon="⏱️" color="#fbbf24" />
            <StatCard label="미출근 기록"   value={`${report.attendance.absentCount}건`}      icon="❌" color="#f87171" />
          </div>

          {/* ===== 휴가/병가 현황 ===== */}
          <SectionTitle>🗓️ 휴가 / 병가 현황</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { title: '🌴 연차',  taken: report.leaves.annual.taken,   remaining: report.leaves.annual.remaining, color: '#4f62f7' },
              { title: '🏥 병가',  taken: report.leaves.sick.taken,     paid: report.leaves.sick.paid,     unpaid: report.leaves.sick.unpaid,     color: '#22c55e' },
              { title: '🌸 경조사', taken: report.leaves.personal.taken, paid: report.leaves.personal.paid, unpaid: report.leaves.personal.unpaid, color: '#f59e0b' },
            ].map(item => (
              <div key={item.title} style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9', marginBottom: 12 }}>{item.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8b91ab' }}>사용</span>
                    <span style={{ color: item.color, fontWeight: 600 }}>{item.taken}일</span>
                  </div>
                  {item.remaining !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#8b91ab' }}>잔여 (전체)</span>
                      <span style={{ color: '#f1f3f9' }}>{item.remaining}일</span>
                    </div>
                  )}
                  {item.paid !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#8b91ab' }}>유급</span>
                      <span style={{ color: '#4ade80' }}>{item.paid}일</span>
                    </div>
                  )}
                  {item.unpaid !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#8b91ab' }}>무급</span>
                      <span style={{ color: '#f87171' }}>{item.unpaid}일</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ===== 직원별 휴가 상세 ===== */}
          <SectionTitle>👤 직원별 휴가 현황</SectionTitle>
          <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(79,98,247,0.08)' }}>
                  {['직원', '직책', '🌴 연차 사용', '연차 잔여', '🏥 병가', '🌸 경조사', '합계'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === '직원' || h === '직책' ? 'left' : 'center', fontSize: 12, color: '#8b91ab', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(report.leaves.byEmployee || []).map((emp, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#f1f3f9', fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#8b91ab' }}>{emp.position || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {emp.annual > 0
                        ? <span style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>{emp.annual}일</span>
                        : <span style={{ fontSize: 12, color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: emp.annualRemaining <= 2 ? '#f87171' : '#4ade80' }}>
                        {emp.annualRemaining}일
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {emp.sick > 0
                        ? <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{emp.sick}일</span>
                        : <span style={{ fontSize: 12, color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {emp.personal > 0
                        ? <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>{emp.personal}일</span>
                        : <span style={{ fontSize: 12, color: '#3d4260' }}>-</span>}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {emp.total > 0
                        ? <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f3f9', background: 'rgba(79,98,247,0.12)', padding: '2px 10px', borderRadius: 6 }}>{emp.total}일</span>
                        : <span style={{ fontSize: 12, color: '#3d4260' }}>0일</span>}
                    </td>
                  </tr>
                ))}
                {/* 합계 행 */}
                {(report.leaves.byEmployee || []).length > 0 && (
                  <tr style={{ borderTop: '2px solid rgba(79,98,247,0.2)', background: 'rgba(79,98,247,0.05)' }}>
                    <td colSpan={2} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#8b91ab' }}>합계</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{report.leaves.annual.taken}일</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{report.leaves.annual.remaining}일</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{report.leaves.sick.taken}일</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{report.leaves.personal.taken}일</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f1f3f9' }}>
                      {report.leaves.annual.taken + report.leaves.sick.taken + report.leaves.personal.taken}일
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ===== 서류 발행 ===== */}
          <SectionTitle>📄 서류 발행 현황</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatCard label="재직증명서"  value={`${report.documents.salaryVerifications}건`} icon="📋" color="#38bdf8" />
            <StatCard label="급여명세서"  value={`${report.documents.payslips}건`}            icon="💳" color="#a78bfa" />
            <StatCard label="휴가 승인서" value={`${report.documents.leaveApprovals}건`}      icon="🗓️" color="#f59e0b" />
            <StatCard label="경고장"      value={`${report.documents.warnings}건`}            icon="⚠️" color={report.documents.warnings > 0 ? '#f87171' : '#4ade80'} />
          </div>

          {/* 직원별 HR 서류 발급 현황 */}
          {(report.documents.byEmployee || []).length > 0 && (
            <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#8b91ab' }}>직원별 서류 신청 현황</span>
                <span style={{ fontSize: 11, color: '#3d4260' }}>행 클릭 시 상세 내역</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(56,189,248,0.06)' }}>
                    {['직원', '📋 재직증명서', '💳 급여명세서', '합계'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: h === '직원' ? 'left' : 'center', fontSize: 12, color: '#8b91ab', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.documents.byEmployee.map((emp, i) => (
                    <tr key={i}
                      onClick={() => setDocDetailEmp(emp)}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                    >
                      <td style={{ padding: '9px 14px', fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>
                        {emp.name} <span style={{ fontSize: 10, color: '#3d4260', marginLeft: 4 }}>▶</span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {emp.salaryCert > 0 ? <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>{emp.salaryCert}건</span> : <span style={{ color: '#3d4260', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {emp.payslip > 0 ? <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>{emp.payslip}건</span> : <span style={{ color: '#3d4260', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f3f9', background: 'rgba(56,189,248,0.1)', padding: '2px 10px', borderRadius: 6 }}>{emp.total}건</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 서류 상세 모달 */}
          {docDetailEmp && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
              onClick={e => e.target === e.currentTarget && setDocDetailEmp(null)}>
              <div style={{ background: '#141828', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 600, maxWidth: '94vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* 모달 헤더 */}
                <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f3f9' }}>📋 {docDetailEmp.name}</div>
                    <div style={{ fontSize: 12, color: '#8b91ab', marginTop: 2 }}>
                      서류 신청 내역 · 총 {docDetailEmp.total}건
                      {docDetailEmp.salaryCert > 0 && <span style={{ marginLeft: 8, color: '#38bdf8' }}>재직증명서 {docDetailEmp.salaryCert}건</span>}
                      {docDetailEmp.payslip > 0   && <span style={{ marginLeft: 8, color: '#a78bfa' }}>급여명세서 {docDetailEmp.payslip}건</span>}
                    </div>
                  </div>
                  <button onClick={() => setDocDetailEmp(null)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8b91ab', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>

                {/* 상세 목록 */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr style={{ background: '#1a2035' }}>
                        {['서류 종류', '신청일', '상태', '메모'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8b91ab', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(docDetailEmp.details || []).map((d, i) => {
                        const statusInfo = {
                          approved: { label: '승인완료', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                          pending:  { label: '대기중',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                          rejected: { label: '반려',     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
                        }[d.status] || { label: d.status, color: '#8b91ab', bg: 'rgba(255,255,255,0.06)' }
                        const typeColor = d.type === 'salary_certificate' ? '#38bdf8' : '#a78bfa'
                        return (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: typeColor }}>{d.typeLabel}</span>
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: '#c4c7d6' }}>
                              {d.requestedAt ? d.requestedAt.slice(0, 10) : '-'}
                              {d.requestedAt && <div style={{ fontSize: 11, color: '#8b91ab' }}>{d.requestedAt.slice(11, 16)}</div>}
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: statusInfo.color, background: statusInfo.bg, padding: '2px 8px', borderRadius: 5 }}>
                                {statusInfo.label}
                              </span>
                              {d.approvedAt && <div style={{ fontSize: 11, color: '#8b91ab', marginTop: 2 }}>승인: {d.approvedAt.slice(0, 10)}</div>}
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: '#8b91ab' }}>
                              {d.note || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== 견적서 / 인보이스 현황 ===== */}
          <SectionTitle>💼 견적서 / 인보이스 현황</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatCard label="견적서 생성"  value={`${report.quotations?.created ?? 0}건`}   icon="📝" color="#818cf8" />
            <StatCard label="인보이스 발행" value={`${report.quotations?.invoiced ?? 0}건`}  icon="📋" color="#a78bfa" />
            <StatCard label="결제 완료"     value={`${report.quotations?.paid ?? 0}건`}      icon="✅" color="#4ade80" />
            <StatCard label="수금 금액"     value={`฿${(report.quotations?.totalRevenue ?? 0).toLocaleString()}`} icon="💰" color="#fbbf24" />
          </div>

          {/* 담당자별 견적서/인보이스 현황 */}
          {(report.quotations?.byCreator || []).length > 0 && (
            <div style={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, fontWeight: 600, color: '#8b91ab' }}>
                담당자별 견적서 / 인보이스 현황
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(79,98,247,0.08)' }}>
                    {['담당자', '📝 견적서', '📋 인보이스', '✅ 결제완료', '💰 수금액'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: h === '담당자' ? 'left' : 'center', fontSize: 12, color: '#8b91ab', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.quotations.byCreator.map((c, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '9px 14px', fontSize: 13, color: '#f1f3f9', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {c.created > 0 ? <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 600 }}>{c.created}</span> : <span style={{ color: '#3d4260', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {c.invoiced > 0 ? <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>{c.invoiced}</span> : <span style={{ color: '#3d4260', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {c.paid > 0 ? <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{c.paid}</span> : <span style={{ color: '#3d4260', fontSize: 12 }}>-</span>}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {c.revenue > 0
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 10px', borderRadius: 6 }}>
                              ฿{Math.round(c.revenue).toLocaleString()}
                            </span>
                          : <span style={{ color: '#3d4260', fontSize: 12 }}>-</span>}
                      </td>
                    </tr>
                  ))}
                  {/* 합계 행 */}
                  <tr style={{ borderTop: '2px solid rgba(79,98,247,0.2)', background: 'rgba(79,98,247,0.05)' }}>
                    <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: '#8b91ab' }}>합계</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{report.quotations.created}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{report.quotations.invoiced}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{report.quotations.paid}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                      ฿{report.quotations.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ===== 경고장 상세 ===== */}
          {report.warnings.byEmployee.length > 0 && (
            <>
              <SectionTitle>⚠️ 경고장 상세</SectionTitle>
              <div style={{ background: '#1e2235', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(239,68,68,0.06)' }}>
                      {['직원', '누적 경고 수', '최근 경고일'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#8b91ab', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.warnings.byEmployee.map((w, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#f1f3f9' }}>{w.name}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 8px', borderRadius: 5 }}>
                            {w.count}회
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#8b91ab' }}>{w.latest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ===== 경비 처리 ===== */}
          <SectionTitle>💳 경비 처리</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatCard label="총 경비 청구" value={`฿${report.expenses.total.toLocaleString()}`}    icon="🧾" color="#818cf8" />
            <StatCard label="승인 완료"    value={`฿${report.expenses.approved.toLocaleString()}`} icon="✅" color="#4ade80" />
            <StatCard label="대기 중"      value={`฿${report.expenses.pending.toLocaleString()}`}  icon="⏳" color="#fbbf24" />
          </div>

          {/* 자동 발송 설정 안내 */}
          <div style={{
            marginTop: 32, background: 'rgba(79,98,247,0.06)', border: '1px solid rgba(79,98,247,0.2)',
            borderRadius: 14, padding: '18px 24px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>⚙️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#818cf8', marginBottom: 4 }}>자동 월간 리포트 발송</div>
              <div style={{ fontSize: 13, color: '#8b91ab', lineHeight: 1.7 }}>
                위 <strong style={{ color: '#c4c7d6' }}>✉️ 이메일로 받기</strong> 버튼을 누르면 이사님 이메일로 현재 리포트가 발송됩니다.
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
