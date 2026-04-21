import { auth } from '../../auth/[...nextauth]/route'
import { readSheet } from '../../../../lib/google/sheets'

const LEAVES_SHEET_ID    = process.env.SHEETS_LEAVES_ID
const EMPLOYEES_SHEET_ID = process.env.SHEETS_EMPLOYEES_ID

// 근무년수로 연차 한도 계산 (6일 시작, 매년 +1일, 최대 20일)
function getAnnualLimit(startDate) {
  if (!startDate) return 6
  const start = new Date(startDate)
  const today = new Date()
  const years = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 365))
  return Math.min(6 + years, 20)
}

const LIMITS = {
  sick:     30,
  personal:  3,
}

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || session.user.email
    const year  = searchParams.get('year')  || new Date().getFullYear().toString()

    // 관리자만 다른 직원 조회 가능
    if (email !== session.user.email && !session.isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 직원 정보에서 입사일 가져오기
    const employees = await readSheet(EMPLOYEES_SHEET_ID)
    const employee  = employees.find(e => e.email === email)
    const startDate = employee?.start_date || null
    const annualLimit = getAnnualLimit(startDate)

    // 휴가 내역 가져오기
    const leaves = await readSheet(LEAVES_SHEET_ID)

    // 해당 직원 + 해당 연도 + 승인된 것만
    const myLeaves = leaves.filter(l =>
      l.employee_email === email &&
      l.status === 'approved' &&
      l.start_date?.startsWith(year)
    )

    // 종류별 사용 일수 합산
    const used = { annual: 0, sick: 0, personal: 0 }
    myLeaves.forEach(l => {
      const type = l.leave_type
      if (used[type] !== undefined) {
        used[type] += Number(l.days) || 0
      }
    })

    // 잔여 일수 계산
    const balance = {
      annual: {
        limit:     annualLimit,
        used:      used.annual,
        remaining: Math.max(0, annualLimit - used.annual),
        startDate,
      },
      sick: {
        limit:     LIMITS.sick,
        used:      used.sick,
        remaining: Math.max(0, LIMITS.sick - used.sick),
      },
      personal: {
        limit:     LIMITS.personal,
        used:      used.personal,
        remaining: Math.max(0, LIMITS.personal - used.personal),
      },
    }

    return Response.json({ balance, year, email })
  } catch (error) {
    console.error('GET balance error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}