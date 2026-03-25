# RAON Work Management System (WMS)
## 전체 설치 가이드

---

## 📁 STEP 1 — 프로젝트 생성

VS Code 열고, Terminal 열어 (Ctrl + `)
아래 명령어 순서대로 붙여넣기:

```bash
npx create-next-app@latest raon-wms
```

물어보는 질문 답변:
```
✔ Would you like to use TypeScript? → No
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → No
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias? → No
```

```bash
cd raon-wms
```

---

## 📦 STEP 2 — 패키지 설치

```bash
npm install next-auth@beta
npm install googleapis
npm install @googleapis/drive
npm install zustand
npm install date-fns
npm install react-calendar
npm install jspdf
npm install jspdf-autotable
npm install docx
npm install next-intl
npm install react-hot-toast
npm install lucide-react
npm install @headlessui/react
npm install clsx
```

---

## 🔑 STEP 3 — Google Cloud Console 설정

### 3-1. 프로젝트 생성
1. https://console.cloud.google.com 접속
2. 상단 "프로젝트 선택" → "새 프로젝트"
3. 프로젝트 이름: `raon-wms`
4. "만들기" 클릭

### 3-2. API 활성화
왼쪽 메뉴 → "API 및 서비스" → "라이브러리"
아래 API 검색해서 각각 "사용" 클릭:
- Google Drive API
- Google Sheets API
- Google Calendar API
- Gmail API
- Google Docs API

### 3-3. OAuth 클라이언트 ID 생성
1. "API 및 서비스" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 처음이라면 "동의 화면 구성" 먼저:
   - User Type: "내부" (회사 내부용)
   - 앱 이름: RAON WMS
   - 저장 후 뒤로
4. 애플리케이션 유형: "웹 애플리케이션"
5. 이름: RAON WMS
6. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/api/auth/callback/google`
   - (나중에 실서버 URL도 추가)
7. "만들기" → Client ID, Client Secret 복사해두기!

### 3-4. 서비스 계정 생성 (Google Sheets/Drive 자동화용)
1. "사용자 인증 정보" → "+ 사용자 인증 정보 만들기" → "서비스 계정"
2. 이름: `raon-wms-service`
3. 역할: "편집자"
4. 만들어진 서비스 계정 클릭 → "키" 탭 → "키 추가" → JSON
5. 다운로드된 JSON 파일 → 프로젝트 루트에 `service-account.json` 으로 저장
6. ⚠️ .gitignore에 반드시 추가!

---

## ⚙️ STEP 4 — 환경변수 설정

프로젝트 루트에 `.env.local` 파일 만들고:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=여기에_랜덤_문자열_넣기

# Google OAuth (3-3에서 복사한 값)
GOOGLE_CLIENT_ID=여기에_클라이언트_ID
GOOGLE_CLIENT_SECRET=여기에_클라이언트_시크릿

# 이사(승인자) Google 이메일
ADMIN_EMAIL=이사_구글_이메일@gmail.com

# 회사명
COMPANY_NAME=RAON
COMPANY_NAME_FULL=RAON Co., Ltd.

# Google Sheets DB (나중에 생성 후 추가)
SHEETS_EMPLOYEES_ID=
SHEETS_LEAVES_ID=
SHEETS_ATTENDANCE_ID=
SHEETS_INVOICES_ID=

# Google Drive 폴더 ID (나중에 생성 후 추가)
DRIVE_ROOT_FOLDER_ID=
DRIVE_DOCUMENTS_FOLDER_ID=
DRIVE_SIGNATURE_FOLDER_ID=
```

NEXTAUTH_SECRET 랜덤 생성하려면 터미널에:
```bash
openssl rand -base64 32
```

---

## 📊 STEP 5 — Google Sheets DB 설정

Google Sheets 에서 아래 시트들 만들기:
(각각 새 스프레드시트 → 공유 → 서비스 계정 이메일에 편집 권한)

### 시트 1: Employees (직원 DB)
컬럼: id | name_ko | name_th | name_en | email | phone | address | position | department | start_date | probation_end_date | status | salary | bank_account | bank_name | national_id | emergency_contact | custom_1~10

### 시트 2: Leaves (휴가 DB)
컬럼: id | employee_id | leave_type | start_date | end_date | days | reason | status | attachment_url | approved_by | approved_at | is_paid | deduction_amount | custom_1~10

### 시트 3: Attendance (출퇴근 DB)
컬럼: id | employee_id | date | check_in | check_out | work_type | ip_address | gps_lat | gps_lng | note | custom_1~10

### 시트 4: Documents (서류 발행 DB)
컬럼: id | employee_id | doc_type | created_at | approved_at | drive_url | status | custom_1~10

### 시트 5: Invoices (인보이스 DB)
컬럼: id | partner_id | type | status | issue_date | due_date | subtotal | vat | total | currency | drive_url | custom_1~10

### 시트 6: Partners (파트너 DB)
컬럼: id | name | tax_id | address | contact_name | contact_email | contact_phone | bank_account | bank_name | type | custom_1~10

### 시트 7: Expenses (경비 DB)
컬럼: id | employee_id | date | category | amount | description | receipt_url | status | approved_by | custom_1~10

---

## 📁 STEP 6 — Google Drive 폴더 구조

Drive에 아래 폴더 구조 만들기:
```
📁 RAON WMS (루트)
├── 📁 Documents
│   ├── 📁 Contracts (고용계약서)
│   ├── 📁 Payslips (급여명세서)
│   ├── 📁 Leave_Forms (휴가신청서)
│   ├── 📁 Invoices (인보이스)
│   └── 📁 Archive (ZIP 아카이브)
├── 📁 Signatures (이사 서명 이미지)
└── 📁 Receipts (영수증)
```

각 폴더 ID를 .env.local에 추가

---

## ▶️ STEP 7 — 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속!

---

## 🗂️ 다음 단계
설치 완료되면 뿅이한테 알려줘!
그러면 실제 페이지 코드 하나씩 만들어줄게 😊
