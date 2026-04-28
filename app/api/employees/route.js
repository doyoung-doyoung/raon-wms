import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, updateRow, generateId } from '../../../lib/google/sheets'

const SHEET_ID = process.env.SHEETS_EMPLOYEES_ID

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) {
      return Response.json({ error: 'Admin only' }, { status: 403 })
    }
    const employees = await readSheet(SHEET_ID)
    return Response.json(employees)
  } catch (error) {
    console.error('GET employees error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) {
      return Response.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const id = generateId()
    const today = new Date().toISOString().slice(0, 10)

    const startDate = new Date(body.start_date)
    const probationEnd = new Date(startDate)
    probationEnd.setDate(probationEnd.getDate() + 90)

    const newEmployee = {
      id,
      name_ko:            body.name_ko || '',
      name_th:            body.name_th || '',
      name_en:            body.name_en || '',
      email:              body.email || '',
      phone:              body.phone || '',
      address:            body.address || '',
      position:           body.position || '',
      department:         body.department || '',
      start_date:         body.start_date || today,
      probation_end_date: probationEnd.toISOString().slice(0, 10),
      status:             'probation',
      salary:             body.salary || '',
      bank_account:       body.bank_account || '',
      bank_name:          body.bank_name || '',
      national_id:        body.national_id || '',
      emergency_contact:  body.emergency_contact || '',
      custom_1: body.custom_1 || '', custom_2: '', custom_3: '', custom_4: '', custom_5: '',
      custom_6: '', custom_7: '', custom_8: '', custom_9: '', custom_10: '',
    }

    await appendRow(SHEET_ID, 'Sheet1', newEmployee)
    return Response.json({ success: true, employee: newEmployee })
  } catch (error) {
    console.error('POST employee error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) {
      return Response.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    await updateRow(SHEET_ID, 'Sheet1', id, updateData)
    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH employee error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}