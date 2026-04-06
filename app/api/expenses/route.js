import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'
import { sendExpenseStatusEmail } from '../../../lib/email'

const SHEET_ID = process.env.SHEETS_EXPENSES_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const expenses = await readSheet(SHEET_ID)

    const filtered = session.isAdmin
      ? expenses
      : expenses.filter(e => e.employee_email === session.user.email)

    return Response.json(filtered)
  } catch (error) {
    console.error('GET expenses error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, category, amount, currency, expense_date, description } = body

    if (!title || !category || !amount || !expense_date) {
      return Response.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    const newExpense = {
      id: generateId(),
      employee_id:    session.user.email,
      employee_name:  session.user.name,
      employee_email: session.user.email,
      title,
      category,
      amount:         String(amount),
      currency:       currency || 'THB',
      expense_date,
      description:    description || '',
      receipt_url:    body.receipt_url || '',
      status:         'pending',
      approved_by:    '',
      approved_at:    '',
      rejected_reason: '',
      submitted_at:   new Date().toISOString().slice(0, 10),
      custom_1: '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
    }

    await appendRow(SHEET_ID, 'Sheet1', newExpense)
    return Response.json({ success: true, expense: newExpense })
  } catch (error) {
    console.error('POST expense error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) {
      return Response.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, rejected_reason } = body
    const today = new Date().toISOString().slice(0, 10)

    await updateRow(SHEET_ID, 'Sheet1', id, {
      status,
      approved_by:     session.user.name,
      approved_at:     today,
      rejected_reason: rejected_reason || '',
    })

    try {
      const expenses = await readSheet(SHEET_ID)
      const expense = expenses.find(e => e.id === id)
      if (expense) {
        await sendExpenseStatusEmail({
          to:             expense.employee_email,
          name:           expense.employee_name,
          title:          expense.title,
          category:       expense.category,
          amount:         expense.amount,
          currency:       expense.currency,
          expenseDate:    expense.expense_date,
          status,
          rejectedReason: rejected_reason || '',
        })
      }
    } catch (emailError) {
      console.error('경비 이메일 발송 실패:', emailError)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH expense error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
