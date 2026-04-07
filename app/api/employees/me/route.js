import { auth } from '../../auth/[...nextauth]/route'
import { readSheet } from '../../../../lib/google/sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const employees = await readSheet(process.env.SHEETS_EMPLOYEES_ID)
    const me = employees.find(e => e.email === session.user.email)

    if (!me) return Response.json({ error: 'Employee not found' }, { status: 404 })

    return Response.json(me)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
