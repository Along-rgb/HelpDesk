# Helpdesk Store (Global State)

Business logic และ API state ของ Helpdesk อยู่ที่ store นี้ แยกตามโดเมน ตามแนวทาง Clean Code

## โครงสร้าง

- **types.ts** — Re-export types จาก `uikit/MenuApps/types` (ศูนย์รวม type)
- **supportTeamStore.ts** — ທິມສະໜັບສະໜູນ, head category (full + select), divisions, roles, admin users, user roles
- **buildingStore.ts** — ຕຶກ/ອາຄານ, ລະດັບຊັ້ນ (buildings, floors)
- **issueStore.ts** — ໝວດໝູ່, ລາຍການຫົວຂໍ້ (categories, tickets)
- **reportStore.ts** — ລາຍງານ (report data)

## Initial State

- ทุก state ที่เป็น **Array** เริ่มต้นด้วย `[]`
- ทุก state ที่เป็น **Object** เริ่มต้นด้วย `{}` หรือไม่ใช้ `null`/`undefined` เพื่อป้องกัน "Cannot convert undefined or null to object"

## Error & Toast

- Store ใช้ `getApiErrorMessage()` จาก `@/utils/errorMessage` ใน catch
- หน้า UI ใช้ `useStoreToast(toastRef, { error, successMessage, clearMessages })` จาก `@/app/hooks/useStoreToast`

## Shared Utils

- **normalizeDataList** จาก `@/utils/apiNormalizers` (ไม่ซ้ำใน store)
- **getApiErrorMessage** จาก `@/utils/errorMessage`

## หน้าที่ใช้ Store แล้ว

- **Buildings** — `useBuildingStore` + `useStoreToast`
- **Report HD** — `useReportStore`
- **Support Team** — `useSupportTeamStore` + `useStoreToast` (Pure UI)

## หน้าที่ยังใช้ Hooks

- **Issues** — ใช้ `useIssueStore` ได้ (categories + tickets)

## Performance: ใช้ Selector ใน UI

- ดึง state ด้วย **selector** เพื่อให้ component re-render เฉพาะเมื่อค่าที่เลือกเปลี่ยน
- ตัวอย่าง: `const items = useIssueStore((s) => s.items);` หรือหลายค่า: `useSupportTeamStore(useShallow((s) => ({ items: s.items, loading: s.loading })))`
- สำหรับ **actions** ใน effect/handler ใช้ `useXxxStore.getState().actionName()` เพื่อไม่ subscribe store

## DataTable Safety

ใน uikit ใช้ `value={data ?? []}` สำหรับ `<DataTable value={...} />` เพื่อป้องกัน runtime crash
