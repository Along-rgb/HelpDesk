# การวิเคราะห์โปรเจกต์ HelpDesk_SVC
## ตามหลัก Clean Code, Next.js Best Practices และ Refactor ที่สะดวก

---

## 1. Clean Code

### 1.1 DRY (Don't Repeat Yourself) — ความสำคัญสูง

| ปัญหา | ตำแหน่ง | แนวทางแก้ |
|--------|---------|-----------|
| **confirmDialog** ซ้ำกัน 4 ที่ (Buildings, Issues, Service Requests, SupportTeam) | `Detail-category_*/page.tsx` | สร้าง utility `confirmDelete(options: { message, header, onAccept })` หรือ component `<ConfirmDeleteDialog />` ใน `lib/dialogs.ts` / `components/ConfirmDeleteDialog.tsx` |
| **renderHeader()** โครงสร้างเดียวกันทุกหน้า (หัวข้อ + ช่องค้นหา + ปุ่มเพิ่ม) | ทุก Detail-category page | สร้าง `<TablePageHeader title={} searchValue={} onSearch={} onAdd={} addLabel="ເພີ່ມໃໝ່" />` ใน `uikit/MenuApps/components/` |
| **Tab + URL sync** (useSearchParams + tab index) | Buildings, Issues, Service Requests, SupportTeam | สร้าง custom hook `useTabFromSearchParams(tabParamKey='tab', tabCount)` return `[activeIndex, setActiveIndex]` |
| **useMemo สำหรับ tableHeaderTitle / columnNameHeader** แบบเดียวกัน (if activeIndex … return …) | ทุก Detail-category page | สร้าง helper `getTabLabels(tabType: 'building' \| 'issues' \| 'serviceRequest' \| 'supportTeam', activeIndex)` หรือเก็บ config เป็น object ต่อ tab |

### 1.2 ชื่อที่สื่อความหมาย (Meaningful Names)

| ปัจจุบัน | ปัญหา | แนะนำ |
|----------|--------|--------|
| `useMenuu.ts` (GroupServices) | typo สอง u | เปลี่ยนเป็น `useMenu.ts` (หรือ `useGroupServicesMenu.ts` ถ้าแยกจาก GroupProblem) |
| `RequestForm` (invalidstate/page.tsx) | ชื่อ component ไม่บอกว่าเป็น "ฟอร์มสร้าง ticket" | เช่น `TicketRequestForm` หรือ `CreateTicketForm` |
| `TableDemo` (table/page.tsx) | ชื่อแบบ demo ไม่สื่อหน้าที่จริง | เช่น `TicketsTablePage` หรือ `TicketListPage` |
| `config.constant-api.ts` → `initialState` | ใช้เป็น state ต้นทางของ store แต่ชื่อเป็น "constant-api" | แยกเป็น `store/initialState.ts` หรือใส่ใน `usersStore` โดยตรง |
| ตัวแปร `raw` ใน useBuilding (rawItems) | พอใช้ได้ แต่ถ้าให้ชัดขึ้น | `apiItems` หรือ `fetchedItems` |

### 1.3 ฟังก์ชันเล็กและ Single Responsibility

| ไฟล์ | ปัญหา | แนวทาง |
|------|--------|--------|
| **Buildings page.tsx** | มีทั้ง: tab sync, duplicate check, cooldown, open/edit, save, delete, renderHeader, JSX ขนาดใหญ่ | แยก: `useBuildingsPageState()`, `useDuplicateCheck()`, `useAddButtonCooldown()` และให้ page เหลือแค่ compose + layout |
| **ticketService.ts** | รวม getBuildings, getMasterData, getTopicsByCategory, createTicket, getTickets, updateTicket ในที่เดียว + mock data อยู่ด้วย | แยก: `buildingService`, `ticketApi` และย้าย mock/constants ไป `constants/ticketMock.ts` หรือดึงจาก API จริง |
| **useCoreApi** | ทำทั้ง fetch, save, delete และจัดการ toast | รับได้ แต่ถ้าแยก layer: ใช้ `api.get/post/put/delete` ด้านล่าง แล้วให้ useCoreApi เรียก api + แสดง toast จะอ่านง่ายขึ้น |

### 1.4 Magic Numbers / Strings

| ตำแหน่ง | ค่าปัจจุบัน | แนะนำ |
|----------|-------------|--------|
| Buildings page | `addClickCount >= 2`, `2000` ms, `1500` ms | ค่าคงที่ชื่อเช่น `MAX_DOUBLE_CLICK_COUNT`, `ADD_BUTTON_COOLDOWN_MS`, `SAVE_COOLDOWN_MS` ไว้ใน `constants/ui.ts` หรือด้านบนไฟล์ |
| useCoreApi | `life: 2000`, `life: 4000` | เช่น `TOAST_ERROR_LIFE`, `TOAST_SUCCESS_LIFE` ใน constants |
| axios interceptor | `MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000` | ดีแล้ว เก็บใน config หรือ env เป็น `NEXT_PUBLIC_TOKEN_MAX_AGE_MS` ได้ |

### 1.5 Error Handling และการไม่ใช้ any

| ปัญหา | ตำแหน่ง | แนวทาง |
|--------|---------|--------|
| `config: any` ใน axios interceptor | `config/axiosClientsHelpDesk.ts` | ใช้ `InternalAxiosRequestConfig` จาก axios |
| `initialState: any` | `config/constant-api.ts` | กำหนด type เช่น `UsersStoreState` |
| `resp: any` ใน login | `auth/login/page.tsx` | กำหนด type response จาก API login |
| catch แล้วแค่ `console.error` บางที่ไม่มี feedback ให้ user | หลาย service/hook | ใช้ toast หรือ error state สม่ำเสมอ และให้ useCoreApi เป็นจุดกลางแสดง error |

---

## 2. Next.js Best Practices

### 2.1 Root Layout และ 'use client'

| ปัญหา | ผลกระทบ | แนวทาง |
|--------|----------|--------|
| **Root layout เป็น 'use client' ทั้งหมด** | ทำให้ทั้ง app เป็น client bundle, ไม่ได้ใช้ React Server Components ตรง root | ย้ายเฉพาะส่วนที่ต้องใช้ context (LayoutProvider, PrimeReactProvider) ไปเป็น `<Providers>` แล้วให้ root layout เป็น Server Component รับ children แล้ว wrap ด้วย `<Providers>{children}</Providers>` |
| หน้า **page.tsx หลายหน้าที่เป็น 'use client' ทั้งหน้า** | หน้าที่มีแค่ list + filter อาจแยก Server Component โหลดข้อมูลได้ | ใช้ Server Component สำหรับ fetch ต้นทาง (หรือใช้ server action) แล้วส่งเป็น props ไปให้ Client Component แสดง table/filter |

### 2.2 Loading, Error และ Not-Found

| สถานะ | ปัจจุบัน | แนะนำ |
|--------|----------|--------|
| **Loading** | ไม่มี `loading.tsx` ใน route segments | เพิ่ม `app/(main)/loading.tsx`, `app/(main)/uikit/loading.tsx` (หรือต่อ route) เพื่อแสดง skeleton/ spinner ตอนเปลี่ยนหน้า |
| **Error** | ไม่มี `error.tsx` | เพิ่ม `error.tsx` ใน (main) และ (full-page) เพื่อจับ error ขณะ render และแสดง UI แทน crash |
| **Not Found** | มีแค่ (full-page)/pages/notfound | ใช้ `not-found.tsx` ตาม Next.js convention ใน segment ที่ต้องการ (และเรียก `notFound()` ในโค้ดเมื่อไม่มีข้อมูล) |

### 2.3 Metadata และ SEO

| ปัจจุบัน | แนะนำ |
|----------|--------|
| metadata อยู่ใน layout ของ (main) และ (HelpDesk-req) | ดีแล้ว ถ้าต้องการต่างกันต่อ route ให้เพิ่มใน page.tsx นั้นด้วย `export const metadata` (หรือ generateMetadata ถ้าขึ้นกับข้อมูล) |
| Root layout ไม่มี metadata | เพิ่ม metadata พื้นฐานใน root `app/layout.tsx` (title template, description) |

### 2.4 Environment และ Config

| ปัญหา | แนะนำ |
|--------|--------|
| ไม่มี `.env.example` | สร้าง `.env.example` ระบุ `NEXT_PUBLIC_HELPDESK_API_BASE_URL`, `NEXT_PUBLIC_API_URL` (ถ้าใช้), และตัวแปรอื่นที่ deploy ต้องตั้ง |
| API URL กระจาย (localhost:3501, 192.168.x.x, '#') | ใช้ตัวแปร env เดียวสำหรับ HelpDesk API และให้ทุก service เรียกผ่าน `axiosClientsHelpDesk` (หรือ wrapper ที่อ่านจาก env) |

### 2.5 โครงสร้าง Route และโฟลเดอร์

| ปัจจุบัน | แนะนำ |
|----------|--------|
| ชื่อโฟลเดอร์ `Detail-category_Buildings` (ผสม hyphen + underscore) | เลือกแบบเดียว เช่น `detail-category-buildings` (kebab-case) ให้สอดคล้องกับ Next.js |
| layout อยู่ที่ root `layout/` (นอก app) | ทำงานได้แต่คนใหม่อาจสับสน — เก็บไว้ได้แต่ควรมี README อธิบาย หรือพิจารณาย้ายเป็น `app/_components/layout/` |

---

## 3. Refactor ที่สะดวก (ลด coupling และทำให้ทดสอบ/เปลี่ยนง่าย)

### 3.1 Import Path ให้สม่ำเสมอ

- **ปัญหา:** บางไฟล์ใช้ `../../../../../config/axiosClientsHelpDesk` บางไฟล์ใช้ `@/config/axiosClientsHelpDesk`
- **แก้:** ใช้ `@/` ทั้งหมด (และตรวจ tsconfig paths ว่า `@/*` ชี้ไปที่ root โปรเจกต์)
- **ไฟล์ที่ควรแก้:**  
  `BuildingCreateDialog.tsx`, `useBuilding.ts`, `useCoreApi.ts` และอื่นๆ ที่ยังใช้ relative ไปที่ config

### 3.2 Layer ชัดเจน: API → Service → Hook → UI

| Layer | ปัจจุบัน | แนะนำ |
|--------|----------|--------|
| **API client** | มีแล้วที่ `config/axiosClientsHelpDesk.ts` | ใช้ตัวนี้เป็นจุดเดียวสำหรับ HTTP ไป backend หลัก (รวม tickets ถ้า backend รวมอยู่ที่เดียวกัน) |
| **Service** | `app/services/ticketService.ts` ใช้ทั้ง axios client และ axios ตรงไป localhost:3501 | ย้าย ticket CRUD ไปใช้ axiosClientsHelpDesk และ base URL จาก env; แยก building/master ไป service อื่นถ้าต้องการ |
| **Types** | ticketService import จาก `../../app/(main)/uikit/invalidstate/types` | ย้าย types ที่ใช้ร่วมกันไป `types/` หรือ `global/types/` แล้ว import ด้วย `@/types/...` / `@/global/types/...` |

### 3.3 Shared Components และ Hooks

- **Table page layout:** สร้าง layout component รับ `title`, `tabs`, `children` (table), `dialog`, เพื่อลดการ copy-paste โครงสร้างหน้า Detail-category
- **Confirm delete:** ฟังก์ชันหรือ component เดียว รับข้อความ + callback ลบ
- **useTabFromSearchParams:** hook เดียวสำหรับ sync tab กับ query string

### 3.4 ลดการผูกกับ implementation รายละเอียด

- **useCoreApi:** ไม่ควรยึดกับ Toast ref โดยตรง — อาจรับ `onSuccess` / `onError` callback แทน แล้วให้ caller (page) เป็นคนแสดง toast จะได้ทดสอบและ reuse ง่ายขึ้น
- **Store:** อย่า import store ตรงใน axios interceptor (dynamic import ตอน 401) — พอใช้ได้แต่ถ้ามี auth context หรือ single place ที่ clear auth จะดูแลง่ายกว่า

---

## 4. สรุปลำดับการปรับปรุงที่แนะนำ

1. **เร็วและกระทบน้อย**  
   - ใช้ `@/` ใน import ทั้งหมด  
   - สร้าง `.env.example`  
   - แก้ typo `useMenuu.ts`  
   - ตั้งชื่อ constants แทน magic number (cooldown, toast life)

2. **ลดความซ้ำ (DRY)**  
   - สร้าง helper confirm delete และ TablePageHeader  
   - สร้าง useTabFromSearchParams

3. **Next.js**  
   - เพิ่ม loading.tsx / error.tsx  
   - แยก Providers ออกจาก root layout ให้ root เป็น Server Component

4. **โครงสร้างและ layer**  
   - รวม API URL ผ่าน env + axios client เดียว  
   - ย้าย types ที่ใช้ร่วมไปที่กลาง  
   - แยก ticket / building / master services ชัดเจน

5. **Clean Code ระดับฟังก์ชัน**  
   - แยก state/handler ใน Buildings page เป็น hooks ย่อย  
   - แยก ticketService เป็น modules เล็กและลบการผูกกับ path ของ uikit

ถ้าต้องการให้ช่วยลงมือ refactor เป็นขั้นตอน (เช่น เริ่มจาก import path + confirm delete helper) บอกได้เลยว่าจะเริ่มจากส่วนไหนก่อน
