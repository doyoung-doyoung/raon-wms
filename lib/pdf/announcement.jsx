import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { DocHeader, Watermark } from './utils.jsx'
import path from 'path'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Sarabun',
    position: 'relative',
  },
  date: {
    textAlign: 'right',
    fontSize: 10,
    color: '#666666',
    marginBottom: 16,
  },
  docTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  topicRow: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 11,
  },
  topicLabel: {
    width: 60,
    fontWeight: 'bold',
  },
  topicValue: {
    flex: 1,
  },
  toRow: {
    flexDirection: 'row',
    marginBottom: 20,
    fontSize: 11,
  },
  toLabel: {
    width: 60,
    fontWeight: 'bold',
  },
  toValue: {
    flex: 1,
  },
  contentBlock: {
    fontSize: 11,
    lineHeight: 2,
    marginBottom: 10,
    textIndent: 30,
  },
  signSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    paddingTop: 16,
  },
  signLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  companyBox: {
    alignItems: 'center',
    width: '45%',
  },
  sigImage: {
    width: 90,
    height: 45,
    objectFit: 'contain',
    marginBottom: 2,
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaaaaa',
    width: 160,
    marginBottom: 4,
  },
  sigName: {
    fontSize: 10,
    textAlign: 'center',
    width: 160,
  },
  sigRole: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    width: 160,
  },
  empSignTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  empBox: {
    borderWidth: 0.5,
    borderColor: '#cccccc',
    width: 90,
    height: 18,
    marginRight: 8,
  },
  empNameLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#999999',
    width: 140,
    marginRight: 8,
  },
  empPosLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#999999',
    width: 100,
  },
  empLabel: {
    fontSize: 9,
    color: '#666666',
    marginRight: 4,
  },
})

export default function AnnouncementPDF({ data }) {
  const {
    issueDate, title, content,
    directorName, directorRole,
  } = data

  const sigPath = path.join(process.cwd(), 'public', 'signature.jpg')

  const paragraphs = (content || '').split('\n').filter(p => p.trim())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <DocHeader />

        <Text style={styles.date}>{(issueDate || '') + ' '}</Text>

        <Text style={styles.docTitle}>{'ประกาศ '}</Text>

        <View style={styles.topicRow}>
          <Text style={styles.topicLabel}>{'เรื่อง '}</Text>
          <Text style={styles.topicValue}>{(title || '') + ' '}</Text>
        </View>
        <View style={styles.toRow}>
          <Text style={styles.toLabel}>{'เรียน '}</Text>
          <Text style={styles.toValue}>{'พนักงานทุกท่าน '}</Text>
        </View>

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.contentBlock}>{p + ' '}</Text>
        ))}

        <View style={styles.signSection}>
          <Text style={styles.signLabel}>{'ลงรายมือชื่อ เพื่อเป็นการรับทราบเนื้อหา '}</Text>

          <View style={styles.companyRow}>
            <View style={styles.companyBox}>
              <Text style={{ fontSize: 10, color: '#666666', marginBottom: 6 }}>{'บริษัท '}</Text>
              <Image style={styles.sigImage} src={sigPath} />
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>{(directorName || '') + ' '}</Text>
              <Text style={styles.sigRole}>{(directorRole || 'กรรมการบริษัท') + ' '}</Text>
            </View>
          </View>

          <Text style={styles.empSignTitle}>{'พนักงาน '}</Text>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.empRow}>
              <View style={styles.empBox} />
              <Text style={styles.empLabel}> </Text>
              <View style={styles.empNameLine} />
              <Text style={styles.empLabel}>{'ตำแหน่ง '}</Text>
              <View style={styles.empPosLine} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
