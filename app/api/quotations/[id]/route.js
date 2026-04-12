import { auth } from '../../auth/[...nextauth]/route'
import { readSheet, updateRow } from '../../../../lib/google/sheets'
import { generateQuotationPdf } from '../../../../lib/pdf/generate'
import { sendMail } from '../../../../lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SHEET_ID   = process.env.SHEETS_QUOTATIONS_ID
const SHEET_NAME = 'Sheet1'

async function generateInvoiceNumber() {
  const records = await readSheet(SHEET_ID, SHEET_NAME)
  const year    = new Date().getFullYear()
  const pfx     = `INV-${year}-`
  const nums    = records
    .filter(r => (r.invoice_number || '').startsWith(pfx))
    .map(r => parseInt(r.invoice_number.slice(pfx.length)) || 0)
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `${pfx}${String(max + 1).padStart(3, '0')}`
}

function buildPdfData(q, docType) {
  return {
    docType,
    docNumber:    q.number,
    invoiceNumber: q.invoice_number,
    docDate:      new Date().toISOString().slice(0, 10),
    clientType:   q.client_type,
    currency:     q.currency,
    client: {
      name:    q.client_name,
      address: q.client_address,
      taxId:   q.client_tax_id,
      email:   q.client_email,
      tel:     q.client_tel,
    },
    items:                JSON.parse(q.items || '[]'),
    managementFeeRate:    Number(q.management_fee_rate    || 0),
    managementFeeAmount:  Number(q.management_fee_amount  || 0),
    subtotal:             Number(q.subtotal    || 0),
    vatAmount:            Number(q.vat_amount  || 0),
    whtAmount:            Number(q.wht_amount  || 0),
    grandTotal:           Number(q.grand_total || 0),
    paymentDays:          Number(q.payment_days || 3),
    remark:               q.remark || '',
    issuedBy:             q.created_by_name || '',
    paidAt:               q.paid_at   || '',
    paidNote:             q.paid_note || '',
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const q   = all.find(r => r.id === id)
    if (!q) return Response.json({ error: 'Not found' }, { status: 404 })

    if (!session.isAdmin && q.created_by_email !== session.user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ ...q, items: JSON.parse(q.items || '[]') })
  } catch (error) {
    console.error('GET quotation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id }   = await params
    const body     = await request.json()
    const { action } = body

    const all = await readSheet(SHEET_ID, SHEET_NAME)
    const q   = all.find(r => r.id === id)
    if (!q) return Response.json({ error: 'Not found' }, { status: 404 })

    if (!session.isAdmin && q.created_by_email !== session.user.email &&
        action !== 'director_approve' && action !== 'director_reject') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()

    // ── 견적서 내용 수정 (draft 상태에서만) ──
    if (action === 'update') {
      if (q.status !== 'draft') {
        return Response.json({ error: '초안 상태에서만 수정할 수 있습니다.' }, { status: 400 })
      }
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q,
        client_name:           body.clientName           ?? q.client_name,
        client_address:        body.clientAddress        ?? q.client_address,
        client_tax_id:         body.clientTaxId          ?? q.client_tax_id,
        client_email:          body.clientEmail          ?? q.client_email,
        client_tel:            body.clientTel            ?? q.client_tel,
        client_id:             body.clientId             ?? q.client_id,
        items:                 body.items ? JSON.stringify(body.items) : q.items,
        management_fee_rate:   body.managementFeeRate   != null ? String(body.managementFeeRate)   : q.management_fee_rate,
        management_fee_amount: body.managementFeeAmount != null ? String(body.managementFeeAmount) : q.management_fee_amount,
        subtotal:              body.subtotal   != null ? String(body.subtotal)   : q.subtotal,
        vat_amount:            body.vatAmount  != null ? String(body.vatAmount)  : q.vat_amount,
        wht_amount:            body.whtAmount  != null ? String(body.whtAmount)  : q.wht_amount,
        grand_total:           body.grandTotal != null ? String(body.grandTotal) : q.grand_total,
        payment_days:          body.paymentDays != null ? String(body.paymentDays) : q.payment_days,
        remark:                body.remark ?? q.remark,
        updated_at:            now,
      })
      return Response.json({ success: true })
    }

    // ── 이사 승인 요청 ──
    if (action === 'request_approval') {
      if (q.status !== 'draft') {
        return Response.json({ error: '초안 상태에서만 승인을 요청할 수 있습니다.' }, { status: 400 })
      }
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q, status: 'pending_director', updated_at: now,
      })
      return Response.json({ success: true })
    }

    // ── 이사 승인 ──
    if (action === 'director_approve') {
      if (!session.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })
      if (q.status !== 'pending_director') {
        return Response.json({ error: '승인 대기 상태가 아닙니다.' }, { status: 400 })
      }
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q,
        status:                 'approved',
        director_approved_by:   session.user.email,
        director_approved_at:   now,
        director_reject_reason: '',
        updated_at:             now,
      })
      return Response.json({ success: true })
    }

    // ── 이사 반려 ──
    if (action === 'director_reject') {
      if (!session.isAdmin) return Response.json({ error: 'Admin only' }, { status: 403 })
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q,
        status:                 'draft',
        director_reject_reason: body.reason || '',
        updated_at:             now,
      })
      return Response.json({ success: true })
    }

    // ── 고객 서명 완료 ──
    if (action === 'customer_approve') {
      if (q.status !== 'approved') {
        return Response.json({ error: '이사 승인 후 고객 서명을 처리할 수 있습니다.' }, { status: 400 })
      }
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q, status: 'customer_approved', customer_approved_at: now, updated_at: now,
      })
      return Response.json({ success: true })
    }

    // ── 인보이스로 전환 ──
    if (action === 'to_invoice') {
      if (q.status !== 'customer_approved') {
        return Response.json({ error: '고객 서명 완료 후 인보이스를 발행할 수 있습니다.' }, { status: 400 })
      }
      const invNumber = await generateInvoiceNumber()
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q,
        status:         'invoiced',
        invoice_number: invNumber,
        invoiced_at:    now,
        updated_at:     now,
      })
      return Response.json({ success: true, invoice_number: invNumber })
    }

    // ── 결제 완료 ──
    if (action === 'paid') {
      if (q.status !== 'invoiced') {
        return Response.json({ error: '인보이스 발행 후 결제 처리할 수 있습니다.' }, { status: 400 })
      }
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q,
        status:     'paid',
        paid_at:    now,
        paid_note:  body.paidNote || '',
        updated_at: now,
      })
      return Response.json({ success: true })
    }

    // ── 취소 ──
    if (action === 'cancel') {
      await updateRow(SHEET_ID, SHEET_NAME, id, {
        ...q, status: 'cancelled', updated_at: now,
      })
      return Response.json({ success: true })
    }

    // ── PDF 이메일 발송 ──
    if (action === 'send_email') {
      const docType = q.status === 'paid' ? 'receipt'
        : (q.status === 'invoiced' ? 'invoice' : 'quotation')

      const pdfData  = buildPdfData(q, docType)
      const pdfBuffer = await generateQuotationPdf(pdfData)

      const emailTo  = body.email || q.client_email
      if (!emailTo) return Response.json({ error: '이메일 주소를 입력해주세요.' }, { status: 400 })

      const labels   = { quotation: 'Quotation', invoice: 'Invoice', receipt: 'Receipt' }
      const docLabel = labels[docType]
      const docNum   = docType === 'quotation' ? q.number : q.invoice_number

      await sendMail({
        to: emailTo,
        subject: `[RAON] ${docLabel} ${docNum} — ${q.client_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e2235; padding: 28px; border-radius: 12px; color: #fff;">
              <h2 style="margin: 0; font-size: 18px;">RAON (Thailand) Co., Ltd.</h2>
              <p style="margin: 4px 0 0; color: #8b91ab; font-size: 13px;">${docLabel} Attached</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 28px; margin-top: 10px;">
              <p style="color: #1e293b; font-size: 15px;">Dear <strong>${q.client_name}</strong>,</p>
              <p style="color: #475569;">Please find attached the <strong>${docLabel} (${docNum})</strong> from RAON (Thailand) Co., Ltd.</p>
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">${docLabel} No.</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${docNum}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Amount</td>
                    <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${Number(q.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${q.currency}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #475569; font-size: 13px;">For any questions, please contact us at raonthailand23@gmail.com or +66(0)62 124 7979.</p>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
              RAON (Thailand) Co., Ltd. | raonthailand23@gmail.com
            </p>
          </div>
        `,
        attachments: [{
          filename: `${docLabel}-${docNum}.pdf`,
          content:  pdfBuffer,
          contentType: 'application/pdf',
        }],
      })

      return Response.json({ success: true })
    }

    // ── PDF 다운로드 (base64 반환) ──
    if (action === 'get_pdf') {
      const docType = q.status === 'paid' ? 'receipt'
        : (q.status === 'invoiced' ? 'invoice' : 'quotation')
      const pdfData   = buildPdfData(q, docType)
      const pdfBuffer = await generateQuotationPdf(pdfData)
      const base64    = pdfBuffer.toString('base64')
      const labels    = { quotation: 'Quotation', invoice: 'Invoice', receipt: 'Receipt' }
      const docNum    = docType === 'quotation' ? q.number : q.invoice_number
      return Response.json({
        success: true,
        pdf: base64,
        filename: `${labels[docType]}-${docNum}.pdf`,
      })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('PATCH quotation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
