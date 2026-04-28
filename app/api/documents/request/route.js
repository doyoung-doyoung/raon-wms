import { NextResponse } from 'next/server'
import { auth } from '../../auth/[...nextauth]/route'
import { readSheet, appendRow, generateId } from '../../../../lib/google/sheets'

const SHEET_ID = process.env.SHEETS_DOCUMENTS_ID
const SHEET_NAME = '문서발급요청'

// 요청 목록 가져오기
export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')

    const rows = await readSheet(SHEET_ID, SHEET_NAME)

    let filtered = rows
    if (!session.isAdmin) filtered = filtered.filter(r => r.employeeId === employeeId)
    else if (employeeId) filtered = filtered.filter(r => r.employeeId === employeeId)
    if (status) filtered = filtered.filter(r => r.status === status)

    return NextResponse.json({ success: true, requests: filtered })
  } catch (error) {
    console.error('document request GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// 새 발급 요청
export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      employeeId,
      employeeNameTh,
      employeeNameEn,
      documentType,
      requestNote,
    } = body

    const id = generateId()
    const now = new Date().toISOString()

    await appendRow(SHEET_ID, SHEET_NAME, {
      id,
      employeeId,
      employeeNameTh,
      employeeNameEn,
      documentType,
      requestNote: requestNote || '',
      status: 'pending',
      requestedAt: now,
      approvedAt: '',
      approvedBy: '',
      driveUrl: '',
      fileName: '',
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('document request POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}