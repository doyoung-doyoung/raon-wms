'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLang } from '../../lib/i18n/useLang'

// 샘플 리포트 데이터 (추후 Google Sheets 연동)
function generateSampleReport(year, month) {
  return {
    period: month ? `${year}년 ${month}월` : `${year}년 연간`,
    generatedAt: new Date().toISOString().slice(0, 10),

    // 직원 현황
    employees: {
      total: 8,
      active: 7,
      onProbation: 1,
      newHires: month ? 1 : 3,
      resigned: month ? 0 : 1,
    },

    // 출퇴근
    attendance: {
      totalWorkDays: month ? 22 : 261,
      avgAttendanceRate: 94.2,
      lateCount: month ? 3 : 28,
      absentCount: month ? 1 : 14,
    },

    // 휴가/병가
    leaves: {
      annual: { taken: month ? 4 : 47, remaining: 89 },
      sick: { taken: month ? 2 : 19, paid: month ? 2 : 17, unpaid: month ? 0 : 2 },
      personal: { taken: month ? 1 : 8, paid: month ? 1 : 7, unpaid: month ? 0 : 1 },
    },

    // 서류 발행
    documents: {
      contracts: month ? 1 : 3,
      probationPassed: month ? 0 : 2,
      salaryVerifications: month ? 2 : 11,
      leaveApprovals: month ? 7 : 74,
      payslips: month ? 8 : 88,
      warnings: month ? 0 : 1,
    },

    // 경고장
    warnings: {
      total: month ? 0 : 1,
      byEmployee: month ? [] : [
        { name: 'สมชาย ใจดี', count: 1, latest: '2025-01-10' },
      ],
    },

    // 견적서/인보이스
    invoices: {
      quotations: month ? 3 : 24,
      invoicesThai: month ? 2 : 18,
      invoicesUsd: month ? 1 : 6,
      totalRevenueTHB: month ? 285000 : 3420000,
      totalRevenueUSD: month ? 4200 : 38500,
    },

    // 경비
    expenses: {
      total: month ? 12500 : 148000,
      approved: month ? 11000 : 132000,
      pending: month ? 1500 : 16000,
    },
  }
}

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [viewMode, setViewMode] = useState('monthly') // 'monthly' | 'annual'
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.isAdmin)) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const report = generateSampleReport(
    selectedYear,
    viewMode === 'monthly' ? selectedMonth : null
  )

  const handleSendEmail = async () => {
    setSendingEmail(true)
    // TODO: POST /api/reports/send-email
    await new Promise(r => setTimeout(r, 1500))
    setSendingEmail(false)
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
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

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f3f9', margin: 0 }}>📊 업무 리포트</h1>
          <p style={{ color: '#8b91ab', fontSize: 13, marginTop: 4 }}>생성일: {report.generatedAt}</p>
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
          <button onClick={handleSendEmail} disabled={sendingEmail} style={{
            padding: '8px 18px',
            background: emailSent ? 'rgba(34,197,94,0.15)' : 'rgba(79,98,247,0.15)',
            color: emailSent ? '#4ade80' : '#818cf8',
            border: `1px solid ${emailSent ? 'rgba(34,197,94,0.3)' : 'rgba(79,98,247,0.3)'}`,
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: sendingEmail ? 'not-allowed' : 'pointer',
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f3f9' }}>{report.period} 리포트</div>
          <div style={{ fontSize: 13, color: '#8b91ab', marginTop: 2 }}>RAON (Thailand) Co., Ltd. — 이사 전용</div>
        </div>
        <div style={{ fontSize: 32 }}>{viewMode === 'monthly' ? '📋' : '📅'}</div>
      </div>

      {/* ===== 직원 현황 ===== */}
      <SectionTitle>👥 직원 현황</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="전체 직원" value={`${report.employees.total}명`} icon="👥" color="#818cf8" />
        <StatCard label="재직 중" value={`${report.employees.active}명`} icon="✅" color="#4ade80" />
        <StatCard label="수습 중" value={`${report.employees.onProbation}명`} icon="🔄" color="#fbbf24" />
        <StatCard label={viewMode === 'monthly' ? '신규 입사' : '연간 입사'} value={`${report.employees.newHires}명`} icon="🆕" color="#38bdf8" />
        {viewMode === 'annual' && (
          <StatCard label="퇴직" value={`${report.employees.resigned}명`} icon="🚪" color="#f87171" />
        )}
      </div>

      {/* ===== 출퇴근 ===== */}
      <SectionTitle>⏰ 출퇴근 현황</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="총 근무일" value={`${report.attendance.totalWorkDays}일`} icon="📅" color="#818cf8" />
        <StatCard label="평균 출근율" value={`${report.attendance.avgAttendanceRate}%`} icon="📊" color="#4ade80" sub="전 직원 평균" />
        <StatCard label="지각 횟수" value={`${report.attendance.lateCount}회`} icon="⏱️" color="#fbbf24" />
        <StatCard label="무단결근" value={`${report.attendance.absentCount}회`} icon="❌" color="#f87171" />
      </div>

      {/* ===== 휴가/병가 ===== */}
      <SectionTitle>🗓️ 휴가 / 병가 현황</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { title: '🌴 연차', taken: report.leaves.annual.taken, remaining: report.leaves.annual.remaining, color: '#4f62f7' },
          { title: '🏥 병가', taken: report.leaves.sick.taken, paid: report.leaves.sick.paid, unpaid: report.leaves.sick.unpaid, color: '#22c55e' },
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

      {/* ===== 서류 발행 ===== */}
      <SectionTitle>📄 서류 발행 현황</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="고용계약서" value={`${report.documents.contracts}건`} icon="📝" color="#818cf8" />
        <StatCard label="수습 통과" value={`${report.documents.probationPassed}건`} icon="✅" color="#4ade80" />
        <StatCard label="재직증명서" value={`${report.documents.salaryVerifications}건`} icon="📋" color="#38bdf8" />
        <StatCard label="휴가 승인" value={`${report.documents.leaveApprovals}건`} icon="🗓️" color="#f59e0b" />
        <StatCard label="급여명세서" value={`${report.documents.payslips}건`} icon="💳" color="#a78bfa" />
        <StatCard label="경고장" value={`${report.documents.warnings}건`} icon="⚠️" color={report.documents.warnings > 0 ? '#f87171' : '#4ade80'} />
      </div>

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

      {/* ===== 회계 ===== */}
      <SectionTitle>💼 견적서 / 인보이스</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="견적서 발행" value={`${report.invoices.quotations}건`} icon="📊" color="#818cf8" />
        <StatCard label="인보이스 (THB)" value={`${report.invoices.invoicesThai}건`} icon="🇹🇭" color="#f59e0b" />
        <StatCard label="인보이스 (USD)" value={`${report.invoices.invoicesUsd}건`} icon="🇺🇸" color="#38bdf8" />
        <StatCard label="매출 (THB)" value={`฿${report.invoices.totalRevenueTHB.toLocaleString()}`} icon="💰" color="#4ade80" />
        <StatCard label="매출 (USD)" value={`$${report.invoices.totalRevenueUSD.toLocaleString()}`} icon="💵" color="#4ade80" />
      </div>

      <SectionTitle>💳 경비 처리</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="총 경비 청구" value={`฿${report.expenses.total.toLocaleString()}`} icon="🧾" color="#818cf8" />
        <StatCard label="승인 완료" value={`฿${report.expenses.approved.toLocaleString()}`} icon="✅" color="#4ade80" />
        <StatCard label="대기 중" value={`฿${report.expenses.pending.toLocaleString()}`} icon="⏳" color="#fbbf24" />
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
            매월 1일 자동으로 이사님 이메일({process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@raon.co.th'})로 전월 리포트가 발송됩니다.<br />
            <strong style={{ color: '#c4c7d6' }}>설정 &gt; 알림 설정</strong>에서 발송 주기를 변경할 수 있습니다.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
