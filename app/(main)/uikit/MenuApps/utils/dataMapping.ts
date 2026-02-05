// src/utils/dataMapping.ts

/**
 * แปลง Array ของ Object ให้เป็น Map (Dictionary) โดยใช้ ID เป็น Key
 * ช่วยให้การค้นหาข้อมูล (Join) เร็วขึ้นจาก O(N) เป็น O(1)
 */
export function createDataMap<T>(items: T[], keyField: keyof T, labelField: keyof T): Map<string | number, string> {
    const map = new Map<string | number, string>();
    items.forEach(item => {
        const key = item[keyField] as unknown as (string | number);
        const label = item[labelField] as unknown as string;
        map.set(key, label);
    });
    return map;
}