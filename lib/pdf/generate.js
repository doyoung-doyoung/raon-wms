import { renderToBuffer } from '@react-pdf/renderer'
import SalaryCertificatePDF from './salaryCertificate.js'
import PayslipPDF from './payslip.js'
import { createElement } from 'react'

export async function generateSalaryCertificate(data) {
  const element = createElement(SalaryCertificatePDF, { data })
  return await renderToBuffer(element)
}

export async function generatePayslip(data) {
  const element = createElement(PayslipPDF, { data })
  return await renderToBuffer(element)
}