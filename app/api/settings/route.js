import { auth } from '../auth/[...nextauth]/route'
import { getSettingsCache, setSettingsCache } from '../../../lib/settingsCache'

export const dynamic = 'force-dynamic'

export const DEFAULT_SETTINGS = {
  menuItems: {
    announcements: { labelTh: 'ประกาศ', labelKo: '공지사항', icon: '📢', href: '/announcements', visible: true },
    attendance:    { labelTh: 'เวลาทำงาน', labelKo: '출퇴근', icon: '⏰', href: '/attendance', visible: true },
    leaves:        { labelTh: 'การลา', labelKo: '휴가/병가', icon: '🗓️', href: '/leaves', visible: true },
    expenses:      { labelTh: 'ค่าใช้จ่าย', labelKo: '경비 청구', icon: '💰', href: '/expenses', visible: true },
    documents:     { labelTh: 'เอกสารของฉัน', labelKo: '내 서류함', icon: '📄', href: '/documents/my-documents', visible: true },
    warnings:      { labelTh: 'หนังสือเตือน', labelKo: '경고장', icon: '⚠️', href: '/warnings', visible: false },
  },
  officeLocation: {
    lat: '13.8199',
    lng: '100.5601',
    radius: 20,
    enabled: false,
  },
  checkInTime: '09:00',
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    return Response.json(getSettingsCache() || DEFAULT_SETTINGS)
  } catch {
    return Response.json(DEFAULT_SETTINGS)
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const body = await request.json()
    setSettingsCache(body)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
