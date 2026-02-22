# รายงานตรวจสอบโค้ด (Code Review) และแนวทาง Refactoring — HelpDesk_SVC

## สรุปจุดวิกฤตที่สุด (Critical Issues) ก่อน

| ลำดับ | หมวด | ปัญหา | ความรุนแรง |
|-------|------|--------|------------|
| 1 | Security | **Access Token เก็บใน localStorage** (Zustand persist) — เสี่ยง XSS อ่าน token ได้ | สูงมาก |
| 2 | Security | **ไฟล์ login.d.tsx** ยังเขียน `localStorage.setItem('token', ...)` โดยตรง และมี flow ไม่ตรงกับ page.tsx | สูง |
| 3 | Security | **clearAppSession** ใช้ key แบบ hardcode (`'employeeId'`, `'auth-store'`) คู่กับ AUTH_KEYS — อาจลืมลบบาง key | กลาง |
| 4 | Performance | **useTicketTableTechn** ไม่ได้โหลดข้อมูลจาก API — `tickets` เป็น [] ตลอด, `statusFilter` ไม่ได้ใช้ใน filtering | สูง |
| 5 | DRY | **TicketActionMenu** ซ้ำ 3 ที่ (pageTechn, table, pageUser) โครงสร้างคล้ายกัน แต่ละที่มี Toast/สไตล์ต่างกัน | กลาง |
| 6 | DRY | **FormDropdown** 2 ตัว (app/components vs profileUser/components) — API คนละแบบ (optionLabel name vs label/code) | กลาง |
| 7 | CSS | **Profile.css / custom.scss** มีสีและขนาด hard-code (#3f51b5, #6c757d, 12px, 20px) ไม่ใช้ตัวแปรจาก _variables.scss | กลาง |
| 8 | Clean Code | **useCoreApi** ใช้ `JSON.stringify(queryParams)` ใน dependency array และมี module-level `serverErrorToastShown` | กลาง |

---

# 1. Security & Authentication

## 1.1 การเก็บ Access Token (LocalStorage → HttpOnly Cookie)

**สถานะปัจจุบัน:** Token เก็บผ่าน Zustand `persist` ซึ่งใช้ **localStorage** เป็น default storage → ถ้าเกิด XSS สคริปต์สามารถอ่าน token ได้

**แนวทางแก้ไข (Production):**

- **Backend:** ให้ API Login ตอบด้วย `Set-Cookie` สำหรับ access token (หรือ session id) โดยตั้งค่า `HttpOnly; Secure; SameSite=Strict` (และถ้าใช้ cross-site แล้วจำเป็นถึงค่อยใช้ `SameSite=Lax`).
- **Frontend:**  
  - ไม่เก็บ token ไว้ที่ฝั่ง client (ลบการ persist auth ลง localStorage).  
  - หลัง login ให้ redirect ไปหน้าที่ต้องการ; การเรียก API ต่อไปให้ใช้ **credentials: 'include''** เพื่อส่ง cookie อัตโนมัติ.
  - Axios: ใช้ `withCredentials: true` ใน `axios.create` หรือใน config ของ request ที่ไปยัง domain ที่ set cookie.

**ตัวอย่างการปรับ Axios client (หลัง Backend รองรับ Cookie):**

```typescript
// config/axiosClientsHelpDesk.ts — BEFORE (อ่าน token จาก localStorage)
function getLatestToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStore = authenStore.getState().authData?.accessToken;
  if (fromStore) return fromStore;
  return readAuthFromStorage().token;
}
function attachAuthToRequest(config: InternalAxiosRequestConfig): void {
  // ...
  const token = getLatestToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
}
```

```typescript
// config/axiosClientsHelpDesk.ts — AFTER (ใช้ Cookie, ไม่ส่ง Authorization header เอง)
const axiosClientsHelpDesk = axios.create({
  baseURL: env.helpdeskApiUrl,
  withCredentials: true, // ส่ง Cookie อัตโนมัติ
});

function attachAuthToRequest(config: InternalAxiosRequestConfig): void {
  config.headers.set('Content-Type', 'application/json');
  config.headers.set('Accept', 'application/json, text/plain, */*');
  const method = String(config.method ?? '').toLowerCase();
  if (method === 'get') {
    config.headers.set('Cache-Control', 'no-store');
    config.headers.set('Pragma', 'no-cache');
  }
  // ไม่ตั้ง Authorization จาก localStorage — ใช้ Cookie ที่ Backend set
}
```

- **Session / Refresh:** ถ้า Backend มี refresh token แยก ให้เก็บ refresh token ใน HttpOnly Cookie เช่นกัน และมี endpoint refresh; ฝั่ง Frontend แค่เรียก refresh เมื่อได้ 401 แล้ว redirect ไป login เมื่อ refresh ล้มเหลว (เหมือน flow ปัจจุบันที่ clear session + redirect).

## 1.2 Login และ Session Management

- **จุดที่ดีอยู่แล้ว:** มี `AuthSessionHandler` ฟัง 401 แล้ว clear state + redirect, มี `clearAppSession` รวมศูนย์, มีการตรวจ 403 และแสดง Toast.
- **จุดที่ควรแก้:**
  - **ลบหรือรวม flow จาก `login.d.tsx`** — ไฟล์นี้ยังเขียน `localStorage.setItem('token', ...)` และใช้ `setAuthData(resp?.data?.data)` โดยไม่สอดคล้องกับ `page.tsx` + `useAuthLogin`. ควรใช้หน้า Login เดียว (เช่น `page.tsx`) และลบหรือ deprecate `login.d.tsx` เพื่อไม่ให้มีสองเส้นทางเก็บ token.
  - **clearAppSession:** ใช้เฉพาะ key จาก `AUTH_KEYS` แทนการ hardcode เพื่อไม่ให้มี key ค้าง:

```typescript
// utils/authHelper.ts — BEFORE
export function clearAppSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('employeeId');
  localStorage.removeItem('auth-store');
  const keys = Object.values(AUTH_KEYS);
  for (const key of keys) {
    localStorage.removeItem(key);
  }
  clearAuthCookies();
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}
```

```typescript
// utils/authHelper.ts — AFTER (Single source of keys)
export const AUTH_KEYS = {
  AUTH_STORE: 'authStore',
  USER_PROFILE_STORE: 'userProfileStore',
  SIDE_MENU: 'sideMenu',
  TOKEN: 'token',
  EMPLOYEE_ID: 'employeeId',
  AUTH_STORE_LEGACY: 'auth-store', // ถ้ายังมีที่อื่นใช้
} as const;

export function clearAppSession(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    ...Object.values(AUTH_KEYS),
    'auth-store',
    'employeeId',
  ];
  const uniqueKeys = [...new Set(keysToRemove)];
  uniqueKeys.forEach((key) => localStorage.removeItem(key));
  clearAuthCookies();
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}
```

หรือดีกว่า: ให้มี key เดียวใน `AUTH_KEYS` (รวม `auth-store` ถ้าต้องรองรับ legacy) แล้วลูปเฉพาะ `Object.values(AUTH_KEYS)`.

## 1.3 Payload Optimization (Sensitive Data ใน Response)

- **แนวทาง:** ให้ Backend ลด field ที่ไม่จำเป็นใน response (เช่น ไม่ส่ง password hash, token เก่า, ข้อมูล internal เกินจำเป็น). ฝั่ง Frontend ควรมี type ชัดเจน (เช่น `LoginApiResponse`, `UserProfile.UserLoginResponse`) เพื่อไม่ให้เผลอส่งหรือ log object ทั้งก้อนไปที่ client โดยไม่จำเป็น.
- **ที่ทำได้ทันที:** ตรวจว่าไม่มี `console.log(resp.data)` หรือ log object ที่มี token/รหัสผ่านในโหมด production (เช่น ใช้ env check หรือลบก่อน deploy).

---

# 2. Performance & Code Duplication

## 2.1 useTicketTableTechn — ข้อมูลไม่โหลด + Filter ไม่ครบ

**ปัญหา:**  
- `tickets` เริ่มเป็น `[]` และไม่มีที่ไหนเรียก API เพื่อ `setTickets` → ตารางว่างตลอด.  
- `onGlobalFilterChange` อัปเดต `filteredTickets` จาก `filterTickets(tickets, value)` แต่ `tickets` ว่าง → filtering ไม่มีผล.  
- `statusFilter` เก็บ state แต่ไม่ได้นำไปใช้ใน logic กรอง.

**แนวทางแก้:**

- โหลดข้อมูลจาก API (เช่น TicketService หรือ endpoint ที่ใช้ใน pageTechn) ใน `useEffect` แล้ว `setTickets`; จากนั้นให้ `filteredTickets` เป็น derived state (ใช้ `useMemo`) จาก `tickets + globalFilter + statusFilter` เพื่อไม่ให้ state พ redundant และการกด filter ทำงานถูกต้อง.

**ตัวอย่าง Refactor (สรุปโครง):**

```typescript
// useTicketTableTechn.ts — BEFORE (ข้อมูลไม่โหลด, statusFilter ไม่ได้ใช้)
const [tickets, setTickets] = useState<Ticket[]>([]);
const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
const onGlobalFilterChange = (e) => {
  const value = e.target.value;
  setGlobalFilter(value);
  setFilteredTickets(filterTickets(tickets, value));
};
return { tickets: filteredTickets, ... };
```

```typescript
// useTicketTableTechn.ts — AFTER (โหลดจาก API, filter แบบ derived)
const [tickets, setTickets] = useState<Ticket[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  TicketService.getTickets()
    .then((data) => { if (!cancelled) setTickets(Array.isArray(data) ? data : []); })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, []);

const filteredTickets = useMemo(() => {
  let list = tickets;
  if (globalFilter.trim()) {
    const q = globalFilter.toLowerCase();
    list = list.filter((t) =>
      t.id.toString().includes(q) ||
      (t.title ?? '').toLowerCase().includes(q) ||
      (t.firstname_req ?? '').toLowerCase().includes(q) ||
      (t.requester ?? '').toLowerCase().includes(q)
    );
  }
  if (statusFilter?.value) {
    list = list.filter((t) => t.status === statusFilter.value);
  }
  return list;
}, [tickets, globalFilter, statusFilter]);

const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setGlobalFilter(e.target.value);
}, []);

return { tickets: filteredTickets, loading, ... };
```

- ใส่ `statusFilter` เข้าไปในเงื่อนไขใน `useMemo` ตามโครงด้านบน (ใช้ `statusFilter?.value` หรือ key ที่ตรงกับ API).

## 2.2 Filtering ให้ลื่นและลดการเรียก API

- **Buildings (ManagementTable):** ทำ client-side filter กับ `items` อยู่แล้ว และใช้ `useMemo` สำหรับ `filteredItems` — ดี.  
- **Report (useReportData):** ใช้ `dateRange` + `activeIndex` เป็น dependency และมี AbortController — ดี. แนะนำให้ส่ง `signal` ไปทุก request ที่รองรับ เพื่อยกเลิก request เก่าเมื่อ filter เปลี่ยนเร็ว.
- **Filter ปุ่ม/Dropdown:** ถ้า filter อยู่ฝั่ง client (เช่น Buildings, pageTechn) ให้ใช้ `useMemo` แทนการ set state แยกสำหรับ “filtered list” เพื่อลด re-render และ logic ซ้ำ (เหมือนตัวอย่างด้านบน).

## 2.3 DRY — TicketActionMenu และ FormDropdown

**TicketActionMenu:**  
มี 3 ไฟล์ที่ทำหน้าที่คล้ายกัน (pageTechn, table, pageUser). แนะนำให้มี **component เดียว** อยู่ที่ `app/components/TicketActionMenu.tsx` รับ props เช่น `ticket`, `variant?: 'techn' | 'user'` และ `actions?: Array<{ label, icon, command }>` เพื่อให้แต่ละหน้าเลือกปุ่มและสไตล์ได้โดยไม่ copy โค้ด.

**ตัวอย่างรวมเป็น component เดียว:**

```tsx
// app/components/TicketActionMenu.tsx (NEW — shared)
'use client';
import React from 'react';
import { SplitButton } from 'primereact/splitbutton';
import { useRouter } from 'next/navigation';

export interface TicketActionItem {
  label: string;
  icon: string;
  className?: string;
  command: () => void;
}

interface TicketActionMenuProps {
  ticket: { id: string | number };
  variant?: 'techn' | 'user';
  actions?: TicketActionItem[];
}

const DEFAULT_ACTIONS_TECHN: TicketActionItem[] = [
  { label: 'ແກ້ໄຂແລ້ວ', icon: 'pi pi-check', command: () => {} },
  { label: 'ປິດວຽກ', icon: 'pi pi-times-circle', command: () => {} },
  { label: 'ຍົກເລີກ', icon: 'pi pi-trash', className: 'text-red-500', command: () => {} },
];

export function TicketActionMenu({
  ticket,
  variant = 'techn',
  actions = DEFAULT_ACTIONS_TECHN,
}: TicketActionMenuProps) {
  const router = useRouter();
  const model = variant === 'user'
    ? [
        { label: 'ການສົນທະນາ', icon: 'pi pi-comments', command: () => {} },
        { label: 'ປິດ', icon: 'pi pi-check-circle', command: () => {} },
        { label: 'ຍົກເລີກ', icon: 'pi pi-times-circle', className: 'text-red-500', command: () => {} },
      ]
    : [{ separator: true }, ...actions.map((a) => ({ ...a, separator: false }))].filter((x) => !('separator' in x) || x.separator);

  return (
    <div className="flex justify-content-center">
      <SplitButton
        label="ລາຍລະອຽດ"
        icon="pi pi-file"
        model={model}
        className="p-button-secondary p-button-sm"
        style={{ height: variant === 'user' ? '26px' : '28px', fontSize: '12px' }}
        buttonProps={{ style: { padding: variant === 'user' ? '0px 12px' : '0px 8px' } }}
        menuButtonProps={{ style: { width: variant === 'user' ? '25px' : '24px' } }}
        onClick={() => router.push(`/uikit/ticket-detail/${ticket.id}`)}
        dropdownIcon="pi pi-chevron-down"
      />
    </div>
  );
}
```

จากนั้นใน pageTechn, table, pageUser ให้ import จาก `@/app/components/TicketActionMenu` และส่ง `ticket` + `variant` แทนการเก็บ 3 ไฟล์.

**FormDropdown:**  
มี 2 ตัว — `app/components/FormDropdown.tsx` (optionLabel="name") และ `profileUser/components/FormDropdown.tsx` (optionLabel="label", optionValue="code"). แนะนำให้มี component เดียวรับ `optionLabel`, `optionValue` (optional) และ label/error/className แล้วให้แต่ละที่ส่ง props ต่างกัน แทนการซ้ำสองไฟล์.

---

# 3. Clean Code & Refactorability

## 3.1 โครงสร้างแบบ Modular

- **Auth:** แยกเป็นโฟลว์ชัด — `useAuthLogin` → store → redirect ดีอยู่แล้ว.  
- **Services:** มี `ticket.service.ts`, `profileService.ts`, `useCoreApi` — ดี. แนะนำให้ ticket list สำหรับ Techn ใช้ service เดียวกัน (TicketService) แทน state เปล่าใน hook.  
- **Hooks:** แยก useBuilding, useTicketTableTechn, useReportData ชัด. แนะนำให้ `useTicketTableTechn` รับ dependency เป็น function โหลด tickets (เช่น `() => TicketService.getTickets()`) เพื่อให้เทสและ reuse ง่าย.

## 3.2 ลดความซับซ้อนและอ่านง่าย

- **useAuthLogin:** มีหลาย branch (status, token, user, roleId, redirect). แนะนำแยกฟังก์ชันย่อย เช่น `extractToken(body)`, `extractUser(body)`, `getAfterLoginPath(roleId)` เพื่อลด cyclomatic complexity และอ่านง่าย.  
- **useCoreApi:**  
  - หลีกเลี่ยง `JSON.stringify(queryParams)` ใน dependency — ใช้ `useRef` เก็บ queryParams ล่าสุดแล้วเปรียบเทียบใน fetchData หรือยอมรับว่าเปลี่ยน reference ทุก render แล้วใช้ eslint-disable พร้อม comment.  
  - ตัวแปร `serverErrorToastShown` ระดับ module ทำให้เทสและ reuse ยาก — แนะนำย้ายเข้าไปอยู่ใน ref ภายใน hook หรือส่งเป็น option “showErrorOnce” ใน hook.

**ตัวอย่างแยกฟังก์ชันใน useAuthLogin:**

```typescript
// useAuthLogin.ts — extract helpers
function getAfterLoginPath(roleId: number | null | undefined): string {
  if (roleId === 4) return '/uikit/pageUser';
  if (roleId === 1 || roleId === 2) return '/uikit/MainBoard';
  return '/uikit/pageTechn';
}

function extractUserFromBody(body: any): UserProfile.UserLoginResponse | undefined {
  return body?.user ?? body?.data?.user;
}
// ใน handleLogin เรียก getAfterLoginPath(roleId) และ extractUserFromBody(body)
```

---

# 4. CSS / SCSS Architecture

## 4.1 Hard-coded values

- **Profile.css:** สีเช่น `#fff`, `#3f51b5`, `#6c757d`, `#f8f9fa`, `#e9ecef`, `#303f9f`, `#9fa8da`, ขนาด `12px`, `20px`, `30px`, `100px` ฯลฯ  
- **custom.scss:** `orange`, `rgb(46, 21, 107)`, `1rem`, `2.5rem`  
- **tabStyles.ts (CUSTOM_TAB_CSS):** `#6c757d`, `#dee2e6`

**แนวทาง:** ใช้ตัวแปรจาก `_variables.scss` (หรือสร้างเพิ่ม) แล้วอ้างอิงในที่เดียว.

**ตัวอย่างเพิ่มตัวแปรและใช้ใน Profile:**

```scss
// styles/layout/_variables.scss — ADD
$borderRadius: 12px;
$transitionDuration: 0.2s;
$colorPrimary: #3f51b5;
$colorPrimaryDark: #303f9f;
$colorPrimaryLight: #9fa8da;
$colorTextMuted: #6c757d;
$colorBorder: #dee2e6;
$colorBgDisabled: #f8f9fa;
$colorBorderDisabled: #e9ecef;
$spacingUnit: 8px;
$fontSizeBase: 1rem;
$avatarSize: 100px;
```

```css
/* Profile.css — AFTER (ใช้ CSS variables ที่มาจาก SCSS หรือกำหนดใน :root) */
.profile-container {
  background-color: var(--profile-bg, #fff);
  border-radius: var(--border-radius, 12px);
  padding: var(--spacing-lg, 30px);
}
.profile-container .profile-header h2 {
  color: var(--primary-color, #3f51b5);
}
.profile-container .btn-save {
  background-color: var(--primary-color);
}
.profile-container .btn-save:hover:not(:disabled) {
  background-color: var(--primary-color-dark, #303f9f);
}
```

หรือถ้าโปรเจกต์ใช้ SCSS ทั้งหมด ให้ import `_variables.scss` ใน Profile และใช้ `$colorPrimary` ฯลฯ แทนค่าตรง.

## 4.2 โครงสร้าง BEM / ลดความขัดแย้ง

- **Profile.css:** ใช้ prefix `.profile-container` ครอบแล้ว — ใกล้กับ BEM อยู่แล้ว (block = profile-container, elements อยู่ภายใน).  
- **custom.scss:** class เช่น `.request-card`, `.request-buttons` ไม่มี prefix — อาจทับกับที่อื่น. แนะนำให้ใช้ prefix ตามหน้า/ฟีเจอร์ เช่น `.page-request .request-card` หรือเปลี่ยนเป็น BEM เช่น `.request-card__buttons`.

## 4.3 Tab / Inline styles

- **tabStyles.ts:** ส่งสตริง CSS ผ่าน `dangerouslySetInnerHTML` — ทำงานได้แต่ไม่ใช้ตัวแปร SCSS. แนะนำย้ายไปเป็น SCSS class ใน `_variables.scss` หรือไฟล์ layout แล้วใช้ className แทน inline style string.

---

# 5. สรุปลำดับการแก้ไขที่แนะนำ

1. **วิกฤต:**  
   - แก้ useTicketTableTechn ให้โหลดข้อมูลจาก API และใช้ `statusFilter` ใน derived filter.  
   - ลบหรือรวม flow จาก login.d.tsx ให้เหลือเส้นทาง Login เดียว และไม่เขียน token ลง localStorage โดยตรงในไฟล์นั้น.
2. **Security (Production):**  
   - ร่วมกับ Backend ย้ายการเก็บ token ไปใช้ HttpOnly Cookie และใช้ `withCredentials: true` ใน Axios.  
   - รวม key ใน clearAppSession ให้ใช้จาก AUTH_KEYS เป็นหลัก.
3. **DRY:**  
   - รวม TicketActionMenu เป็น component เดียว.  
   - รวม FormDropdown เป็น component เดียวรับ optionLabel/optionValue.
4. **Clean Code:**  
   - แยก helper ใน useAuthLogin; ปรับ useCoreApi (dependency + serverErrorToastShown).
5. **CSS:**  
   - เพิ่มตัวแปรสี/ระยะใน _variables.scss และใช้ใน Profile.css / custom.scss / tabStyles; จัดโครง BEM/prefix ให้ชัด.

เมื่อทำครบตามลำดับ above โค้ดจะปลอดภัยขึ้น ลดซ้ำซ้อน และดูแลต่อได้ง่ายขึ้น.
