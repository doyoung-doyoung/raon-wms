import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import SalaryCertificatePDF from '../../../../lib/pdf/salaryCertificate'
import { uploadPDFToDrive } from '../../../../lib/google/drive'

export async function POST(request) {
  try {
    const data = await request.json()

    const pdfBuffer = await renderToBuffer(
      React.createElement(SalaryCertificatePDF, { data })
    )

    const today = new Date().toISOString().slice(0, 10)
    const fileName = `${data.nameEn}_재직증명서_${today}.pdf`

    const { fileId, driveUrl } = await uploadPDFToDrive(
      pdfBuffer,
      fileName,
      '재직증명서'
    )

    return NextResponse.json({
      success: true,
      fileName,
      fileId,
      driveUrl,
      pdfBase64: pdfBuffer.toString('base64'),
    })
  } catch (error) {
    console.error('salary-certificate error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}