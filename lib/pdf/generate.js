import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)

async function generatePDF(type, data) {
  const scriptPath = path.join(process.cwd(), 'scripts/generate-pdf.js')
  const tsxPath = path.join(process.cwd(), 'node_modules/.bin/tsx')
  const input = JSON.stringify({ type, data })

  const { stdout, stderr } = await execFileAsync(
    tsxPath,
    [scriptPath, input],
    { maxBuffer: 10 * 1024 * 1024 }
  )

  if (stderr) {
    throw new Error(`PDF 생성 실패: ${stderr}`)
  }

  const result = JSON.parse(stdout)
  const buffer = Buffer.from(result.pdf, 'base64')
  buffer.pageCount = result.pages || 1
  return buffer
}

export async function generateSalaryCertificate(data) {
  return generatePDF('salary-certificate', data)
}

export async function generatePayslip(data) {
  return generatePDF('payslip', data)
}

export async function generateAnnouncement(data) {
  return generatePDF('announcement', data)
}

export async function generateWarningLetter(data) {
  return generatePDF('warning-letter', data)
}

export async function generateLeaveApproval(data) {
  return generatePDF('leave-approval', data)
}

export async function generateQuotationPdf(data) {
  return generatePDF(data.docType || 'quotation', data)
}
