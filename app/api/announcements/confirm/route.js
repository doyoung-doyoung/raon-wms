import { NextResponse } from 'next/server'
import { readSheet, updateRow } from '../../../../lib/google/sheets'
import { createHmac } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.SHEETS_DOCUMENTS_ID
const SHEET_NAME = 'Announcements'

function verifyToken(token) {
  const lastDash = token.lastIndexOf('-')
  if (lastDash === -1) return null
  const announcementId = token.slice(0, lastDash)
  const provided = token.slice(lastDash + 1)
  const expected = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret')
    .update(announcementId).digest('hex').slice(0, 20)
  if (provided !== expected) return null
  return announcementId
}

// GET: 토큰으로 공지 정보 조회 (공개)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const announcementId = verifyToken(token)
    if (!announcementId) return NextResponse.json({ error: 'Invalid link.' }, { status: 404 })

    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const item = all.find(r => r.id === announcementId)
    if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    return NextResponse.json({ id: item.id, title: item.title, content: item.content, createdAt: item.createdAt })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST: 직원이 확인 버튼 클릭 (공개, 로그인 불필요)
export async function POST(request) {
  try {
    const { token, employeeName, employeeEmail } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const announcementId = verifyToken(token)
    if (!announcementId) return NextResponse.json({ error: 'Invalid link.' }, { status: 404 })

    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const item = all.find(r => r.id === announcementId)
    if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const now = new Date().toISOString()
    // confirmed_by: JSON array of { name, email, confirmedAt }
    const existing = JSON.parse(item.confirmed_by || '[]')
    if (existing.some(e => e.email === employeeEmail)) {
      return NextResponse.json({ success: true, alreadyConfirmed: true })
    }
    existing.push({ name: employeeName || '', email: employeeEmail || '', confirmedAt: now })

    await updateRow(SHEET_ID, SHEET_NAME, item.id, {
      ...item,
      confirmed_by: JSON.stringify(existing),
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
