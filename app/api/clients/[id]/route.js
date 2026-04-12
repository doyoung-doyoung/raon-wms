import { auth } from '../../auth/[...nextauth]/route'
import { readSheet, updateRow } from '../../../../lib/google/sheets'

export const dynamic = 'force-dynamic'

const SHEET_ID   = process.env.SHEETS_CLIENTS_ID
const SHEET_NAME = 'Sheet1'

export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const clients = await readSheet(SHEET_ID, SHEET_NAME)
    const client  = clients.find(c => c.id === id)
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 })

    await updateRow(SHEET_ID, SHEET_NAME, id, {
      ...client,
      name:           body.name           ?? client.name,
      address:        body.address        ?? client.address,
      tax_id:         body.taxId          ?? client.tax_id,
      email:          body.email          ?? client.email,
      tel:            body.tel            ?? client.tel,
      type:           body.type           ?? client.type,
      currency:       body.currency       ?? client.currency,
      contact_person: body.contactPerson  ?? client.contact_person,
      notes:          body.notes          ?? client.notes,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH client error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
