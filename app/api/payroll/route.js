import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'

const SHEET_ID = process.env.SHEETS_PAYROLL_ID
const EXPENSES_SHEET_ID = process.env.SHEETS_EXPENSES_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const yearMonth = searchParams.get('year_month') // e.g. "2026-04"
    const employeeId = searchParams.get('employee_id')

    const records = await readSheet(SHEET_ID)

    let filtered = records
    if (yearMonth) filtered = filtered.filter(r => r.year_month === yearMonth)
    if (employeeId) filtered = filtered.filter(r => r.employee_id === employeeId)

    return Response.json(filtered)
  } catch (error) {
    console.error('GET payroll error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const body = await request.json()
    const { employee_id, employee_email, employee_name, year_month, base_salary, notes } = body

    if (!employee_id || !year_month) {
      return Response.json({ error: '직원과 급여월을 선택해주세요.' }, { status: 400 })
    }

    // 중복 체크
    const existing = await readSheet(SHEET_ID)
    const dup = existing.find(r => r.employee_id === employee_id && r.year_month === year_month)
    if (dup) {
      return Response.json({ error: '해당 직원의 해당 월 급여 기록이 이미 존재합니다.' }, { status: 400 })
    }

    // 해당 월 승인된 경비 합산
    const expenses = await readSheet(EXPENSES_SHEET_ID)
    const approvedExpenses = expenses.filter(e =>
      e.employee_email === employee_email &&
      e.status === 'approved' &&
      e.expense_date?.startsWith(year_month)
    )
    const expenseTotal = approvedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

    const record = {
      id:            generateId(),
      employee_id,
      employee_email,
      employee_name,
      year_month,
      base_salary:   String(base_salary || 0),
      expense_total: String(expenseTotal),
      status:        'pending',
      paid_at:       '',
      paid_by:       '',
      notes:         notes || '',
      custom_1: '', custom_2: '', custom_3: '',
    }

    await appendRow(SHEET_ID, 'Sheet1', record)
    return Response.json({ success: true, record })
  } catch (error) {
    console.error('POST payroll error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const { id, action } = await request.json()
    const today = new Date().toISOString().slice(0, 10)

    if (action === 'mark_paid') {
      await updateRow(SHEET_ID, 'Sheet1', id, {
        status:  'paid',
        paid_at: today,
        paid_by: session.user.name,
      })
      return Response.json({ success: true })
    }

    return Response.json({ error: '알 수 없는 액션' }, { status: 400 })
  } catch (error) {
    console.error('PATCH payroll error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
