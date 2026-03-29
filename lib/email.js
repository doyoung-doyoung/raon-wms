import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendLeaveStatusEmail({ to, name, leaveType, startDate, endDate, days, status, rejectedReason }) {
  const leaveTypeLabel = {
    annual:   '연차',
    sick:     '병가',
    personal: '경조사',
    unpaid:   '무급휴가',
  }[leaveType] || leaveType

  const statusLabel = status === 'approved' ? '승인' : '반려'
  const statusColor = status === 'approved' ? '#22c55e' : '#ef4444'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background: #1e2235; border-radius: 12px; padding: 32px; color: #f1f3f9;">
        <h1 style="margin: 0 0 8px; font-size: 20px; color: #f1f3f9;">RAON Co., Ltd.</h1>
        <p style="margin: 0; color: #8b91ab; font-size: 13px;">휴가 신청 결과 안내</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 32px; margin-top: 12px;">
        <p style="font-size: 16px; color: #1e293b;">안녕하세요, <strong>${name}</strong>님</p>
        <p style="color: #475569;">신청하신 휴가가 <strong style="color: ${statusColor};">${statusLabel}</strong>되었습니다.</p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">휴가 종류</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${leaveTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">기간</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${startDate} ~ ${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">일수</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${days}일</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">상태</td>
              <td style="padding: 8px 0; font-weight: 600; color: ${statusColor};">${statusLabel}</td>
            </tr>
            ${rejectedReason ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">반려 사유</td>
              <td style="padding: 8px 0; color: #ef4444;">${rejectedReason}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="color: #475569; font-size: 13px;">문의사항이 있으시면 관리자에게 연락해주세요.</p>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
        RAON Co., Ltd. | ${process.env.COMPANY_ADDRESS}
      </p>
    </div>
  `

  await transporter.sendMail({
    from: `"RAON WMS" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[RAON] 휴가 신청 ${statusLabel} 안내 - ${leaveTypeLabel} (${startDate} ~ ${endDate})`,
    html,
  })
}

export async function sendMail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"RAON WMS" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}