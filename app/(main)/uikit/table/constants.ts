// table/constants.ts
// statusOptions for dropdown are built from API in useTicketTable (GET helpdeskstatus/selecthelpdeskstatus)

export const ASSIGNMENT_GROUPS = [
  {
        label: 'ຄອມພີວເຕີທົ່ວໄປ (Computer)',
        code: 'COMP',
        items: [
            { label: 'ທະນູຄຳ ວັນລາສີ', id: '1001', firstname: 'ທະນູຄຳ', lastname: 'ວັນລາສີ',Phonenumber:'020 55422254', value: 'TK' },
            { label: ' ແສງປີຊາ ທຳມະວົງ', id: '1002', firstname: ' ແສງປີຊາ', lastname: 'ທຳມະວົງ',Phonenumber:'020 51735702', value: 'SP' },
            { label: 'ສອນປະດິດ ສີຫາວົງ', id: '1003', firstname: 'ສອນປະດິດ', lastname: 'ສີຫາວົງ',Phonenumber:'020 55518311', value: 'SS' }
        ]
    },
    {
        label: 'ອິນເຕີເນັດ-ເນັດເວີກ (Internet-Network)',
        code: 'NET',
        items: [
            { label: 'User Network A', id: '2001', firstname: 'Network A', lastname: '', value: 'NA' },
            { label: 'User Network B', id: '2002', firstname: 'Network B', lastname: '', value: 'NB' }
        ]
    }
];

export const STATUS_MAP: Record<string, "success" | "info" | "warning" | "danger" | null> = {
    'ແກ້ໄຂແລ້ວ': 'success',
    'ກຳລັງດຳເນີນການ': 'info',
    'ລໍຖ້າຮັບເລື່ອງ': 'warning',
    'ລໍຖ້າຮັບວຽກ': 'warning',
    'ຍົກເລິກ': 'danger',
    'ປິດວຽກແລ້ວ': 'success',
    'ພັກໃວ້': 'warning',  // ໃ API
    'ສົ່ງອອກແປງນອກ': 'info',
    'Allin': null
};

/** Icons for status dropdown (ເລືອກສະຖານະ) — ตรงตาม UI: ติ๊กวงกลม, export, pause, check, วงกลมว่าง. */
export const STATUS_ICON_MAP: Record<string, string> = {
    'Allin': 'pi pi-th-large',
    'ກຳລັງດຳເນີນການ': 'pi pi-spin pi-spinner',
    'ລໍຖ້າຮັບເລື່ອງ': 'pi pi-bell',
    'ລໍຖ້າຮັບວຽກ': 'pi pi-clock',
    'ແກ້ໄຂແລ້ວ': 'pi pi-check-circle',
    'ປິດວຽກແລ້ວ': 'pi pi-check',
    'ພັກໃວ້': 'pi pi-pause',
    'ຍົກເລິກ': 'pi pi-circle',
    'ຍົກເລີກ': 'pi pi-circle',
    'ສົ່ງອອກແປງນອກ': 'pi pi-external-link'
};
export const STATUS_ICON_FALLBACK = 'pi pi-circle';

export const PRIORITY_OPTIONS = [
    { label: 'ບໍ່ລະບຸ', value: 'ບໍ່ລະບຸ' },
    { label: 'ສູງ', value: 'ສູງ' },
    { label: 'ກາງ', value: 'ກາງ' },
    { label: 'ຕ່ຳ', value: 'ຕ່ຳ' }
];

/** ความรุนแรงของ Tag ตามชื่อความสำคัญ (รองรับทั้งแบบเดิมและจาก API เช่น ທຳມະດາ) */
export const PRIORITY_MAP: Record<string, "success" | "info" | "warning" | "danger" | null> = {
    'ສູງ': 'danger',
    'ກາງ': 'warning',
    'ຕ່ຳ': 'success',
    'ບໍ່ລະບຸ': null,
    'ທຳມະດາ': null,
};

export const ASSIGNEE_STATUS_MAP: Record<string, { label: string; severity: string }> = {
    'doing': { label: 'ກຳລັງດຳເນີນການ', severity: 'info' },
    'done': { label: 'ສຳເລັດ', severity: 'success' },
    'waiting': { label: 'ລໍຖ້າຮັບວຽກ', severity: 'warning' },
    'default': { label: 'ທົ່ວໄປ', severity: 'secondary' }
};

// ✅ [NEW] ย้าย CSS มาไว้ที่นี่ เพื่อให้หน้า Page สะอาดขึ้น
export const CUSTOM_TOOLTIP_CSS = `
    .custom-red-tooltip .p-tooltip-text {
        background-color: #ffffff !important;
        color: #4b5563 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        font-size: 0.875rem;
        padding: 0.5rem 0.75rem !important;
    }
    .custom-red-tooltip.p-tooltip-top .p-tooltip-arrow { border-top-color: #ef4444 !important; }
    .custom-red-tooltip.p-tooltip-bottom .p-tooltip-arrow { border-bottom-color: #ef4444 !important; }
    .custom-red-tooltip.p-tooltip-left .p-tooltip-arrow { border-left-color: #ef4444 !important; }
    .custom-red-tooltip.p-tooltip-right .p-tooltip-arrow { border-right-color: #ef4444 !important; }
    .custom-red-tooltip { z-index: 99999 !important; }
`;