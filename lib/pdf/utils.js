import { StyleSheet, Text, View, Image } from '@react-pdf/renderer'

export const COMPANY_HEADER = {
  name: 'บริษัท ราอน(ไทยแลนด์) จำกัด',
  addr1: '349 อาคารเอสเจ อินฟินิท วัน บิสซิเนส คอมเพล็กซ์ ชั้นที่ 29 ห้องเลขที่ 2901-2907',
  addr2: 'ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร',
  addr3: 'โทร 062-124-7979 | raonthailand23@gmail.com',
}

export const headerStyles = StyleSheet.create({
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
    marginBottom: 14,
  },
  companyName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyAddr: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.7,
  },
  watermark: {
    position: 'absolute',
    top: '42%',
    left: '20%',
    fontSize: 90,
    color: '#000000',
    opacity: 0.03,
    transform: 'rotate(-30deg)',
  },
})

export function DocHeader() {
  return (
    <View style={headerStyles.header}>
      <Text style={headerStyles.companyName}>{COMPANY_HEADER.name}</Text>
      <Text style={headerStyles.companyAddr}>{COMPANY_HEADER.addr1}</Text>
      <Text style={headerStyles.companyAddr}>{COMPANY_HEADER.addr2}</Text>
      <Text style={headerStyles.companyAddr}>{COMPANY_HEADER.addr3}</Text>
    </View>
  )
}

export function Watermark() {
  return (
    <Text style={headerStyles.watermark} fixed>
      RAON
    </Text>
  )
}

export function numToThaiWords(n) {
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
  if (n === 0) return 'ศูนย์บาทถ้วน'
  let result = ''
  const s = String(Math.floor(n)).split('').reverse()
  for (let i = s.length - 1; i >= 0; i--) {
    const d = parseInt(s[i])
    if (d === 0) continue
    if (d === 1 && i === 1) result += 'สิบ'
    else if (d === 2 && i === 1) result += 'ยี่สิบ'
    else result += digits[d] + units[i]
  }
  return result + 'บาทถ้วน'
}