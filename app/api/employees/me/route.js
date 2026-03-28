import { NextResponse } from 'next/server'
import { auth } from '../../../api/auth/[...nextauth]/route'
import { readSheet } from '../../../../lib/google/sheets'

const SHEET_ID = process.env.SHEETS_EMPLOYEES_ID

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employees = await readSheet(SHEET_ID)
    const me = employees.find(e => e.email === session.user.email)

    if (!me) {
      return NextResponse.json({ employee: null }, { status: 200 })
    }

    return NextResponse.json({ employee: me })
  } catch (error) {
    console.error('employees/me error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}