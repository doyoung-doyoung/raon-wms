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

// 태국어 단어 중간 줄바꿈 방지 + 마지막 글자 사라짐 방지
Font.registerHyphenationCallback(word => {
  // 단어를 통째로 반환 → 중간에서 끊지 않음
  return [word]
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

    // PDF 페이지 수 감지 (PDF /Count N 파싱)
    const pdfStr = buffer.toString('latin1')
    const countMatches = pdfStr.match(/\/Count\s+(\d+)/g) || []
    let pageCount = 1
    for (const m of countMatches) {
      const n = parseInt(m.replace(/\/Count\s+/, ''))
      if (n > pageCount) pageCount = n
    }

    const result = { pdf: buffer.toString('base64'), pages: pageCount }
    process.stdout.write(JSON.stringify(result))
    process.exit(0)
  } catch (err) {
    process.stderr.write(err.message)
    process.exit(1)
  }
}

run()