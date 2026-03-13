// ຊື່ສະຖານະເພື່ອແສງຜົນ — ໃຊ້ທັງ tab 1, 2, 3, 4 (ວິຊາການ, ສະຖານະ, ພະນັກງານ)
const ROLE_DISPLAY_NAMES: Record<number, string> = {
    1: 'ຊູເປີແອັດມິນ',
    2: 'ແອັດມິນ',
    3: 'ວິຊາການ',
    4: 'ເປັນຜູ້ໃຊ້ງານ',
};

export function getRoleDisplayName(roleId: number | string | null | undefined): string {
    if (roleId == null) return '';
    const id = typeof roleId === 'string' ? Number(roleId) : roleId;
    if (!Number.isInteger(id)) return '';
    return ROLE_DISPLAY_NAMES[id] ?? '';
}
