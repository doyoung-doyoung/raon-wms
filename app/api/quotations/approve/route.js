import { createHmac } from 'crypto'
import { readSheet, updateRow } from '../../../../lib/google/sheets'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SHEET_ID   = process.env.SHEETS_QUOTATIONS_ID
const SHEET_NAME = 'Sheet1'

function verifyToken(token) {
  const lastDash = token.lastIndexOf('-')
  if (lastDash === -1) return null
  const quotationId = token.slice(0, lastDash)
  const providedHmac = token.slice(lastDash + 1)
  const expectedHmac = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret').update(quotationId).digest('hex').slice(0, 24)
  if (providedHmac !== expectedHmac) return null
  return quotationId
}

// GET: 토큰으로 견적서 정보 조회 (공개)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return Response.json({ error: 'Token required' }, { status: 400 })

    const quotationId = verifyToken(token)
    if (!quotationId) return Response.json({ error: 'Invalid or expired link.' }, { status: 404 })

    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const q   = all.find(r => r.id === quotationId)
    if (!q) return Response.json({ error: 'Invalid or expired link.' }, { status: 404 })
    if (q.status !== 'approved') {
      return Response.json({ error: 'This quotation has already been processed.' }, { status: 400 })
    }

    return Response.json({
      id:          q.id,
      number:      q.number,
      client_name: q.client_name,
      grand_total: q.grand_total,
      currency:    q.currency,
      items:       JSON.parse(q.items || '[]'),
      subtotal:    q.subtotal,
      vat_amount:  q.vat_amount,
      wht_amount:  q.wht_amount,
      management_fee_amount: q.management_fee_amount,
      remark:      q.remark,
      status:      q.status,
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST: 고객이 토큰으로 승인 (공개, 로그인 불필요)
export async function POST(request) {
  try {
    const { token, approverName } = await request.json()
    if (!token) return Response.json({ error: 'Token required' }, { status: 400 })

    const quotationId = verifyToken(token)
    if (!quotationId) return Response.json({ error: 'Invalid or expired link.' }, { status: 404 })

    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const q   = all.find(r => r.id === quotationId)
    if (!q) return Response.json({ error: 'Invalid or expired link.' }, { status: 404 })
    if (q.status !== 'approved') {
      return Response.json({ error: 'This quotation has already been processed.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    await updateRow(SHEET_ID, SHEET_NAME, q.id, {
      ...q,
      status:               'customer_approved',
      customer_approved_at: now,
      customer_name:        approverName || q.client_name,
      updated_at:           now,
    })

    return Response.json({ success: true, quotationNumber: q.number })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
