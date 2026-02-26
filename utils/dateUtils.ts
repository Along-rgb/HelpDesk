// utils/dateUtils.ts

export const getCurrentDateTimeString = (): string => {
    const now = new Date();
    
    // ຈັດການ ວັນ/ເດືອນ/ປີ
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    // ຈັດການນເວລາ
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // ຖ້າເປັນ 0 ໃຫ້ປັດເປັນ 12

    // ໄດ້ຜົນລັບ : 19/11/2025 11:22 AM (ຕົວຢ່າງ)
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

/** Format ISO date string or Date to app standard: dd/mm/yyyy h:mm AM/PM */
export function formatDateTime(isoOrDate: string | Date): string {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}