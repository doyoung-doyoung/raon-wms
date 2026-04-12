import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, generateId } from '../../../lib/google/sheets'

export const dynamic = 'force-dynamic'

const SHEET_ID   = process.env.SHEETS_QUOTATIONS_ID
const SHEET_NAME = 'Sheet1'

async function generateNumber(prefix) {
  const records = await readSheet(SHEET_ID, SHEET_NAME)
  const year    = new Date().getFullYear()
  const pfx     = `${prefix}-${year}-`
  const nums    = records
    .filter(r => (r.number || '').startsWith(pfx))
    .map(r => parseInt(r.number.slice(pfx.length)) || 0)
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `${pfx}${String(max + 1).padStart(3, '0')}`
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const filtered = session.isAdmin
      ? all
      : all.filter(q => q.created_by_email === session.user.email)

    return Response.json(filtered)
  } catch (error) {
    console.error('GET quotations error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      clientType, currency,
      clientId, clientName, clientAddress, clientTaxId, clientEmail, clientTel,
      items,
      managementFeeRate, managementFeeAmount,
      subtotal, vatAmount, whtAmount, grandTotal,
      paymentDays, remark,
    } = body

    if (!clientName?.trim()) {
      return Response.json({ error: 'Client name is required.' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return Response.json({ error: 'At least one item is required.' }, { status: 400 })
    }

    const number = await generateNumber('QT')
    const now    = new Date().toISOString()

    const record = {
      id:                    generateId(),
      number,
      client_type:           clientType    || 'domestic',
      currency:              currency      || 'THB',
      client_id:             clientId      || '',
      client_name:           clientName    || '',
      client_address:        clientAddress || '',
      client_tax_id:         clientTaxId   || '',
      client_email:          clientEmail   || '',
      client_tel:            clientTel     || '',
      items:                 JSON.stringify(items || []),
      management_fee_rate:   String(managementFeeRate   || 0),
      management_fee_amount: String(managementFeeAmount || 0),
      subtotal:              String(subtotal   || 0),
      vat_amount:            String(vatAmount  || 0),
      wht_amount:            String(whtAmount  || 0),
      grand_total:           String(grandTotal || 0),
      payment_days:          String(paymentDays || 3),
      remark:                remark || '',
      status:                'draft',
      created_by_email:      session.user.email,
      created_by_name:       session.user.name || session.user.email,
      director_approved_by:   '',
      director_approved_at:   '',
      director_reject_reason: '',
      customer_approved_at:   '',
      invoice_number:         '',
      invoiced_at:            '',
      paid_at:                '',
      paid_note:              '',
      created_at:             now,
      updated_at:             now,
    }

    await appendRow(SHEET_ID, SHEET_NAME, record)
    return Response.json({ success: true, quotation: record })
  } catch (error) {
    console.error('POST quotations error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
