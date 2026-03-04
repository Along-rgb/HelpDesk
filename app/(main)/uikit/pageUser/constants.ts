// app/(main)/uikit/pageUser/constants.ts
/** severity สำหรับ Tag ສະຖານະ — ຕົງກັບ helpdeskstatus/selecthelpdeskstatus */
export const STATUS_MAP: Record<string, string> = {
    'ໃໝ່': 'info',
    'ລໍຖ້າຮັບວຽກ': 'info',
    'ກຳລັງດຳເນີນການ': 'warning',
    'ແກ້ໄຂແລ້ວ': 'success',
    'ສົ່ງອອກແປງນອກ': 'info',
    'ພັກໃວ້': 'warning',
    'ປິດວຽກແລ້ວ': 'success',
    'ຍົກເລິກ': 'danger',
    'ສຳເລັດແລ້ວ': 'success',
    'ຖືກປະຕິເສດ': 'danger'
};