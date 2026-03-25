import { getServerSession } from 'next-auth'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'
import { google } from 'googleapis'

const SHEET_ID = process.env.SHEETS_WARNINGS_ID

/**
 * GET /api/warnings
 * - 이사: 전체 경고장 목록
 * - 직원: 자신의 경고장만
 */
export async function GET(request) {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const warnings = await readSheet(SHEET_ID)

  const filtered = session.isAdmin
    ? warnings
    : warnings.filter(w => w.employee_email === session.user.email)

  // 직원별 경고 횟수 집계
  const countMap = {}
  warnings.forEach(w => {
    countMap[w.employee_id] = (countMap[w.employee_id] || 0) + 1
  })

  const result = filtered.map(w => ({
    ...w,
    warningCount: countMap[w.employee_id] || 1,
  }))

  return Response.json(result)
}

/**
 * POST /api/warnings
 * 이사만 경고장 발행 가능
 * - Google Sheets 저장
 * - 직원 이메일 발송
 * - 직원 profile의 warning_count 자동 증가
 */
export async function POST(request) {
  const session = await getServerSession()
  if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json()
  const {
    employeeId, employeeName, employeeEmail, position,
    startDate, address, reason1, reason2, reason3,
  } = body

  const id = generateId()
  const today = new Date().toISOString().slice(0, 10)

  // 기존 경고 횟수 계산
  const existing = await readSheet(SHEET_ID)
  const prevCount = existing.filter(w => w.employee_id === employeeId).length
  const warningNumber = prevCount + 1

  const newWarning = {
    id,
    employee_id: employeeId,
    employee_name: employeeName,
    employee_email: employeeEmail,
    position,
    start_date: startDate,
    address,
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

  // 직원에게 경고장 이메일 발송
  await sendWarningEmail({
    to: employeeEmail,
    employeeName, position, warningNumber,
    reason1, reason2, reason3,
    directorName: session.user.name,
    issuedAt: today,
  })

  return Response.json({ success: true, warning: newWarning })
}

/**
 * PATCH /api/warnings — 직원 확인 처리
 */
export async function PATCH(request) {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const today = new Date().toISOString().slice(0, 10)

  await updateRow(SHEET_ID, 'Sheet1', id, {
    status: 'acknowledged',
    acknowledged_at: today,
  })

  return Response.json({ success: true })
}

async function sendWarningEmail({ to, employeeName, position, warningNumber, reason1, reason2, reason3, directorName, issuedAt }) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  })
  const gmail = google.gmail({ version: 'v1', auth })

  const warningLabel = ['1차', '2차', '3차'][warningNumber - 1] || `${warningNumber}차`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Noto Sans Thai', sans-serif; background: #f4f6fb; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: #ef4444; padding: 28px 32px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">⚠️ หนังสือตักเตือน (${warningLabel} 경고)</h1>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">บริษัท ราอน(ไทยแลนด์) จำกัด</p>
    </div>
    <div style="padding: 24px 32px;">
      <p style="font-size: 14px; color: #374151; line-height: 1.8;">
        <strong>${employeeName}</strong> ท่าน<br>
        บริษัทออกหนังสือตักเตือน <strong>(${warningLabel})</strong> ในตำแหน่ง ${position}
      </p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #dc2626;">สาเหตุ:</p>
        <p style="margin: 0; font-size: 13px; color: #374151;">${reason1}</p>
        ${reason2 ? `<p style="margin: 4px 0 0; font-size: 13px; color: #374151;">${reason2}</p>` : ''}
        ${reason3 ? `<p style="margin: 4px 0 0; font-size: 13px; color: #374151;">${reason3}</p>` : ''}
      </div>
      <p style="font-size: 13px; color: #6b7280;">วันที่ออกหนังสือ: ${issuedAt}</p>
      <a href="${process.env.NEXTAUTH_URL}/warnings" style="display: inline-block; padding: 10px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px;">
        ✓ ระบบ — กดเพื่อรับทราบหนังสือตักเตือน
      </a>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
      กรรมการบริษัท: ${directorName} | RAON WMS
    </div>
  </div>
</body>
</html>`

  const message = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `To: ${to}`,
    `Subject: [RAON] ⚠️ หนังสือตักเตือน ${warningLabel} — ${employeeName}`,
    '',
    html,
  ].join('\n')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(message).toString('base64url') },
  })
}
