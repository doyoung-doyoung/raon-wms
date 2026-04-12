import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, generateId } from '../../../lib/google/sheets'

export const dynamic = 'force-dynamic'

const SHEET_ID   = process.env.SHEETS_CLIENTS_ID
const SHEET_NAME = 'Sheet1'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const clients = await readSheet(SHEET_ID, SHEET_NAME)
    return Response.json(clients)
  } catch (error) {
    console.error('GET clients error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, address, taxId, email, tel, type, currency, contactPerson, notes } = body

    if (!name?.trim()) {
      return Response.json({ error: 'Client name is required.' }, { status: 400 })
    }

    const resolvedType     = type || 'domestic'
    const resolvedCurrency = currency || (resolvedType === 'domestic' ? 'THB' : 'USD')

    const client = {
      id:             generateId(),
      name:           name.trim(),
      address:        address || '',
      tax_id:         taxId || '',
      email:          email || '',
      tel:            tel || '',
      type:           resolvedType,
      currency:       resolvedCurrency,
      contact_person: contactPerson || '',
      notes:          notes || '',
      created_by:     session.user.email,
      created_at:     new Date().toISOString().slice(0, 10),
    }

    await appendRow(SHEET_ID, SHEET_NAME, client)
    return Response.json({ success: true, client })
  } catch (error) {
    console.error('POST clients error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
