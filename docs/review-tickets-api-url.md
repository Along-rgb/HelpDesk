# Review: ticketsApiUrl (Mock API localhost:3501)

## สรุป

**`ticketsApiUrl: 'http://localhost:3501'` ใช้ได้ก็ต่อเมื่อมี mock server รันที่ port 3501 เท่านั้น**  
ถ้าไม่มี process รันที่ 3501 ทุก request ไปที่ Tickets API จะ fail (connection refused / network error) ทำให้ฟีเจอร์ ticket ไม่โหลด/ไม่บันทึก

---

## ที่มาใน config

| ไฟล์ | ค่า |
|------|-----|
| `config/env.ts` | `devFallback.ticketsApiUrl = 'http://localhost:3501'` |
| อ่านจาก env | `NEXT_PUBLIC_TICKETS_API_URL` (fallback ข้างบนเมื่อ NODE_ENV=development) |

---

## โค้ดที่ใช้ `ticketsApiUrl`

### 1. `app/services/ticket.service.ts` (TicketService)

- **getTickets()**: ใช้ `axiosClientsHelpDesk.get('/tickets', { baseURL: env.ticketsApiUrl })`
  - ส่ง Bearer token (จาก interceptor)
  - เรียกไปที่ `http://localhost:3501/tickets`
- **ผู้เรียก**: `app/(main)/uikit/pageTechn/useTicketTableTechn.ts` เท่านั้น

### 2. `app/services/ticketService.ts` (ticketService)

- **TICKETS_BASE** = `env.ticketsApiUrl`
- ใช้ **axios ธรรมดา** (ไม่ใช้ axiosClientsHelpDesk) → **ไม่มี Bearer token**
- **createTicket**: `axios.get(\`${TICKETS_BASE}/tickets\`)` แล้ว `axios.post(\`${TICKETS_BASE}/tickets\`, body)`
- **getTickets**: `axios.get(\`${TICKETS_BASE}/tickets\`)`
- **updateTicket**: `axios.put(\`${TICKETS_BASE}/tickets/${id}\`, ticket)`
- **ผู้เรียก**:
  - `app/(main)/uikit/table/useTicketTable.ts` → getTickets, updateTicket
  - `app/(main)/uikit/invalidstate/useTicketForm.ts` → createTicket, getMasterData, getFloorsByBuilding
  - `app/(main)/uikit/ticket-detail/[id]/page.tsx` → getTickets

หมายเหตุ: buildings/floors/turnings ใน ticketService ไปที่ **HelpDesk API** (axiosClientsHelpDesk) ไม่ได้ใช้ ticketsApiUrl

---

## ทำไมถึง "ใช้ไม่ได้"

1. **ไม่มี server รันที่ port 3501**  
   โค้ดคาดว่ามี API รองรับ `GET/POST/PUT /tickets` ที่ base URL นี้ ถ้าไม่รัน mock server → ทุก request จะ error

2. **ticketService ใช้ axios ตรง ไม่มี auth**  
   ถ้า mock API ต้องการ Authorization จะไม่ส่ง token ไป (ต่างจาก TicketService ที่ใช้ axiosClientsHelpDesk)

3. **โครงข้อมูลไม่ตรงกับ Fake-DB.json**  
   `Fake-DB.json` มี key แบบ `firstname_req`, `lastname_req` ฯลฯ ส่วน createTicket ส่ง `requester`, `building`, `level`, `room` ฯลฯ ถ้าจะใช้ JSON Server / mock จากไฟล์นี้ต้อง map หรือปรับ schema ให้ตรง

---

## ทางเลือกแก้ไข

### ตัวเลือก A: ใช้ Mock Server จริงที่ 3501

- รัน JSON Server (หรือ mock API อื่น) ที่ port 3501
- เปิด endpoint `/tickets` ให้รองรับ GET (array), GET /tickets/:id, POST /tickets, PUT /tickets/:id
- ถ้าใช้ `Fake-DB.json` ต้องปรับ route/schema ให้ตรงกับที่ frontend ส่ง/รับ
- ตั้งใน `.env.local`: `NEXT_PUBLIC_TICKETS_API_URL=http://localhost:3501`

### ตัวเลือก B: ย้าย Ticket CRUD ไปใช้ HelpDesk API (แนะนำถ้า Backend รองรับ)

- ถ้า Backend มี endpoint tickets อยู่แล้ว (เช่น ใต้ helpdesk API) ให้เรียกผ่าน **axiosClientsHelpDesk** และใช้ **helpdeskApiUrl** เท่านั้น
- แก้ `ticketService.ts`: ให้ createTicket / getTickets / updateTicket ใช้ `axiosClientsHelpDesk` แทน `axios` + TICKETS_BASE
- แก้ `ticket.service.ts`: ให้ getTickets ใช้ baseURL ของ helpdesk (หรือลบ baseURL override)
- ลดการพึ่งพา localhost:3501 และใช้ API ชุดเดียวกับระบบช่วยให้ deploy/ตรวจสอบง่าย

### ตัวเลือก C: Fallback เป็นข้อมูลจำลองใน frontend

- เมื่อ `env.ticketsApiUrl` ว่าง หรือ request ไป 3501 fail ให้ใช้ข้อมูลจาก memory / Fake-DB (หรือ mock array ใน code) เฉพาะตอน dev
- ต้องจัดการให้ชัดว่าเมื่อไหร่ใช้ mock เมื่อไหร่ใช้ API จริง (เช่น ตรวจจาก env หรือ catch error แล้วใช้ mock)

---

## สรุปสั้นๆ

| คำถาม | คำตอบ |
|--------|--------|
| ticketsApiUrl ใช้ในโค้ดไหม? | ใช้ — ใน ticket.service.ts และ ticketService.ts |
| ทำไมถึงใช้ไม่ได้? | เพราะไม่มี mock server รันที่ localhost:3501 และ/หรือไม่มี auth ใน ticketService |
| แก้ยังไง? | รัน mock server ที่ 3501 หรือย้าย ticket CRUD ไปใช้ HelpDesk API (ตัวเลือก B) |
