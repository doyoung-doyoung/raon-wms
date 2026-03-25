import { getServerSession } from 'next-auth'
import { google } from 'googleapis'

/**
 * POST /api/reports/send-email
 * 이사에게 리포트 이메일 발송
 * - 수동 호출 or 자동 월간 스케줄러에서 호출
 */
export async function POST(request) {
  const session = await getServerSession()

  // 이사 또는 시스템 내부 호출만 허용
  const body = await request.json().catch(() => ({}))
  const isSystemCall = body.systemKey === process.env.REPORT_SYSTEM_KEY
  const isAdmin = session?.isAdmin

  if (!isAdmin && !isSystemCall) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { year, month } = body
  const reportYear = year || new Date().getFullYear()
  const reportMonth = month || new Date().getMonth() // 전월

  try {
    // TODO: Google Sheets에서 실제 데이터 집계
    const reportData = await aggregateReportData(reportYear, reportMonth)
    const emailHtml = buildReportEmailHtml(reportData)

    // Gmail API로 발송
    await sendReportEmail(emailHtml, reportData.period)

    return Response.json({ success: true, period: reportData.period })
  } catch (error) {
    console.error('Report send error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function aggregateReportData(year, month) {
  // TODO: 실제 Google Sheets 데이터 집계
  // const employees = await readSheet(process.env.SHEETS_EMPLOYEES_ID)
  // const leaves = await readSheet(process.env.SHEETS_LEAVES_ID)
  // ...

  return {
    period: month ? `${year}년 ${month}월` : `${year}년 연간`,
    employees: { total: 0, active: 0, newHires: 0 },
    leaves: { annual: 0, sick: 0, personal: 0 },
    warnings: 0,
    documents: 0,
    invoices: { count: 0, totalTHB: 0, totalUSD: 0 },
  }
}

function buildReportEmailHtml(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Sans KR', 'Noto Sans Thai', sans-serif; background: #f4f6fb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f62f7, #7c3aed); padding: 32px 36px; color: white; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; opacity: 0.8; font-size: 14px; }
    .body { padding: 28px 36px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat { background: #f8faff; border: 1px solid #e5e9ff; border-radius: 10px; padding: 14px 16px; }
    .stat-value { font-size: 20px; font-weight: 700; color: #4f62f7; }
    .stat-label { font-size: 12px; color: #9ca3af; margin-top: 3px; }
    .footer { background: #f8faff; padding: 20px 36px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e9ff; }
    .btn { display: inline-block; padding: 10px 24px; background: #4f62f7; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 16px; }
    .warning-badge { display: inline-block; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${data.period} 업무 리포트</h1>
      <p>RAON Work Management System — 이사 전용</p>
    </div>
    <div class="body">
      <div class="section">
        <h2>👥 직원 현황</h2>
        <div class="grid">
          <div class="stat"><div class="stat-value">${data.employees.total}명</div><div class="stat-label">전체 직원</div></div>
          <div class="stat"><div class="stat-value">${data.employees.active}명</div><div class="stat-label">재직 중</div></div>
          <div class="stat"><div class="stat-value">${data.employees.newHires}명</div><div class="stat-label">신규 입사</div></div>
        </div>
      </div>
      <div class="section">
        <h2>🗓️ 휴가 현황</h2>
        <div class="grid">
          <div class="stat"><div class="stat-value">${data.leaves.annual}일</div><div class="stat-label">연차 사용</div></div>
          <div class="stat"><div class="stat-value">${data.leaves.sick}일</div><div class="stat-label">병가 사용</div></div>
          <div class="stat"><div class="stat-value">${data.leaves.personal}일</div><div class="stat-label">경조사 사용</div></div>
        </div>
      </div>
      ${data.warnings > 0 ? `
      <div class="section">
        <h2>⚠️ 경고장</h2>
        <p>이번 기간 <span class="warning-badge">${data.warnings}건</span>의 경고장이 발행되었습니다. 시스템에서 확인해주세요.</p>
      </div>` : ''}
      <div class="section">
        <h2>💼 회계 현황</h2>
        <div class="grid">
          <div class="stat"><div class="stat-value">${data.invoices.count}건</div><div class="stat-label">인보이스 발행</div></div>
          <div class="stat"><div class="stat-value">฿${data.invoices.totalTHB.toLocaleString()}</div><div class="stat-label">매출 (THB)</div></div>
          <div class="stat"><div class="stat-value">$${data.invoices.totalUSD.toLocaleString()}</div><div class="stat-label">매출 (USD)</div></div>
        </div>
      </div>
      <a href="${process.env.NEXTAUTH_URL}/reports" class="btn">📊 전체 리포트 보기</a>
    </div>
    <div class="footer">
      이 이메일은 RAON WMS에서 자동으로 발송되었습니다. 매월 1일에 자동 발송됩니다.<br>
      문의: ${process.env.COMPANY_EMAIL || 'raonthailand23@gmail.com'}
    </div>
  </div>
</body>
</html>`
}

async function sendReportEmail(html, period) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  })

  const gmail = google.gmail({ version: 'v1', auth })
  const adminEmail = process.env.ADMIN_EMAIL

  const message = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `To: ${adminEmail}`,
    `Subject: [RAON WMS] ${period} 업무 리포트`,
    '',
    html,
  ].join('\n')

  const encoded = Buffer.from(message).toString('base64url')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })
}
