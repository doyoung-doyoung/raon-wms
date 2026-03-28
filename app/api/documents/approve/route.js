import { NextResponse } from 'next/server'
import { readSheet, updateRow } from '../../../../lib/google/sheets'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import SalaryCertificatePDF from '../../../../lib/pdf/salaryCertificate'
import PayslipPDF from '../../../../lib/pdf/payslip'
import { uploadPDFToDrive } from '../../../../lib/google/drive'
import { sendMail } from '../../../../lib/email'

const SHEET_ID = process.env.SHEETS_DOCUMENTS_ID
const SHEET_NAME = '문서발급요청'
const EMP_SHEET_ID = process.env.SHEETS_EMPLOYEES_ID

export async function POST(request) {
  try {
    const body = await request.json()
    const { requestId, approved, directorId, rejectReason } = body

    // 요청 정보 가져오기
    const requests = await readSheet(SHEET_ID, SHEET_NAME)
    const req = requests.find(r => r.id === requestId)
    if (!req) return NextResponse.json({ success: false, error: '요청을 찾을 수 없어요.' }, { status: 404 })

    // 반려 처리
    if (!approved) {
      await updateRow(SHEET_ID, SHEET_NAME, requestId, {
        ...req,
        status: 'rejected',
        approvedAt: new Date().toISOString(),
        approvedBy: directorId,
      })
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    // 직원 정보 가져오기
    const employees = await readSheet(EMP_SHEET_ID, 'employees')
    const emp = employees.find(e => e.id === req.employeeId)
    if (!emp) return NextResponse.json({ success: false, error: '직원 정보를 찾을 수 없어요.' }, { status: 404 })

    const directors = await readSheet(EMP_SHEET_ID, 'employees')
    const director = directors.find(e => e.id === directorId)

    // 날짜 포맷
    const now = new Date()
    const thaiYear = now.getFullYear() + 543
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
    const enMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const issueDateTh = `${now.getDate()} ${thaiMonths[now.getMonth()]} ${thaiYear}`
    const issueDateEn = `${now.getDate()} ${enMonths[now.getMonth()]} ${now.getFullYear()}`

    let pdfBuffer, fileName, folderName

    // 문서 종류별 PDF 생성
    if (req.documentType === 'salary-certificate') {
      const data = {
        issueDate: issueDateTh,
        issueDateEn: issueDateEn,
        nameTh: emp.nameTh || emp.name,
        nameEn: emp.nameEn || emp.name,
        employeeId: emp.employeeId || emp.id,
        idCardAddress: emp.idCardAddress || '-',
        currentAddress: emp.currentAddress || '-',
        startDateTh: emp.startDateTh || emp.startDate,
        startDateEn: emp.startDateEn || emp.startDate,
        position: emp.position,
        salary: emp.salary,
        directorName: director?.nameEn || director?.name,
        directorRole: director?.position || 'Managing Director',
      }
      pdfBuffer = await renderToBuffer(React.createElement(SalaryCertificatePDF, { data }))
      fileName = `${emp.nameEn}_재직증명서_${now.toISOString().slice(0,10)}.pdf`
      folderName = '재직증명서'

    } else if (req.documentType === 'payslip') {
      const data = {
        periodTh: `${thaiMonths[now.getMonth()]} ${thaiYear}`,
        periodEn: `${enMonths[now.getMonth()]} ${now.getFullYear()}`,
        payDateTh: issueDateTh,
        nameTh: emp.nameTh || emp.name,
        nameEn: emp.nameEn || emp.name,
        employeeId: emp.employeeId || emp.id,
        position: emp.position,
        startDateTh: emp.startDateTh || emp.startDate,
        startDateEn: emp.startDateEn || emp.startDate,
        baseSalary: Number(emp.salary) || 0,
        housing: 0, transport: 0, meal: 0, ot: 0, otherIncome: 0,
        tax: 0, socialSecurity: 750, otherDeduction: 0,
        directorName: director?.nameEn || director?.name,
        directorRole: director?.position || 'Managing Director',
      }
      pdfBuffer = await renderToBuffer(React.createElement(PayslipPDF, { data }))
      fileName = `${emp.nameEn}_월급명세서_${now.toISOString().slice(0,10)}.pdf`
      folderName = '월급명세서'
    }

    // Drive 업로드
    const { driveUrl } = await uploadPDFToDrive(pdfBuffer, fileName, folderName)

    // Sheets 업데이트
    await updateRow(SHEET_ID, SHEET_NAME, requestId, {
      ...req,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: directorId,
      driveUrl,
      fileName,
    })

    // 이메일 발송
    if (emp.email) {
      await sendMail({
        to: emp.email,
        subject: `[RAON] ${req.documentType === 'salary-certificate' ? '재직증명서' : '월급명세서'} 발급 완료`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4f62f7;">서류 발급 완료</h2>
            <p>안녕하세요, <strong>${emp.nameTh || emp.name}</strong>님!</p>
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