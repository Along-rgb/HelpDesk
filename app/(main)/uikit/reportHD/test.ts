// src/app/reports/test.ts
import { ReportItem, ReportFilter } from './types';

// 1. ສ້າງຂໍ້ມູນຈຳລອງ (Mock Data)
const MOCK_DATA: ReportItem[] = [
    // Group: ທ້າວ ສົມສັກ (ຊ່າງໄຟ)
    {
        id: 1,
        code: "REQ-2023-001",
        topic: "ໄຟຟ້າ",
        category: "ສ້ອມແປງ",
        technician: "ທ້າວ ສົມສັກ",
        detail: "ດອກໄຟຫ້ອງປະຊຸມຂາດ 2 ດອກ ແລະ ມີອາການກະພິບຕະຫຼອດເວລາ ເຮັດໃຫ້ແສງສະຫວ່າງບໍ່ພຽງພໍຕໍ່ການປະຊຸມ ຮົບກວນການເຮັດວຽກຫຼາຍ ຕ້ອງການໃຫ້ປ່ຽນດ່ວນ",
        requester: "ສົມຊາຍ ໃຈດີ",
        department_main: "ບໍລິຫານ",
        department_sub: "ຫ້ອງການບໍລິຫານທົ່ວໄປ ແລະ ຈັດຊື້ຈັດຈ້າງ",
        building: "ຕືກສຳນັກງານໃຫຍ່ ຟຟລ",
        floor: "3",
        room: "301",
        date: "2023-10-25",
        note: "ກະລຸນາເຂົ້າມາກວດສອບດ່ວນ ກ່ອນເວລາ 14:00 ເພາະຈະມີປະຊຸມຜູ້ບໍລິຫານລະດັບສູງ"
    },
    {
        id: 3,
        code: "REQ-2023-003",
        topic: "ໄຟຟ້າ",
        category: "ສ້ອມແປງ",
        technician: "ທ້າວ ສົມສັກ",
        detail: "ປັກສຽບໄຟບໍ່ມີໄຟ ໃຊ້ງານບໍ່ໄດ້ ລອງສຽບຫຼາຍອຸປະກອນແລ້ວກໍບໍ່ຕິດ ຄາດວ່າສາຍທາງໃນອາດຈະຂາດ ຫຼື ເບັ້ກເກີຕັດ",
        requester: "ຄຳສິງ",
        department_main: "ບໍລິຫານ",
        department_sub: "ຈັດຊື້",
        building: "ຕືກສຳນັກງານໃຫຍ່ ຟຟລ",
        floor: "2",
        room: "205",
        date: "2023-10-26",
        note: "-"
    },

    // Group: ທ້າວ ບຸນມີ (ຊ່າງປະປາ)
    {
        id: 2,
        code: "REQ-2023-002",
        topic: "ນ້ຳປະປາ",
        category: "ສ້ອມແປງ",
        technician: "ທ້າວ ບຸນມີ",
        detail: "ທໍ່ນ້ຳຮົ່ວຢູ່ຫ້ອງນ້ຳຊາຍ ນ້ຳໄຫຼນອງເຕັມພື້ນ ເຮັດໃຫ້ພື້ນປຽກຊຸ່ມ ອາດເກີດອຸປະຕິເຫດລື່ນລົ້ມໄດ້ ຕ້ອງການໃຫ້ມາດຳເນີນການປິດວາວ ແລະ ສ້ອມແປງໂດຍດ່ວນ",
        requester: "ວິໄລ",
        department_main: "ການເງິນ ແລະ ບັນຊີ",
        department_sub: "ບັນຊີ",
        building: "ຕືກສະຖາບັນ",
        floor: "1",
        room: "102",
        date: "2026-01-26", 
        note: "ຮີບດ່ວນທີ່ສຸດ (Urgent)"
    },

    // Group: ນາງ ມະນີ (IT Support)
    {
        id: 4,
        code: "REQ-2023-004",
        topic: "IT ແລະ ຄອມພິວເຕີ",
        category: "ຂໍໃຊ້ບໍລິການ",
        technician: "ນາງ ມະນີ",
        detail: "ຂໍຕິດຕັ້ງໂປຣແກຣມ Microsoft Office 2021 Professional Plus ລິຂະສິດແທ້ ເນື່ອງຈາກເຄື່ອງເກົ່າຫມົດອາຍຸການໃຊ້ງານ ແລະ ຕ້ອງການໃຊ້ Visio ເພີ່ມເຕີມ",
        requester: "ນ້ອຍ",
        department_main: "ບຸກຄົນ",
        department_sub: "HR & Recruitment",
        building: "ຕືກສະຖາບັນ ",
        floor: "4",
        room: "401",
        date: "2023-10-27",
        note: "ຖ້າເປັນໄປໄດ້ຂໍມື້ນີ້"
    },
    {
        id: 5,
        code: "REQ-2023-005",
        topic: "IT ແລະ ຄອມພິວເຕີ",
        category: "ສ້ອມແປງ",
        technician: "ນາງ ມະນີ",
        detail: "ເປີດເຄື່ອງບໍ່ຕິດ (Blue Screen) error code: 0x000000 ພະຍາຍາມ restart ຫຼາຍຮອບແລ້ວແຕ່ຍັງຄືເກົ່າ ມີຂໍ້ມູນສຳຄັນຢູ່ໃນ Drive D ຕ້ອງການກູ້ຂໍ້ມູນດ່ວນ",
        requester: "ແກ້ວ",
        department_main: "ບຸກຄົນ",
        department_sub: "HR",
        building: "ຕືກສຳນັກງານໃຫຍ່ ຟຟລ",
        floor: "4",
        room: "402",
        date: "2023-10-27",
        note: "ລໍຖ້າອາໄຫຼ່ (Harddisk ໂຕໃໝ່)"
    },
    
    // Group: ບໍ່ລະບຸ (ສຳລັບທົດສອບກໍລະນີບໍ່ມີຊ່າງ)
    {
        id: 6,
        code: "REQ-2023-006",
        topic: "ອື່ນໆ",
        category: "ທົ່ວໄປ",
        // technician: ບໍ່ໃສ່ ເພື່ອທົດສອບ case null
        detail: "ຍ້າຍໂຕະປະຊຸມ ຈາກຕຶກ A ຊັ້ນ 1 ໄປຕຶກ B ຊັ້ນ 3 ຈຳນວນ 5 ໜ່ວຍ ແລະ ຕັ່ງ 20 ໜ່ວຍ ພ້ອມຈັດລຽງໃຫ້ຮຽບຮ້ອຍຕາມຜັງທີ່ແນບມາ",
        requester: "ຄຳ",
        department_main: "ບໍລິຫານ",
        department_sub: "ທົ່ວໄປ",
        building: "ຕືກສຳນັກງານໃຫຍ່ ຟຟລ",
        floor: "1",
        room: "Hall",
        date: "2023-10-28",
        note: "ລະວັງຂອງເສຍຫາຍ"
    }
];

export const ReportService = {
    getReports: async (filter: ReportFilter, signal?: AbortSignal): Promise<ReportItem[]> => {
        // Simulate API Delay
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Fetching mock data with filter:", filter);
        
        // เริ่มต้นด้วยข้อมูลทั้งหมด
        let filteredData = MOCK_DATA;

        // ✅ เพิ่ม Logic กรองวันที่ (Date Filter)
        if (filter.startDate && filter.endDate) {
            // ตั้งเวลา Start เป็น 00:00:00
            const startDate = new Date(filter.startDate);
            startDate.setHours(0, 0, 0, 0);

            // ตั้งเวลา End เป็น 23:59:59
            const endDate = new Date(filter.endDate);
            endDate.setHours(23, 59, 59, 999);

            filteredData = filteredData.filter((item) => {
                const itemDate = new Date(item.date);
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        return filteredData;
    }
};