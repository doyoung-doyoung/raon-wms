import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'

const SHEET_ID = process.env.SHEETS_LEAVES_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const leaves = await readSheet(SHEET_ID)

    // 직원은 자기 것만
    const filtered = session.isAdmin
      ? leaves
      : leaves.filter(l => l.employee_email === session.user.email)

    return Response.json(filtered)
  } catch (error) {
    console.error('GET leaves error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const id = generateId()
    const today = new Date().toISOString().slice(0, 10)

    // 5일 전 신청 체크 (병가 제외)
    if (body.leave_type !== 'sick') {
      const startDate = new Date(body.start_date)
      const diffDays = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24))
      if (diffDays < 5) {
        return Response.json({ error: '휴가는 5일 전에 신청해야 합니다.' }, { status: 400 })
      }
    }

    // 유급/무급 자동 판단
    let is_paid = 'true'
    if (body.leave_type === 'sick' && Number(body.days) > 30) is_paid = 'false'
    if (body.leave_type === 'personal' && Number(body.days) > 3) is_paid = 'false'

    const newLeave = {
      id,
      employee_id:    session.user.email,
      employee_name:  session.user.name,
      employee_email: session.user.email,
      leave_type:     body.leave_type,
      start_date:     body.start_date,
      end_date:       body.end_date,
      days:           body.days,
      reason:         body.reason,
      status:         'pending',
      attachment_url: body.attachment_url || '',
      approved_by:    '',
      approved_at:    '',
      is_paid,
      deduction_amount: '0',
      custom_1: '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
      custom_6: '', custom_7: '', custom_8: '', custom_9: '', custom_10: '',
    }

    await appendRow(SHEET_ID, 'Sheet1', newLeave)
    return Response.json({ success: true, leave: newLeave })
  } catch (error) {
    console.error('POST leave error:', error)
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
    const { id, status } = body
    const today = new Date().toISOString().slice(0, 10)

    await updateRow(SHEET_ID, 'Sheet1', id, {
      status,
      approved_by: session.user.name,
      approved_at: today,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH leave error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}