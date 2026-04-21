import { auth } from '../../auth/[...nextauth]/route'
import { readSheet, updateRow } from '../../../../lib/google/sheets'

export const dynamic = 'force-dynamic'

const SHEET_ID   = process.env.SHEETS_PARTNERS_ID
const SHEET_NAME = 'Sheet1'

export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    const partners = await readSheet(SHEET_ID, SHEET_NAME)
    const partner  = partners.find(p => p.id === id)
    if (!partner) return Response.json({ error: 'Partner not found' }, { status: 404 })

    await updateRow(SHEET_ID, SHEET_NAME, id, {
      ...partner,
      name:             body.name             ?? partner.name,
      category:         body.category         ?? partner.category,
      type:             body.type             ?? partner.type,
      currency:         body.currency         ?? partner.currency,
      contact_person:   body.contactPerson    ?? partner.contact_person,
      email:            body.email            ?? partner.email,
      tel:              body.tel              ?? partner.tel,
      address:          body.address          ?? partner.address,
      tax_id:           body.taxId            ?? partner.tax_id,
      bank_name:        body.bankName         ?? partner.bank_name,
      bank_account:     body.bankAccount      ?? partner.bank_account,
      bank_beneficiary: body.bankBeneficiary  ?? partner.bank_beneficiary,
      bank_branch:      body.bankBranch       ?? partner.bank_branch,
      swift_code:       body.swiftCode        ?? partner.swift_code,
      notes:            body.notes            ?? partner.notes,
      status:           body.status           ?? partner.status,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH partner error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
