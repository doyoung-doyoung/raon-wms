import { NextResponse } from 'next/server'
import { readSheet, updateRow } from '../../../../lib/google/sheets'
import { generateSalaryCertificate, generatePayslip } from '../../../../lib/pdf/generate.js'
import { uploadPDFToDrive } from '../../../../lib/google/drive'
import { sendMail } from '../../../../lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.SHEETS_DOCUMENTS_ID
const SHEET_NAME = '문서발급요청'
const EMP_SHEET_ID = process.env.SHEETS_EMPLOYEES_ID

export async function POST(request) {
  try {
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

    // 관리자 이름 (directorId는 이메일)
    const adminName = process.env.ADMIN_NAME || 'Doyoung Jung'
    const adminRole = 'Managing Director'

    let pdfBuffer, fileName, folderName

    if (req.documentType === 'salary-certificate') {
      const data = {
        issueDate: issueDateTh,
        issueDateEn: issueDateEn,
        nameTh: emp.name_th || emp.name_ko || emp.name,
        nameEn: emp.name_en || emp.name,
        employeeId: emp.id,
        idCardAddress: emp.idCardAddress || emp.address || '-',
        currentAddress: emp.currentAddress || emp.address || '-',
        startDateTh: emp.start_date || '-',
        startDateEn: emp.start_date || '-',
        position: emp.position,
        salary: emp.salary,
        directorName: adminName,
        directorRole: adminRole,
      }
      pdfBuffer = await generateSalaryCertificate(data)
      fileName = `${emp.name_en || emp.name_ko}_재직증명서_${now.toISOString().slice(0,10)}.pdf`
      folderName = '재직증명서'

    } else if (req.documentType === 'payslip') {
      const data = {
        periodTh: `${thaiMonths[now.getMonth()]} ${thaiYear}`,
        periodEn: `${enMonths[now.getMonth()]} ${now.getFullYear()}`,
        payDateTh: issueDateTh,
        nameTh: emp.name_th || emp.name_ko || emp.name,
        nameEn: emp.name_en || emp.name,
        employeeId: emp.id,
        position: emp.position,
        startDateTh: emp.start_date || '-',
        startDateEn: emp.start_date || '-',
        baseSalary: Number(emp.salary) || 0,
        housing: 0, transport: 0, meal: 0, ot: 0, otherIncome: 0,
        tax: 0, socialSecurity: 750, otherDeduction: 0,
        directorName: adminName,
        directorRole: adminRole,
      }
      pdfBuffer = await generatePayslip(data)
      fileName = `${emp.name_en || emp.name_ko}_월급명세서_${now.toISOString().slice(0,10)}.pdf`
      folderName = '월급명세서'
    }

    const { driveUrl } = await uploadPDFToDrive(pdfBuffer, fileName, folderName)

    await updateRow(SHEET_ID, SHEET_NAME, requestId, {
      ...req,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: directorId,
      driveUrl,
      fileName,
    })

    if (emp.email) {
      await sendMail({
        to: emp.email,
        subject: `[RAON] ${req.documentType === 'salary-certificate' ? '재직증명서' : '월급명세서'} 발급 완료`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4f62f7;">서류 발급 완료</h2>
            <p>안녕하세요, <strong>${emp.name_th || emp.name_ko}</strong>님!</p>
            <p>요청하신 <strong>${req.documentType === 'salary-certificate' ? '재직증명서' : '월급명세서'}</strong>가 발급되었습니다.</p>
            <div style="margin: 20px 0;">
              <a href="${driveUrl}" style="background: #4f62f7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                Google Drive에서 보기
              </a>
            </div>
            <p style="color: #888; font-size: 12px;">RAON (Thailand) Co., Ltd.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true, driveUrl, fileName })
  } catch (error) {
    console.error('approve error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}