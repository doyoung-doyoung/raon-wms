import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'
import { getSettingsCache } from '../../../lib/settingsCache'
import { DEFAULT_SETTINGS } from '../settings/route'

const SHEET_ID = process.env.SHEETS_ATTENDANCE_ID

// GPS 거리 계산 (미터)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const month = searchParams.get('month') // YYYY-MM
    const email = searchParams.get('email')

    const records = await readSheet(SHEET_ID)
    let filtered

    if (month) {
      filtered = records.filter(r => r.date && r.date.startsWith(month))
    } else {
      const targetDate = date || new Date().toISOString().slice(0, 10)
      filtered = records.filter(r => r.date === targetDate)
    }

    if (!session.isAdmin) filtered = filtered.filter(r => r.employee_id === session.user.email)
    if (email && session.isAdmin) filtered = filtered.filter(r => r.employee_id === email)

    return Response.json(filtered)
  } catch (error) {
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, lat, lng } = body
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5)

    // 1. 승인된 휴가 중인지 체크
    try {
      const leaves = await readSheet(process.env.SHEETS_LEAVES_ID)
      const onLeave = leaves.find(l =>
        l.employee_email === session.user.email &&
        l.status === 'approved' &&
        l.start_date <= today &&
        l.end_date >= today
      )
      if (onLeave) {
        return Response.json({
          error: 'วันนี้คุณอยู่ในช่วงลา ไม่สามารถลงเวลาได้ / 오늘은 휴가 중입니다.',
        }, { status: 400 })
      }
    } catch {}

    // 2. GPS 위치 검증 (settings에서 활성화된 경우)
    const settings = getSettingsCache()
    const officeLocation = settings?.officeLocation

    if (officeLocation?.enabled) {
      if (!lat || !lng) {
        return Response.json({
          error: 'กรุณาอนุญาตการเข้าถึง GPS / GPS 위치를 허용해주세요',
        }, { status: 400 })
      }
      const dist = getDistance(parseFloat(lat), parseFloat(lng), parseFloat(officeLocation.lat), parseFloat(officeLocation.lng))
      if (dist > officeLocation.radius) {
        return Response.json({
          error: `อยู่นอกพื้นที่สำนักงาน (ห่าง ${Math.round(dist)}ม.) / 사무실 밖입니다 (${Math.round(dist)}m 거리)`,
          distance: Math.round(dist),
        }, { status: 400 })
      }
    }

    // 3. 출퇴근 처리
    const records = await readSheet(SHEET_ID)
    const todayRecord = records.find(r => r.employee_id === session.user.email && r.date === today)

    // 설정에서 출/퇴근 기준 시간 읽기
    const settingsData = settings || DEFAULT_SETTINGS
    const checkInTime  = settingsData.checkInTime  || '09:00'
    const checkOutTime = settingsData.checkOutTime || '18:00'

    if (type === 'checkin') {
      if (todayRecord) return Response.json({ error: 'ลงเวลาเข้างานแล้ว / 이미 출근했습니다.' }, { status: 400 })
      const isLate = time > checkInTime
      const newRecord = {
        id:            generateId(),
        employee_id:   session.user.email,
        employee_name: session.user.name,
        date:          today,
        check_in:      time,
        check_out:     '',
        is_late:       isLate ? 'true' : 'false',
        is_early:      'false',
        work_type:     'office',
        ip_address:    '',
        gps_lat:       lat ? String(lat) : '',
        gps_lng:       lng ? String(lng) : '',
        note:          '',
        custom_1: '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
        custom_6: '', custom_7: '', custom_8: '', custom_9: '', custom_10: '',
      }
      await appendRow(SHEET_ID, 'Sheet1', newRecord)
      return Response.json({ success: true, record: newRecord, isLate })
    }

    if (type === 'checkout') {
      if (!todayRecord) return Response.json({ error: 'ยังไม่ได้ลงเวลาเข้างาน / 출근 기록이 없습니다.' }, { status: 400 })
      if (todayRecord.check_out) return Response.json({ error: 'ลงเวลาออกงานแล้ว / 이미 퇴근했습니다.' }, { status: 400 })
      const isEarly = time < checkOutTime
      await updateRow(SHEET_ID, 'Sheet1', todayRecord.id, {
        check_out: time,
        is_early:  isEarly ? 'true' : 'false',
        work_type: 'completed',
      })
      return Response.json({ success: true, isEarly })
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
