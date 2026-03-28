import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import PayslipPDF from '../../../../lib/pdf/payslip'
import { uploadPDFToDrive } from '../../../../lib/google/drive'

export async function POST(request) {
  try {
    const data = await request.json()

    const pdfBuffer = await renderToBuffer(
      React.createElement(PayslipPDF, { data })
    )

    const today = new Date().toISOString().slice(0, 10)
    const fileName = `${data.nameEn}_월급명세서_${data.periodEn}_${today}.pdf`

    const { fileId, driveUrl } = await uploadPDFToDrive(
      pdfBuffer,
      fileName,
      '월급명세서'
    )

    return NextResponse.json({
      success: true,
      fileName,
      fileId,
      driveUrl,
      pdfBase64: pdfBuffer.toString('base64'),
    })
  } catch (error) {
    console.error('payslip error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}