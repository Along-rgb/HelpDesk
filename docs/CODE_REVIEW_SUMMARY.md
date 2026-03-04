# รายงานรีวิวโค้ด (Code Review) — HelpDesk_SVC

สรุปจากการตรวจสอบโปรเจกต์ด้าน: สิ่งที่ยังขาด, ความปลอดภัย Frontend, การทำงานซ้ำซ้อน/ประสิทธิภาพ, โครงสร้างและ Clean Code

---

## 1. สิ่งที่ยังขาด / ควรเติม (Missing / Gaps)

### 1.1 ฟีเจอร์ / ฟลูว์
- **repair-history**: หน้ารายการ “ປະຫວັດການຊ້ອມແປງ” มีแค่ UI (checkbox, calendar) ยังไม่มีการยิง API หรือโหลดข้อมูลจริง — ควรเชื่อมกับ API และแสดงผลเมื่อพร้อม
- **ticket-detail**: บล็อก “ການສົນທະນາ” และ “ຂໍ້ມູນອຸປະກອນ” ยังเป็น placeholder (ກໍາລັງອັບເດດ) — ควรระบุ roadmap หรือ stub สำหรับฟีเจอร์ถัดไป

### 1.2 การ validate ค่าจาก URL
- **Query params**: ค่าเช่น `searchParams.get('id')`, `searchParams.get('ticketId')`, `searchParams.get('tab')` ใช้ตรงๆ โดยยังไม่มีการตรวจว่าเป็นตัวเลขหรือค่าที่อนุญาต ก่อนส่งไป API หรือใช้ใน path
- **แนะนำ**: สร้าง helper (เช่น `parseSafeId(param)` ที่คืนเฉพาะตัวเลขหรือ null) แล้วใช้กับ `editIdParam`, `ticketIdParam`, `tabParam` เพื่อลดความเสี่ยง path/parameter manipulation

### 1.3 Error boundary และการจัดการ error แบบรวมศูนย์
- แต่ละหน้ามักจัดการ error เอง (toast, setError) ยังไม่มี Error Boundary ระดับ route/layout ที่จับ error แล้วแสดงหน้า/ข้อความมาตรฐาน
- **แนะนำ**: เพิ่ม Error Boundary ใน layout หลักและมี fallback UI + logging (ไม่ log secret)

### 1.4 การทดสอบ
- ยังไม่เห็นชุด unit/integration tests ในโครงที่ตรวจ — แนะนำเพิ่ม tests สำหรับ hooks ที่เรียก API, validation (เช่น login, ฟอร์ม ticket) และ utility (เช่น normalize, date format)

---

## 2. ความปลอดภัยฝั่ง Frontend (Frontend Security)

### 2.1 XSS (Cross-Site Scripting) — ความเสี่ยงสูง
- **ticket-detail/[id]/page.tsx**: ใช้ `dangerouslySetInnerHTML={{ __html: ticket.description }}` โดยไม่มี sanitization
  - ถ้า `ticket.description` มาจาก API และมี HTML/script จะเกิด XSS ได้
- **แนะนำ**: ใช้ไลบรารี sanitize HTML (เช่น DOMPurify) ก่อนส่งเข้า `__html` หรือแสดงเป็น plain text (เช่น `textContent`) ถ้าไม่จำเป็นต้องรองรับ HTML

### 2.2 การเก็บ Token / Session
- **login.d.tsx**: ยังเขียน `localStorage.setItem('token', ...)` และ `localStorage.setItem('lastime', ...)` โดยตรง ขณะที่ระบบหลักใช้ `AUTH_KEYS.AUTH_STORE` กับ Zustand
  - ทำให้มีแหล่งเก็บ token สองที่ (legacy + store) และ key `'token'` ไม่ได้อยู่ใน `AUTH_KEYS` ที่ `clearAppSession()` ลบ
- **document.cookie = ''**: การเคลียร์ cookie แบบนี้หยาบและอาจกระทบ cookie อื่น
- **แนะนำ**: ให้ login ใช้เฉพาะ authenStore + AUTH_KEYS (และ persist ผ่าน store ที่มีอยู่); ลบการเขียน `'token'`/`'lastime'` โดยตรง และให้ clearAppSession เป็นจุดเดียวที่ลบ session

### 2.3 ความสอดคล้องของ API client และ Auth
- **changepassword/api.ts**: ใช้ `axios` โดยตรง + `getTokenFromStorage()` แทน `axiosClientsHelpDesk` จึงไม่ได้รับ 401/403 handling และ interceptors (เช่น redirect ไป login) แบบเดียวกับ Helpdesk
- **ticketService.ts**: ใช้ `axios.get/post/put` ตรงไปที่ `TICKETS_BASE` (env.ticketsApiUrl) ไม่ใช้ `axiosClientsHelpDesk` — ถ้า tickets API ใช้ auth แบบเดียวกัน แนะนำใช้ client เดียวหรือแยก client ชัดเจนและมี interceptor สอดคล้องกัน

### 2.4 Proxy และ Config
- **app/api/proxy-helpdesk/[...path]/route.ts**: มี fallback URL แบบ hardcode (`https://api-test.edl.com.la/helpdesk/api` และ upload) ขัดกับกฎ “no real URL as default”
- **แนะนำ**: ใช้ค่าจาก env เท่านั้น; ถ้า env ว่างให้ return 503 หรือ error ชัดเจน แทนการยิงไปที่ URL จริง

### 2.5 สรุป Security
| หัวข้อ              | สถานะ        | แนะนำ |
|---------------------|-------------|-------|
| XSS (description)   | ความเสี่ยงสูง | Sanitize HTML หรือแสดงแบบ plain text |
| Token/Session (login) | ไม่สอดคล้อง | ใช้ AUTH_KEYS + store เดียว, ลบ legacy token/lastime |
| API client (changepassword, ticketService) | แยก client | ใช้ client เดียวหรือ interceptor สม่ำเสมอ |
| Proxy fallback URL  | Hardcode    | ใช้ env เท่านั้น, ไม่ fallback ไป URL จริง |
| Query param validation | ยังไม่มี   | Validate id/ticketId/tab ก่อนใช้ใน path/API |

---

## 3. การทำงานซ้ำซ้อนและประสิทธิภาพ (Duplication & Performance)

### 3.1 API ที่ถูกเรียกซ้ำระหว่างหน้า (ไม่มี cache ร่วม)
- **helpdeskstatus/selecthelpdeskstatus** ถูกเรียกใน:
  - `app/(main)/uikit/table/useTicketTable.ts`
  - `app/(main)/uikit/pageTechn/useTicketTableTechn.ts`
  - `app/(main)/uikit/request-history/page.tsx`
- แต่ละหน้าที่โหลดจะยิง GET แยกกัน ไม่มี cache ร่วม (เช่น React Query/SWR หรือ context) ทำให้มีการเรียกซ้ำเมื่อสลับหน้า
- **แนะนำ**: สร้าง hook ร่วม เช่น `useHelpdeskStatusOptions()` ที่ fetch ครั้งเดียวแล้ว cache (หรือใช้ React Query/SWR) แล้วให้ table, pageTechn, request-history ใช้ hook นี้

### 3.2 หลาย useEffects แยกใน useTicketTable
- **useTicketTable.ts**: มี 4–5 `useEffect` แยกกัน (STATUS, USERS_ADMINASSIGN, HEADCATEGORY_SELECT, PRIORITY, แล้วก็ fetchData) แต่ละตัวยิง API แยก
- การยิงพร้อมกัน (parallel) อยู่แล้ว แต่การเขียนแยกหลาย useEffect ทำให้ลำดับและ dependency กับ `assignOptions` อ่านยาก และมีโอกาสว่า `fetchData` รันก่อน `assignOptions` จะโหลดเสร็จ (แล้วไม่มีการ re-fetch เมื่อ assignOptions มาทีหลัง)
- **แนะนำ**: รวมการโหลด metadata (status, users, headcategory, priority) เป็นชุดเดียว (เช่น Promise.all หรือ hook เดียว) แล้วค่อยโหลด tickets หลังได้ assignOptions; หรือใช้ hook แยกที่ return options แล้วให้ useTicketTable รับเป็น dependency

### 3.3 ฟังก์ชัน normalize ซ้ำในหลายไฟล์
- รูปแบบ `normalizeStatusList`, `normalizeResponse`, `normalizeUserList`, `normalizeHeadCategoryList`, `normalizePriorityList` ใน `useTicketTable.ts`
- `normalizeStatusList`, `normalizeAssignmentsResponse` ใน `useTicketTableTechn.ts`
- `normalizeResponse` ใน `useSelectTickets.ts`, `useSelectCategories.ts`
- โครงสร้างคล้ายกัน (รับ `unknown` แล้วจัดการทั้ง array ตรงๆ และ `{ data: [] }`)
- **แนะนำ**: ย้ายไปเป็น shared utility (เช่น `utils/apiNormalizers.ts`) แล้วใช้ฟังก์ชันร่วม ลด duplication และให้ type ชัดเจนที่เดียว

### 3.4 การโหลดข้อมูลใน request-history
- หน้านี้โหลดทั้ง `helpdeskrequests/user` และ `helpdeskstatus/selecthelpdeskstatus` — ถ้า status ไปใช้จาก hook ร่วมกับ table/pageTechn ได้ จะลดจำนวน request และทำให้ข้อมูล status สม่ำเสมอ

### 3.5 สรุป Performance / Duplication
| จุดที่พบ              | ผลกระทบ              | แนะนำ |
|------------------------|----------------------|--------|
| Status API หลายที่     | เรียกซ้ำเมื่อสลับหน้า | Hook + cache ร่วม (หรือ React Query) |
| useTicketTable useEffects หลายตัว | โค้ดอ่านยาก, race กับ assignOptions | รวมโหลด metadata / ใช้ hook options ร่วม |
| normalize* ในหลายไฟล์  | ซ้ำ, แก้ type หลายที่ | Shared normalizers ใน utils |
| request-history + status | โอกาสเรียก status ซ้ำ | ใช้ useHelpdeskStatusOptions ร่วม |

---

## 4. โครงสร้างและ Clean Code (Refactor-ability & Structure)

### 4.1 จุดที่ทำได้ดี
- **Config/Env**: ใช้ `config/env.ts` เป็นจุดเดียว อ่านจาก `process.env` ไม่ hardcode URL ในโค้ดหลัก (ยกเว้น proxy fallback ตามที่ระบุด้านบน)
- **Auth keys**: `utils/authHelper.ts` กำหนด `AUTH_KEYS` เป็นแหล่งเดียว และมี `clearAppSession()` ชัดเจน
- **Layer แยก**: มี hooks สำหรับ API (useSelectCategories, useTicketTable, profileService ฯลฯ) แยกจาก UI
- **Type**: ใช้ TypeScript และ type จาก API/row ในหลายจุด (เช่น HelpdeskRequestRow, RequestHistoryRow)

### 4.2 จุดที่ควรปรับเพื่อให้ refactor ง่ายและ clean
- **API client ไม่รวมศูนย์**: มีทั้ง `axiosClientsHelpDesk`, `axios` ตรง (changepassword, ticketService), และ `fetch` ใน proxy/demo — แนะนำให้มี “client หลัก” ชัดเจน (Helpdesk ใช้ axiosClientsHelpDesk, Tickets แยกถ้า backend แยก) และใช้ client นั้นทุกที่ที่เรียก API ที่ต้อง auth
- **Constants/Endpoints กระจาย**: endpoint string (เช่น `helpdeskstatus/selecthelpdeskstatus`, `helpdeskrequests/admin`) อยู่ตาม hook/page — ถ้าเก็บเป็น constants หรือ enum ในที่เดียว (เช่น `config/endpoints.ts`) จะแก้ URL ที่เดียวและลด typo
- **Magic number/string**: ตัวเลขเช่น STAFF_ROLE_ID = 3, ROLE_ID_NO_PRIORITY_LIST = 2, TAB_INDEX ต่างๆ อยู่ตามไฟล์ — แนะนำรวมในที่เดียว (constants หรือ config ตาม role) เพื่อให้ refactor ง่าย
- **ชื่อไฟล์/โฟลเดอร์**: มีทั้ง `login.d.tsx` และ `useAuthLogin.ts` — ถ้า `login.d.tsx` เป็น default export ของฟอร์ม login อาจพิจารณาตั้งชื่อให้สอดคล้อง (เช่น LoginForm.tsx) เพื่อความชัดเจน

### 4.3 ความสอดคล้องของโค้ด
- **Error handling**: บางที่ใช้ `err?.response?.data?.message` บางที่ใช้ข้อความคงที่ — แนะนำให้มี helper แปลง error → ข้อความผู้ใช้ (และไม่ log secret) ใช้ร่วมกัน
- **การแสดงวันที่**: มีฟังก์ชันอย่าง `formatRequestDateTime` ใน request-history และ `formatDateTime` ใน utils — ถ้าใช้รูปแบบเดียวกันทั้งแอป น่าหลอมเป็น utility เดียว

---

## 5. สรุปภาพรวม

| ด้าน              | สรุปสั้นๆ |
|-------------------|------------|
| **สิ่งที่ยังขาด** | repair-history ยังไม่เชื่อม API, validate query params, Error Boundary, ชุดทดสอบ |
| **Security**      | XSS จาก description, token/session ไม่สอดคล้อง, API client ไม่รวมศูนย์, proxy hardcode URL |
| **Performance**   | Status API เรียกซ้ำหลายที่, หลาย useEffect ใน useTicketTable, normalizers ซ้ำ |
| **Refactor/Clean**| โครงสร้าง layer ดี แต่ควรรวม API client, endpoints, constants และ error/date helpers |

ถ้าทำตามข้อแนะนำด้านบน จะช่วยให้โปรเจกต์ปลอดภัยขึ้น เร็วขึ้น (ลด request ซ้ำและจัดลำดับโหลดข้อมูล) และ refactor ต่อได้ง่ายขึ้น
