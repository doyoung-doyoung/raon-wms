import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'

const SHEET_ID = process.env.SHEETS_ATTENDANCE_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const email = searchParams.get('email')

    const records = await readSheet(SHEET_ID)

    let filtered = records.filter(r => r.date === date)

    if (!session.isAdmin) {
      filtered = filtered.filter(r => r.employee_id === session.user.email)
    }

    if (email && session.isAdmin) {
      filtered = filtered.filter(r => r.employee_id === email)
    }

    return Response.json(filtered)
  } catch (error) {
    console.error('GET attendance error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type } = body
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5)

    const records = await readSheet(SHEET_ID)

    const todayRecord = records.find(r =>
      r.employee_id === session.user.email && r.date === today
    )

    if (type === 'checkin') {
      if (todayRecord) {
        return Response.json({ error: '이미 출근 처리되었습니다.' }, { status: 400 })
      }

      const newRecord = {
        id:            generateId(),
        employee_id:   session.user.email,
        employee_name: session.user.name,
        date:          today,
        check_in:      time,
        check_out:     '',
        work_type:     'office',
        ip_address:    '',
        gps_lat:       '',
        gps_lng:       '',
        note:          '',
        custom_1: '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
        custom_6: '', custom_7: '', custom_8: '', custom_9: '', custom_10: '',
      }

      await appendRow(SHEET_ID, 'Sheet1', newRecord)
      return Response.json({ success: true, record: newRecord })
    }

    if (type === 'checkout') {
      if (!todayRecord) {
        return Response.json({ error: '출근 기록이 없습니다.' }, { status: 400 })
      }
      if (todayRecord.check_out) {
        return Response.json({ error: '이미 퇴근 처리되었습니다.' }, { status: 400 })
      }

      await updateRow(SHEET_ID, 'Sheet1', todayRecord.id, {
        check_out:  time,
        work_type: 'completed',
      })

      return Response.json({ success: true })
    }

    return Response.json({ error: '잘못된 요청' }, { status: 400 })
  } catch (error) {
    console.error('POST attendance error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}