/**
 * RAON WMS — 서류 템플릿 변수 매핑
 * 
 * 분석된 서류들의 {{변수}} 목록과 직원 DB 매핑
 * 
 * 서류 목록:
 * 1. สัญญาจ้าง (고용계약서)
 * 2. หนังสือรับรองเงินเดือน (재직증명서)
 * 3. ผ่านทดสอบงาน (수습 통과 통지서)
 * 4. ประกาศ (공지사항)
 * 5. ใบลาพักร้อน (휴가신청서 — 연차/병가/경조사 통합)
 * 6. ทวิ50 (원천징수 확인서)
 * 7. QUOTATION_thai / QUOTATION_usd (견적서)
 * 8. INVOICE_thai / INVOICE_usd (인보이스)
 */

// ======= HR 서류 공통 변수 (직원 DB에서 자동 채워짐) =======
export const EMPLOYEE_VARS = {
  '{{name}}':        'employee.name_th',       // 직원 이름 (태국어)
  '{{employeeId}}':  'employee.id',            // 직원 ID
  '{{address}}':     'employee.address',       // 주소
  '{{position}}':    'employee.position',      // 직책
  '{{startDate}}':   'employee.start_date',    // 입사일
  '{{salary}}':      'employee.salary',        // 월급
}

// ======= 서류 발행 시 입력하는 변수 =======
export const DOCUMENT_VARS = {
  '{{payDate}}':     '발행일 (자동: 오늘 날짜)',
  '{{Director name}}': '이사 이름 (자동: 이사 서명 + 이름)',
}

// ======= 고용계약서 추가 변수 =======
export const CONTRACT_VARS = {
  '{{starttime}}':        '근무 시작 시간 (예: 09:00)',
  '{{endtime}}':          '근무 종료 시간 (예: 18:00)',
  '{{lunchstarttime}}':   '점심 시작 (예: 12:00)',
  '{{lunchendtime}}':     '점심 종료 (예: 13:00)',
  '{{probationtday}}':    '수습 기간 일수 (예: 90)',
}

// ======= 수습 통과 통지서 추가 변수 =======
export const PROBATION_VARS = {
  '{{totalday}}': '수습 기간 총 일수 (자동 계산)',
}

// ======= 공지사항 변수 =======
export const ANNOUNCEMENT_VARS = {
  '{{topic}}':    '공지 제목',
  '{{content1}}': '공지 내용 1',
  '{{content2}}': '공지 내용 2',
  '{{content3}}': '공지 내용 3',
}

// ======= 휴가신청서 변수 =======
export const LEAVE_VARS = {
  '{{vacation type}}': '휴가 종류 (연차/병가/경조사)',
  '{{enddate}}':       '휴가 종료일',
  '{{total}}':         '총 휴가일수 (자동 계산)',
  '{{reason}}':        '휴가 사유',
  '{{approved type}}': '승인 여부 (승인/반려)',
  // 통계 (자동 계산)
  // 연차 사용/남은일수, 경조사, 병가 모두 자동
}

// ======= 견적서/인보이스 공통 변수 =======
export const QUOTATION_VARS = {
  // 파트너 정보 (Partners DB에서 자동)
  '{{buyerName}}':    'partner.name',
  '{{buyerAddress}}': 'partner.address',
  '{{buyerTaxId}}':   'partner.tax_id',
  '{{buyerEmail}}':   'partner.contact_email',
  '{{buyertel}}':     'partner.contact_phone',
  '{{currency}}':     'partner.currency (THB or USD)',
  '{{buyer1}}' : 'partner.custom_1',
  '{{buyer2}}' : 'partner.custom_2',
  // 추가 파트너 커스텀 필드: buyer3~buyer7

  // 발행 정보 (입력)
  '{{invoiceNumber}}':    '문서 번호 (자동 생성)',
  '{{invoiceDate}}':      '발행일 (자동: 오늘)',
  '{{Page no}}':          '페이지 번호',
  '{{payment day}}':      '결제 기한 일수 (예: 30)',

  // 품목 (입력)
  '{{itemName}}':         '품목명',
  '{{itemUnit}}':         '단위 수량',
  '{{unitPrice}}':        '단가',
  '{{itemDetail1}}':      '품목 상세 1',
  // itemDetail2 ~ itemDetail12

  // 수수료
  '{{managementFeeRate}}': '관리 수수료 비율',
}

// ======= 태국 견적서 세금 공식 =======
// Total Amount (A) = SUM(items)
// VAT 7% (B) = A * 0.07
// WHT 3% (C) = A * 0.03
// Grand Total = A + B - C

// ======= 해외(USD) 견적서 =======
// Total Amount (A) = SUM(items)  
// 세금 없음 (해외 거래)
// Grand Total = A

// ======= ทวิ50 변수 (PDF 양식) =======
export const TWI50_VARS = {
  // 지급자 (회사 정보 — 자동)
  payer_name:    'RAON (Thailand) Co., Ltd.',
  payer_address: '349 SJ Infinite One...',
  payer_tax_id:  '0105566006796',
  
  // 수급자 (직원 정보 — 자동)
  payee_name:    'employee.name_th',
  payee_address: 'employee.address',
  payee_tax_id:  'employee.national_id',

  // 급여 내역 (월별 자동 집계)
  salary_total:  '연간 총 급여',
  tax_withheld:  '원천징수액',
  social_insurance: '사회보험 기여금',
  provident_fund: '적립금',
}

// ======= 커스텀 필드 (시트 per 서류) =======
// 각 서류마다 custom_1 ~ custom_10 예비 필드 포함
// 향후 필드 추가 시 코드 수정 없이 대응 가능
export const CUSTOM_FIELDS = Array.from({ length: 10 }, (_, i) => `custom_${i + 1}`)
