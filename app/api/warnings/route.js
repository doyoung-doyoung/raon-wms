import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'
import { generateWarningLetter } from '../../../lib/pdf/generate.js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.SHEETS_WARNINGS_ID

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// 경고장 이메일 발송
async function sendWarningEmail({ to, employeeName, position, warningNumber, reason1, reason2, reason3, directorName, issuedAt, pdfBuffer, fileName }) {
  const warningLabel = ['1차', '2차', '3차'][warningNumber - 1] || `${warningNumber}차`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background: #ef4444; border-radius: 12px; padding: 32px; color: white;">
        <h1 style="margin: 0; font-size: 20px;">경고장 (${warningLabel})</h1>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">RAON Co., Ltd.</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; margin-top: 12px;">
        <p style="font-size: 14px; color: #374151;"><strong>${employeeName}</strong>님께</p>
        <p style="color: #475569;">아래 사유로 <strong style="color: #ef4444;">${warningLabel} 경고장</strong>을 발행합니다.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #dc2626;">사유:</p>
          <p style="margin: 0; font-size: 13px; color: #374151;">${reason1}</p>
          ${reason2 ? `<p style="margin: 4px 0 0; font-size: 13px; color: #374151;">${reason2}</p>` : ''}
          ${reason3 ? `<p style="margin: 4px 0 0; font-size: 13px; color: #374151;">${reason3}</p>` : ''}
        </div>
        <p style="font-size: 13px; color: #6b7280;">발행일: ${issuedAt}</p>
        <p style="font-size: 13px; color: #6b7280;">담당자: ${directorName}</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">경고장 PDF가 첨부되어 있습니다.</p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
        RAON Co., Ltd. | 349 อาคารเอสเจ ชั้นที่ 29 | raonthailand23@gmail.com
      </p>
    </div>
  `

  const mailOptions = {
    from: `"RAON WMS" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[RAON] 경고장 ${warningLabel} - ${employeeName}`,
    html,
  }

  if (pdfBuffer && fileName) {
    mailOptions.attachments = [{
      filename: fileName,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }]
  }

  await transporter.sendMail(mailOptions)
}

// 병가 자동 감지 - 3일 연속 결근 체크
async function checkAbsences() {
  const today = new Date()
  const results = []

  const attendance = await readSheet(process.env.SHEETS_ATTENDANCE_ID)
  const leaves = await readSheet(process.env.SHEETS_LEAVES_ID)
  const employees = await readSheet(process.env.SHEETS_EMPLOYEES_ID)
  const warnings = await readSheet(SHEET_ID)

  for (const employee of employees) {
    const email = employee.email
    if (!email) continue

    // 최근 5 영업일 체크
    let absenceDays = []
    let checkDate = new Date(today)

    // 출퇴근 시스템 시작일 (오늘 이전 데이터는 무시)
const systemStartDate = new Date('2026-03-28')

for (let i = 0; i < 5; i++) {
  checkDate.setDate(checkDate.getDate() - 1)
  
  // 시스템 시작일 이전은 체크 안함
  if (checkDate < systemStartDate) break

      // 주말 건너뛰기
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
        i--
        continue
      }

      const dateStr = checkDate.toISOString().slice(0, 10)

      // 출근 기록 있는지 체크
      const hasAttendance = attendance.some(r => r.employee_id === email && r.date === dateStr)

      // 승인된 휴가 있는지 체크
      const hasLeave = leaves.some(l =>
        l.employee_email === email &&
        l.status === 'approved' &&
        l.start_date <= dateStr &&
        l.end_date >= dateStr
      )

      if (!hasAttendance && !hasLeave) {
        absenceDays.push(dateStr)
      } else {
        break // 연속이 아니면 중단
      }
    }

    // 3일 이상 연속 결근이면 경고장 발행
    if (absenceDays.length >= 3) {
      // 이미 같은 기간 경고장 있는지 체크
      const alreadyWarned = warnings.some(w =>
        w.employee_id === email &&
        w.reason1.includes(absenceDays[absenceDays.length - 1])
      )

      if (!alreadyWarned) {
        results.push({ employee, absenceDays })
      }
    }
  }

  return results
}

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const warnings = await readSheet(SHEET_ID)

    const filtered = session.isAdmin
      ? warnings
      : warnings.filter(w => w.employee_email === session.user.email)

    return Response.json(filtered)
  } catch (error) {
    console.error('GET warnings error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const body = await request.json()
    const { type } = body

    // 자동 감지 모드
    if (type === 'auto_check') {
      const absences = await checkAbsences()
      const issued = []

      for (const { employee, absenceDays } of absences) {
        const existing = await readSheet(SHEET_ID)
        const prevCount = existing.filter(w => w.employee_id === employee.email).length
        const warningNumber = prevCount + 1
        const today = new Date().toISOString().slice(0, 10)

        const newWarning = {
          id: generateId(),
          employee_id: employee.email,
          employee_name: employee.name,
          employee_email: employee.email,
          position: employee.position || '',
          start_date: absenceDays[absenceDays.length - 1],
          address: employee.address || '',
          warning_number: warningNumber,
          reason1: `무단결근 3일 이상 (${absenceDays.join(', ')})`,
          reason2: '병가 미신청',
          reason3: '',
          issued_at: today,
          director_name: session.user.name,
          status: 'issued',
          acknowledged_at: '',
          custom_1: '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
          custom_6: '', custom_7: '', custom_8: '', custom_9: '', custom_10: '',
        }

        await appendRow(SHEET_ID, 'Sheet1', newWarning)

        try {
          await sendWarningEmail({
            to: employee.email,
            employeeName: employee.name,
            position: employee.position || '',
            warningNumber,
            reason1: newWarning.reason1,
            reason2: newWarning.reason2,
            reason3: '',
            directorName: session.user.name,
            issuedAt: today,
          })
        } catch (emailError) {
          console.error('경고장 이메일 발송 실패:', emailError)
        }

        issued.push(newWarning)
      }

      return Response.json({ success: true, issued, count: issued.length })
    }

    // 수동 발행 모드
    const {
      employeeId, employeeName, employeeEmail, position,
      startDate, address, reason1, reason2, reason3,
    } = body

    const existing = await readSheet(SHEET_ID)
    const prevCount = existing.filter(w => w.employee_id === employeeId).length
    const warningNumber = prevCount + 1
    const today = new Date().toISOString().slice(0, 10)

    const newWarning = {
      id: generateId(),
      employee_id: employeeId,
      employee_name: employeeName,
      employee_email: employeeEmail,
      position: position || '',
      start_date: startDate || today,
      address: address || '',
      warning_number: warningNumber,
      reason1,
      reason2: reason2 || '',
      reason3: reason3 || '',
      issued_at: today,
      director_name: session.user.name,
      status: 'issued',
      acknowledged_at: '',
      custom_1: '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
      custom_6: '', custom_7: '', custom_8: '', custom_9: '', custom_10: '',
    }

    await appendRow(SHEET_ID, 'Sheet1', newWarning)

    // PDF 생성
    const now2 = new Date()
    const thaiYear = now2.getFullYear() + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const enMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const issueDateTh = `วันที่ ${now2.getDate()} ${thaiMonths[now2.getMonth()]} พ.ศ. ${thaiYear}`
    const issueDateEn = `${now2.getDate()} ${enMonths[now2.getMonth()]} ${now2.getFullYear()}`
    const directorName = process.env.ADMIN_NAME || 'Doyoung Jung'

    let pdfBuffer = null
    let fileName = null
    try {
      pdfBuffer = await generateWarningLetter({
        issueDate: issueDateTh,
        issueDateEn,
        employeeName: employeeName,
        employeeNameEn: '',
        position: position || '',
        startDate: startDate || today,
        address: address || '',
        warningNumber,
        reason1, reason2: reason2 || '', reason3: reason3 || '',
        directorName,
        directorRole: 'กรรมการบริษัท (Managing Director)',
      })
      fileName = `warning_${warningNumber}_${employeeName}_${today}.pdf`
    } catch (pdfErr) {
      console.error('경고장 PDF 생성 실패:', pdfErr)
    }

    try {
      await sendWarningEmail({
        to: employeeEmail,
        employeeName, position, warningNumber,
        reason1, reason2, reason3,
        directorName: session.user.name,
        issuedAt: today,
        pdfBuffer,
        fileName,
      })
    } catch (emailError) {
      console.error('경고장 이메일 발송 실패:', emailError)
    }

    return Response.json({ success: true, warning: newWarning })
  } catch (error) {
    console.error('POST warnings error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    const today = new Date().toISOString().slice(0, 10)

    await updateRow(SHEET_ID, 'Sheet1', id, {
      status: 'acknowledged',
      acknowledged_at: today,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH warnings error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}