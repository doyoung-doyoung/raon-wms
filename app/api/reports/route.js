import { auth } from '../auth/[...nextauth]/route'
import { readSheet } from '../../../lib/google/sheets'
import { getSettingsCache } from '../../../lib/settingsCache'
import { DEFAULT_SETTINGS } from '../settings/route'

export const dynamic = 'force-dynamic'

function inPeriod(dateStr, year, month) {
  if (!dateStr) return false
  if (month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return dateStr.startsWith(prefix)
  }
  return dateStr.startsWith(String(year))
}

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null

    const [employees, attendance, leaves, warnings, expenses, documents] = await Promise.all([
      readSheet(process.env.SHEETS_EMPLOYEES_ID).catch(() => []),
      readSheet(process.env.SHEETS_ATTENDANCE_ID).catch(() => []),
      readSheet(process.env.SHEETS_LEAVES_ID).catch(() => []),
      readSheet(process.env.SHEETS_WARNINGS_ID).catch(() => []),
      readSheet(process.env.SHEETS_EXPENSES_ID).catch(() => []),
      readSheet(process.env.SHEETS_DOCUMENTS_ID, '문서발급요청').catch(() => []),
    ])

    // 설정에서 출근 시간 읽기
    const settings = getSettingsCache() || DEFAULT_SETTINGS
    const checkInTime = settings.checkInTime || '09:00'

    // ===== 직원 현황 =====
    const totalEmployees = employees.filter(e => e.status !== 'inactive').length
    const activeEmployees = employees.filter(e => e.status === 'active').length
    const onProbation = employees.filter(e => e.status === 'probation').length
    const newHires = employees.filter(e => inPeriod(e.start_date, year, month)).length
    // 퇴사자: status=inactive, resign_date 기준으로 해당 기간 필터
    const resigned = employees.filter(e => e.status === 'inactive' && inPeriod(e.resign_date || '', year, month)).length

    // ===== 출퇴근 현황 =====
    const periodAttendance = attendance.filter(r => inPeriod(r.date, year, month))
    const totalWorkDays = periodAttendance.filter(r => r.check_in).length
    const uniqueWorkDays = new Set(periodAttendance.filter(r => r.check_in).map(r => r.date)).size

    // 지각: 설정된 출근시간 이후 출근
    const lateCount = periodAttendance.filter(r => r.check_in && r.check_in > checkInTime).length

    // 출근율: (실제 출근일 / 예상 근무일) — 직원수 * 영업일 기준 간이 계산
    const expectedDays = uniqueWorkDays * Math.max(totalEmployees, 1)
    const avgAttendanceRate = expectedDays > 0
      ? Math.round((totalWorkDays / expectedDays) * 1000) / 10
      : 0

    // 무단결근: 출근 기록이 없고 휴가도 없는 날 (간이: 당일 기록 중 check_in 비어 있는 것)
    const absentCount = periodAttendance.filter(r => !r.check_in).length

    // ===== 휴가 현황 =====
    const periodLeaves = leaves.filter(l => l.status === 'approved' && inPeriod(l.start_date, year, month))
    const leaveAnnual   = periodLeaves.filter(l => l.leave_type === 'annual').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const leaveSick     = periodLeaves.filter(l => l.leave_type === 'sick').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const leavePersonal = periodLeaves.filter(l => l.leave_type === 'personal').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const leavePaidSick   = periodLeaves.filter(l => l.leave_type === 'sick' && l.is_paid !== 'false').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const leaveUnpaidSick = periodLeaves.filter(l => l.leave_type === 'sick' && l.is_paid === 'false').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const leavePaidPersonal   = periodLeaves.filter(l => l.leave_type === 'personal' && l.is_paid !== 'false').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const leaveUnpaidPersonal = periodLeaves.filter(l => l.leave_type === 'personal' && l.is_paid === 'false').reduce((s, l) => s + parseFloat(l.days || 0), 0)

    // 연차 잔여 (전체 부여일 - 사용일, 간이: 부여일은 직원당 10일 기준)
    const totalAnnualGranted = totalEmployees * 10
    const totalAnnualUsed = leaves.filter(l => l.status === 'approved' && l.leave_type === 'annual').reduce((s, l) => s + parseFloat(l.days || 0), 0)
    const annualRemaining = Math.max(0, totalAnnualGranted - totalAnnualUsed)

    // ===== 직원별 휴가 현황 =====
    // 재직 중인 모든 직원 기준으로 행 생성 (휴가 없어도 0으로 표시)
    const activeEmployeeList = employees.filter(e => e.status !== 'inactive')
    const leaveByEmployee = activeEmployeeList.map(emp => {
      const empEmail = emp.email
      const empLeaves = periodLeaves.filter(l => l.employee_email === empEmail || l.employee_id === empEmail)
      const annual   = empLeaves.filter(l => l.leave_type === 'annual').reduce((s, l) => s + parseFloat(l.days || 0), 0)
      const sick     = empLeaves.filter(l => l.leave_type === 'sick').reduce((s, l) => s + parseFloat(l.days || 0), 0)
      const personal = empLeaves.filter(l => l.leave_type === 'personal').reduce((s, l) => s + parseFloat(l.days || 0), 0)
      // 연차 잔여: 개인 기준 10일 부여 - 전체 기간 사용일
      const allAnnualUsed = leaves.filter(l => l.status === 'approved' && l.leave_type === 'annual' && (l.employee_email === empEmail || l.employee_id === empEmail)).reduce((s, l) => s + parseFloat(l.days || 0), 0)
      return {
        name:      emp.name_th || emp.name_ko || emp.name_en || empEmail,
        email:     empEmail,
        position:  emp.position || '',
        annual,
        annualRemaining: Math.max(0, 10 - allAnnualUsed),
        sick,
        personal,
        total:     annual + sick + personal,
      }
    }).sort((a, b) => b.total - a.total)

    // ===== 경고장 =====
    const periodWarnings = warnings.filter(w => inPeriod(w.issued_at, year, month))
    const warningsByEmployee = periodWarnings.reduce((acc, w) => {
      const key = w.employee_name || w.employee_id
      if (!acc[key]) acc[key] = { name: key, count: 0, latest: w.issued_at }
      acc[key].count++
      if (w.issued_at > acc[key].latest) acc[key].latest = w.issued_at
      return acc
    }, {})

    // ===== 경비 현황 =====
    const periodExpenses = expenses.filter(e => inPeriod(e.expense_date || e.submitted_at, year, month))
    const expenseTotal    = periodExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const expenseApproved = periodExpenses.filter(e => e.status === 'approved').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const expensePending  = periodExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + parseFloat(e.amount || 0), 0)

    // ===== 서류 발행 =====
    // requestedAt은 ISO 문자열(2026-04-09T...) — inPeriod가 startsWith로 처리
    const periodDocs = documents.filter(d => inPeriod(d.requestedAt, year, month))
    const docSalaryCert = periodDocs.filter(d => d.documentType === 'salary_certificate').length
    const docPayslip    = periodDocs.filter(d => d.documentType === 'payslip').length

    const period = month
      ? `${year}년 ${month}월`
      : `${year}년 연간`

    return Response.json({
      period,
      generatedAt: new Date().toISOString().slice(0, 10),
      employees: {
        total:       totalEmployees,
        active:      activeEmployees,
        onProbation,
        newHires,
        resigned,
      },
      attendance: {
        totalWorkDays,
        avgAttendanceRate,
        lateCount,
        absentCount,
      },
      leaves: {
        annual:      { taken: leaveAnnual, remaining: annualRemaining },
        sick:        { taken: leaveSick, paid: leavePaidSick, unpaid: leaveUnpaidSick },
        personal:    { taken: leavePersonal, paid: leavePaidPersonal, unpaid: leaveUnpaidPersonal },
        byEmployee:  leaveByEmployee,
      },
      warnings: {
        total:       periodWarnings.length,
        byEmployee:  Object.values(warningsByEmployee),
      },
      expenses: {
        total:    Math.round(expenseTotal),
        approved: Math.round(expenseApproved),
        pending:  Math.round(expensePending),
      },
      documents: {
        salaryVerifications: docSalaryCert,
        payslips:            docPayslip,
        leaveApprovals:      periodLeaves.length,
        warnings:            periodWarnings.length,
      },
    })
  } catch (error) {
    console.error('GET reports error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
