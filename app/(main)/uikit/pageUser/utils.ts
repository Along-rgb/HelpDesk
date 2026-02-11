// สร้างไฟล์ app/(main)/uikit/pageUser/utils.ts เพื่อเก็บฟังก์ชันการตัดคำ

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};
/**
 * ฟังก์ชันสร้าง ID สำหรับ Tooltip เพื่อไม่ให้ซ้ำกันและไม่มีช่องว่าง
 */
export const generateTooltipId = (id: string): string => {
    return `tooltip-${id.replace(/\s+/g, '-')}`;
};