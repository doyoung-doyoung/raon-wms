import { NextResponse } from 'next/server'
import { auth } from '../../auth/[...nextauth]/route'
import { readSheet, updateRow } from '../../../../lib/google/sheets'
import { generateSalaryCertificate, generatePayslip } from '../../../../lib/pdf/generate.js'
import { sendMail } from '../../../../lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.SHEETS_DOCUMENTS_ID
const SHEET_NAME = '문서발급요청'
const EMP_SHEET_ID = process.env.SHEETS_EMPLOYEES_ID
const PAYROLL_SHEET_ID = process.env.SHEETS_PAYROLL_ID

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 })

    const body = await request.json()
    const { requestId, approved, directorId } = body

    const requests = await readSheet(SHEET_ID, SHEET_NAME)
    const req = requests.find(r => r.id === requestId)
    if (!req) return NextResponse.json({ success: false, error: '요청을 찾을 수 없어요.' }, { status: 404 })

    if (!approved) {
      await updateRow(SHEET_ID, SHEET_NAME, requestId, {
        ...req,
        status: 'rejected',
        approvedAt: new Date().toISOString(),
        approvedBy: directorId,
      })
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    const employees = await readSheet(EMP_SHEET_ID, 'Sheet1')
    const emp = employees.find(e => e.id === req.employeeId)
    if (!emp) return NextResponse.json({ success: false, error: '직원 정보를 찾을 수 없어요.' }, { status: 404 })

    const now = new Date()
    const thaiYear = now.getFullYear() + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const enMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const issueDateTh = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${thaiYear}`
    const issueDateEn = `${now.getDate()} ${enMonths[now.getMonth()]} ${now.getFullYear()}`

    const adminName = process.env.ADMIN_NAME || 'Doyoung Jung'
    const adminRole = 'Managing Director'

    let pdfBuffer, fileName, docLabel

    if (req.documentType === 'salary-certificate') {
      const data = {
        issueDate: issueDateTh,
        issueDateEn: issueDateEn,
        nameTh: emp.name_th || emp.name_ko || emp.name,
        nameEn: emp.name_en || emp.name,
        employeeId: emp.national_id || emp.id,
        idCardAddress: emp.idCardAddress || emp.address || '-',
        currentAddress: emp.currentAddress || emp.address || '-',
        startDateTh: emp.start_date || '-',
        startDateEn: emp.start_date || '-',
        position: emp.position_en || emp.position,
        salary: emp.salary,
        directorName: adminName,
        directorRole: adminRole,
      }
      pdfBuffer = await generateSalaryCertificate(data)
      fileName = `${emp.name_en || emp.name_ko}_salary-certificate_${now.toISOString().slice(0,10)}.pdf`
      docLabel = 'หนังสือรับรองเงินเดือน (Salary Certificate)'

    } else if (req.documentType === 'payslip') {
      // 가장 최근 payroll 기록 조회 (해당 직원)
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      let payrollRecord = null
      if (PAYROLL_SHEET_ID) {
        try {
          const payrolls = await readSheet(PAYROLL_SHEET_ID)
          // 이번 달 먼저 찾고, 없으면 가장 최근 기록 사용
          const empPayrolls = payrolls.filter(p =>
            (p.employee_id === req.employeeId || p.employee_email === emp.email) && p.status !== 'deleted'
          )
          payrollRecord = empPayrolls.find(p => p.year_month === yearMonth)
            || empPayrolls.sort((a, b) => b.year_month.localeCompare(a.year_month))[0]
        } catch { /* payroll 없어도 기본값으로 진행 */ }
      }

      const data = {
        periodTh:   `${thaiMonths[now.getMonth()]} ${thaiYear}`,
        periodEn:   `${enMonths[now.getMonth()]} ${now.getFullYear()}`,
        payDateTh:  issueDateTh,
        nameTh:     emp.name_th || emp.name_ko || emp.name,
        nameEn:     emp.name_en || emp.name,
        employeeId: emp.national_id || emp.id,
        position:   emp.position,
        startDateTh: emp.start_date || '-',
        startDateEn: emp.start_date || '-',
        baseSalary:          Number(payrollRecord?.base_salary    || emp.salary || 0),
        housing:             Number(payrollRecord?.housing         || 0),
        transport:           Number(payrollRecord?.transport       || 0),
        meal:                Number(payrollRecord?.meal            || 0),
        ot:                  Number(payrollRecord?.ot              || 0),
        otherIncome:         Number(payrollRecord?.other_income    || 0),
        expenseReimbursement: Number(payrollRecord?.expense_total  || 0),
        tax:                 Number(payrollRecord?.tax             || 0),
        socialSecurity:      Number(payrollRecord?.social_security || 875),
        otherDeduction:      Number(payrollRecord?.other_deduction || 0),
        directorName: adminName,
        directorRole: adminRole,
      }
      pdfBuffer = await generatePayslip(data)
      fileName = `${emp.name_en || emp.name_ko}_payslip_${now.toISOString().slice(0,10)}.pdf`
      docLabel = 'สลิปเงินเดือน (Payslip)'
    }

    // Sheets 업데이트 (driveUrl 없이)
    await updateRow(SHEET_ID, SHEET_NAME, requestId, {
      ...req,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: directorId,
      driveUrl: '',
      fileName,
    })

    // PDF 이메일 첨부 발송
    if (emp.email) {
      await sendMail({
        to: emp.email,
        subject: `[RAON] ${docLabel} - Document Issued`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4f62f7;">Document Issued / เอกสารได้รับการอนุมัติแล้ว</h2>
            <p>เรียน คุณ <strong>${emp.name_th || emp.name_ko}</strong>,</p>
            <p>เอกสาร <strong>${docLabel}</strong> ของท่านได้รับการอนุมัติและออกให้เรียบร้อยแล้ว</p>
            <p>กรุณาตรวจสอบเอกสารแนบในอีเมลนี้</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #888; font-size: 12px;">RAON (Thailand) Co., Ltd.<br/>raonthailand23@gmail.com</p>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ],
      })
    }

    return NextResponse.json({ success: true, fileName })
  } catch (error) {
    console.error('approve error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}