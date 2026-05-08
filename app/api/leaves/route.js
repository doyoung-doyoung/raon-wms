import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'
import { sendLeaveStatusEmail } from '../../../lib/email'
import { generateLeaveApproval } from '../../../lib/pdf/generate.js'

const SHEET_ID = process.env.SHEETS_LEAVES_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const leaves = await readSheet(SHEET_ID)

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
    const { id, status, rejected_reason } = body
    const today = new Date().toISOString().slice(0, 10)

    await updateRow(SHEET_ID, 'Sheet1', id, {
      status,
      approved_by: session.user.name,
      approved_at: today,
      custom_1: status === 'rejected' ? (rejected_reason || '') : '',
    })

    // 이메일 + PDF 발송
    try {
      const leaves = await readSheet(SHEET_ID)
      const leave = leaves.find(l => l.id === id)
      if (leave) {
        let pdfBuffer = null
        let pdfFileName = null

        // 승인 시에만 PDF 생성
        if (status === 'approved') {
          try {
            const now = new Date()
            const thaiYear = now.getFullYear() + 543
            const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
            const issueDate = `${now.getDate()} ${thaiMonths[now.getMonth()]} พ.ศ. ${thaiYear}`

            // 직원 정보 조회
            const employees = await readSheet(process.env.SHEETS_EMPLOYEES_ID)
            const emp = employees.find(e => e.email === leave.employee_email) || {}

            pdfBuffer = await generateLeaveApproval({
              issueDate,
              employeeName: emp.name_th || leave.employee_name || '',
              employeeNameEn: emp.name_en || '',
              employeeId: emp.employee_id || leave.employee_id || '',
              position: emp.position || '',
              leaveType: leave.leave_type,
              startDate: leave.start_date,
              endDate: leave.end_date,
              days: leave.days,
              reason: leave.reason || '',
              isPaid: leave.is_paid !== 'false',
              approvedBy: process.env.ADMIN_NAME || 'Jung Doyoung',
              approvedAt: today,
              directorName: process.env.ADMIN_NAME || 'Doyoung Jung',
              directorRole: 'กรรมการบริษัท (Managing Director)',
            })
            pdfFileName = `leave_approval_${leave.employee_name}_${leave.start_date}.pdf`
          } catch (pdfErr) {
            console.error('휴가 PDF 생성 실패:', pdfErr)
          }
        }

        await sendLeaveStatusEmail({
          to:             leave.employee_email,
          name:           leave.employee_name,
          leaveType:      leave.leave_type,
          startDate:      leave.start_date,
          endDate:        leave.end_date,
          days:           leave.days,
          status,
          rejectedReason: rejected_reason || '',
          pdfBuffer,
          pdfFileName,
        })
      }
    } catch (emailError) {
      console.error('이메일 발송 실패:', emailError)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH leave error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}