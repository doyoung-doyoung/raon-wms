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

  return Buffer.from(stdout, 'base64')
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
