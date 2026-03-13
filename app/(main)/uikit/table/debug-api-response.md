# Debug: ตรวจสอบข้อมูลจาก API

## ปัญหา
Modal แสดงสถานะของช่างทั้งหมดเป็น "ລໍຖ້າຮັບວຽກ" เหมือนกันหมด แทนที่จะแสดงสถานะที่แตกต่างกันตามข้อมูลจริง

## ข้อมูลที่ควรได้จาก API

### GET /api/helpdeskrequests/admin
Response ควรมีโครงสร้างดังนี้:

```json
{
  "id": 78,
  "assignments": [
    {
      "id": 108,
      "assignedToId": 469,
      "helpdeskStatusId": 4,
      "helpdeskStatus": {
        "id": 4,
        "name": "ແກ້ໄຂແລ້ວ"
      },
      "assignedTo": {
        "employee": {
          "first_name": "ຊື່",
          "last_name": "ນາມສະກຸນ",
          "emp_code": "40939"
        }
      }
    }
  ]
}
```

## วิธีตรวจสอบ

### 1. เปิด Browser DevTools (F12)
- ไปที่แท็บ Network
- Refresh หน้าเว็บ
- หา request ไปที่ `/api/helpdeskrequests/admin`
- คลิกดูที่ Response

### 2. ตรวจสอบว่า assignments[] มี field เหล่านี้หรือไม่:
- ✅ `helpdeskStatusId` (number)
- ✅ `helpdeskStatus` (object with id and name)

### 3. ถ้าไม่มี field เหล่านี้
Backend API ต้องแก้ไขให้ส่งข้อมูล `helpdeskStatus` ของแต่ละ assignment มาด้วย

## โครงสร้างข้อมูลที่ถูกต้อง

```typescript
interface Assignment {
  id: number;                    // Assignment ID
  assignedToId: number;          // User ID ของช่าง
  helpdeskStatusId: number;      // ⭐ สถานะของ assignment นี้
  helpdeskStatus: {              // ⭐ ชื่อสถานะของ assignment นี้
    id: number;
    name: string;
  };
  assignedTo: {
    employee: {
      first_name: string;
      last_name: string;
      emp_code: string;
    }
  }
}
```

## สาเหตุที่แสดงผลไม่ถูกต้อง

ถ้า API ไม่ส่ง `helpdeskStatusId` และ `helpdeskStatus` มา:
- `statusId` จะเป็น `undefined`
- Modal จะใช้ fallback เป็น `ASSIGNEE_STATUS_MAP[user.status]`
- `user.status` มีค่า default เป็น `"waiting"` (จาก normalizeHelpdeskRow.ts line 67)
- ทำให้ทุกคนแสดงเป็น "ລໍຖ້າຮັບວຽກ" เหมือนกันหมด

## วิธีแก้ไข

### ถ้า Backend ส่งข้อมูลมาแล้ว แต่ Frontend ยังไม่แสดง:
ตรวจสอบว่า `normalizeHelpdeskRow.ts` ดึงข้อมูลถูกต้องหรือไม่

### ถ้า Backend ยังไม่ส่งข้อมูลมา:
Backend ต้องแก้ไข API `/api/helpdeskrequests/admin` ให้ include `helpdeskStatus` ของแต่ละ assignment

```sql
-- ตัวอย่าง SQL query ที่ต้องการ
SELECT 
  a.id,
  a.assignedToId,
  a.helpdeskStatusId,
  hs.id as helpdeskStatus_id,
  hs.name as helpdeskStatus_name
FROM assignments a
LEFT JOIN helpdeskStatus hs ON a.helpdeskStatusId = hs.id
WHERE a.helpdeskRequestId = ?
```
