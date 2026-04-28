import { NextResponse } from 'next/server'
import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, generateId } from '../../../lib/google/sheets'
import { generateAnnouncement } from '../../../lib/pdf/generate.js'
import { sendMail } from '../../../lib/email'
import { createHmac } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.SHEETS_DOCUMENTS_ID
const SHEET_NAME = 'Announcements'
const EMP_SHEET_ID = process.env.SHEETS_EMPLOYEES_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const announcements = await readSheet(SHEET_ID, SHEET_NAME)
    // 최신순 정렬, 고정공지 먼저
    const sorted = announcements.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned === 'true' ? -1 : 1
      return b.createdAt.localeCompare(a.createdAt)
    })
    return NextResponse.json(sorted)
  } catch (error) {
    console.error('GET announcements error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) {
      return NextResponse.json({ error: '이사만 공지를 등록할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, pinned } = body

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
    }

    const now = new Date()
    const thaiYear = now.getFullYear() + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const issueDateTh = `วันที่ ${now.getDate()} ${thaiMonths[now.getMonth()]} พ.ศ. ${thaiYear}`

    const newItem = {
      id: generateId(),
      title,
      content,
      author: session.user.name || 'Director',
      authorEmail: session.user.email || '',
      authorImage: session.user.image || '',
      pinned: pinned ? 'true' : 'false',
      createdAt: now.toISOString().slice(0, 10),
      confirmed_by: '[]',
    }

    // Sheets에 저장
    await appendRow(SHEET_ID, SHEET_NAME, newItem)

    // PDF 생성
    const directorName = process.env.ADMIN_NAME || 'Doyoung Jung'
    const pdfBuffer = await generateAnnouncement({
      issueDate: issueDateTh,
      title,
      content,
      directorName,
      directorRole: 'กรรมการบริษัท (Managing Director)',
    })

    const fileName = `announcement_${now.toISOString().slice(0, 10)}_${newItem.id}.pdf`

    // 직원별 확인 토큰 생성
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const makeConfirmUrl = (empEmail) => {
      const hmac = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret')
        .update(newItem.id).digest('hex').slice(0, 20)
      const token = `${newItem.id}-${hmac}`
      return `${baseUrl}/announce-confirm/${token}?email=${encodeURIComponent(empEmail)}`
    }

    // 전체 직원 이메일 발송
    const employees = await readSheet(EMP_SHEET_ID, 'Sheet1')
    const emailList = employees
      .map(e => ({ email: e.email, name: e.name_th || e.name_ko || e.name_en || '' }))
      .filter(e => e.email && e.email.includes('@'))

    for (const emp of emailList) {
      const confirmUrl = makeConfirmUrl(emp.email)
      await sendMail({
        to: emp.email,
        subject: `[RAON] ประกาศ / 공지사항: ${title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
            <div style="background: #1e2235; border-radius: 12px; padding: 32px; color: #f1f3f9;">
              <h1 style="margin: 0 0 8px; font-size: 20px; color: #f1f3f9;">RAON (Thailand) Co., Ltd.</h1>
              <p style="margin: 0; color: #8b91ab; font-size: 13px;">ประกาศ / 공지사항</p>
            </div>
            <div style="background: white; border-radius: 12px; padding: 32px; margin-top: 12px;">
              <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
              <p style="color: #475569; white-space: pre-wrap; line-height: 1.8;">${content}</p>
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #15803d; font-weight: 600; margin: 0 0 8px;">ยืนยันการรับทราบประกาศ / 공지 확인</p>
                <p style="color: #166534; font-size: 13px; margin: 0 0 16px;">กรุณากดปุ่มด้านล่างเพื่อยืนยันว่าท่านได้รับทราบประกาศนี้แล้ว</p>
                <a href="${confirmUrl}" style="display: inline-block; background: #22c55e; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">✓ รับทราบ / 확인했습니다</a>
              </div>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #64748b; font-size: 12px;">${issueDateTh}</p>
              <p style="color: #64748b; font-size: 12px;">${directorName} | กรรมการบริษัท</p>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
              RAON (Thailand) Co., Ltd. | 349 อาคารเอสเจ ชั้นที่ 29 | raonthailand23@gmail.com
            </p>
          </div>
        `,
        attachments: [{ filename: fileName, content: pdfBuffer, contentType: 'application/pdf' }],
      })
    }

    return NextResponse.json({
      success: true,
      announcement: newItem,
      emailsSent: emailList.length,
    })
  } catch (error) {
    console.error('POST announcements error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
