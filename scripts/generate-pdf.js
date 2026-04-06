import { renderToBuffer, Font } from '@react-pdf/renderer'
import { createElement } from 'react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// 태국어 폰트 등록
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: path.join(rootDir, 'public/fonts/Sarabun-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(rootDir, 'public/fonts/Sarabun-Bold.ttf'), fontWeight: 'bold' },
  ]
})

const inputData = JSON.parse(process.argv[2])
const { type, data } = inputData

async function run() {
  try {
    let Component

    if (type === 'salary-certificate') {
      const mod = await import('../lib/pdf/salaryCertificate.jsx')
      Component = mod.default
    } else if (type === 'payslip') {
      const mod = await import('../lib/pdf/payslip.jsx')
      Component = mod.default
    } else if (type === 'announcement') {
      const mod = await import('../lib/pdf/announcement.jsx')
      Component = mod.default
    } else if (type === 'warning-letter') {
      const mod = await import('../lib/pdf/warningLetter.jsx')
      Component = mod.default
    }

    const element = createElement(Component, { data })
    const buffer = await renderToBuffer(element)

    process.stdout.write(buffer.toString('base64'))
    process.exit(0)
  } catch (err) {
    process.stderr.write(err.message)
    process.exit(1)
  }
}

run()