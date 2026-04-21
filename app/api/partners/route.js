import { auth } from '../auth/[...nextauth]/route'
import { readSheet, appendRow, generateId } from '../../../lib/google/sheets'

export const dynamic = 'force-dynamic'

const SHEET_ID   = process.env.SHEETS_PARTNERS_ID
const SHEET_NAME = 'Sheet1'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const partners = await readSheet(SHEET_ID, SHEET_NAME)
    return Response.json(partners)
  } catch (error) {
    console.error('GET partners error:', error)
    return Response.json([], { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })

    const body = await request.json()
    const {
      name, category, type, currency,
      contactPerson, email, tel, address, taxId,
      bankName, bankAccount, bankBeneficiary, bankBranch, swiftCode,
      notes,
    } = body

    if (!name?.trim()) {
      return Response.json({ error: 'Partner name is required.' }, { status: 400 })
    }

    const resolvedType     = type || 'domestic'
    const resolvedCurrency = currency || (resolvedType === 'domestic' ? 'THB' : 'USD')

    const partner = {
      id:               generateId(),
      name:             name.trim(),
      category:         category         || '',
      type:             resolvedType,
      currency:         resolvedCurrency,
      contact_person:   contactPerson    || '',
      email:            email            || '',
      tel:              tel              || '',
      address:          address          || '',
      tax_id:           taxId            || '',
      bank_name:        bankName         || '',
      bank_account:     bankAccount      || '',
      bank_beneficiary: bankBeneficiary  || '',
      bank_branch:      bankBranch       || '',
      swift_code:       swiftCode        || '',
      notes:            notes            || '',
      status:           'active',
      created_by:       session.user.email,
      created_at:       new Date().toISOString().slice(0, 10),
    }

    await appendRow(SHEET_ID, SHEET_NAME, partner)
    return Response.json({ success: true, partner })
  } catch (error) {
    console.error('POST partners error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
