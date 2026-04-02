import { NextResponse } from 'next/server'
import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, generateId } from '../../../lib/google/sheets'
import { generateAnnouncement } from '../../../lib/pdf/generate.js'
import { sendMail } from '../../../lib/email'

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

    // 전체 직원 이메일 발송
    const employees = await readSheet(EMP_SHEET_ID, 'Sheet1')
    const emailList = employees
      .map(e => e.email)
      .filter(e => e && e.includes('@'))

    for (const email of emailList) {
      await sendMail({
        to: email,
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
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #64748b; font-size: 12px;">${issueDateTh}</p>
              <p style="color: #64748b; font-size: 12px;">${directorName} | กรรมการบริษัท</p>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
              RAON (Thailand) Co., Ltd. | 349 อาคารเอสเจ ชั้นที่ 29 | raonthailand23@gmail.com
            </p>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ],
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
