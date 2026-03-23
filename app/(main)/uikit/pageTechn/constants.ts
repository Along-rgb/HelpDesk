// pageTechn/constants.ts

export const STATUS_OPTIONS = [
    { label: 'ທັງຫມົດ', value: 'Allin', icon: 'pi pi-th-large' },
    { label: 'ກຳລັງດຳເນີນການ', value: 'ກຳລັງດຳເນີນການ', icon: 'pi pi-spin pi-spinner' },
    { label: 'ລໍຖ້າຮັບເລື່ອງ', value: 'ລໍຖ້າຮັບເລື່ອງ', icon: 'pi pi-bell' },
    { label: 'ລໍຖ້າຮັບວຽກ', value: 'ລໍຖ້າຮັບວຽກ', icon: 'pi pi-clock' },
    { label: 'ແກ້ໄຂແລ້ວ', value: 'ແກ້ໄຂແລ້ວ', icon: 'pi pi-check-circle' },
    { label: 'ປິດວຽກແລ້ວ', value: 'ປິດວຽກແລ້ວ', icon: 'pi pi-check' },
    { label: 'ພັກໄວ້', value: 'ພັກໄວ້', icon: 'pi pi-pause' },
    { label: 'ຍົກເລີກ', value: 'ຍົກເລີກ', icon: 'pi pi-times' }
];

export const STATUS_MAP: Record<string, "success" | "info" | "warning" | "danger" | null> = {
    'ແກ້ໄຂແລ້ວ': 'success',
    'ກຳລັງດຳເນີນການ': 'info',
    'ລໍຖ້າຮັບເລື່ອງ': 'warning',
    'ລໍຖ້າຮັບວຽກ': 'warning',
    'ຍົກເລີກ': 'danger',
    'ຍົກເລິກ': 'danger',
    'ປິດວຽກແລ້ວ': 'success',
    'ພັກໄວ້': 'warning',
    'ພັກໃວ້': 'warning',
    'Allin': null
};

export const PRIORITY_OPTIONS = [
    { label: 'ບໍ່ລະບຸ', value: 'ບໍ່ລະບຸ' },
    { label: 'ສູງ', value: 'ສູງ' },
    { label: 'ກາງ', value: 'ກາງ' },
    { label: 'ຕ່ຳ', value: 'ຕ່ຳ' }
];

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
