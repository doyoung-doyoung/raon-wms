import React from 'react'
import { StyleSheet, Text, View } from '@react-pdf/renderer'

export const COMPANY_HEADER = {
  name: ' บริษัท ราอน(ไทยแลนด์) จำกัด ',
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
    fontFamily: 'Sarabun',
    marginBottom: 4,
  },
  companyAddr: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.7,
    fontFamily: 'Sarabun',
  },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: '28%',
    fontSize: 120,
    color: '#000000',
    opacity: 0.05,
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
  if (!n || isNaN(n)) return 'ศูนย์บาทถ้วน'
  const num = Math.floor(Number(n))
  if (num === 0) return 'ศูนย์บาทถ้วน'
  
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  
  function convert(n) {
    if (n === 0) return ''
    if (n < 10) return digits[n]
    if (n < 100) {
      const ten = Math.floor(n / 10)
      const one = n % 10
      const tenStr = ten === 1 ? 'สิบ' : ten === 2 ? 'ยี่สิบ' : digits[ten] + 'สิบ'
      return tenStr + (one > 0 ? digits[one] : '')
    }
    if (n < 1000) return digits[Math.floor(n/100)] + 'ร้อย' + convert(n % 100)
    if (n < 10000) return digits[Math.floor(n/1000)] + 'พัน' + convert(n % 1000)
    if (n < 100000) return digits[Math.floor(n/10000)] + 'หมื่น' + convert(n % 10000)
    if (n < 1000000) return digits[Math.floor(n/100000)] + 'แสน' + convert(n % 100000)
    return convert(Math.floor(n/1000000)) + 'ล้าน' + convert(n % 1000000)
  }
  
  return convert(num) + 'บาทถ้วน'
}
