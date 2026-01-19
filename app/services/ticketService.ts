import axios from 'axios';
// ปรับ import ให้ตรงกับโครงสร้างไฟล์ของคุณ
import { TicketForm, MasterData, City, Ticket } from '../../app/(main)/uikit/invalidstate/types';
// *** Import ข้อมูลกลางมาใช้ ***
import { STATIC_CATEGORIES } from '../../app/(main)/uikit/invalidstate/ticketData';
import { getCurrentDateTimeString } from '../../utils/dateUtils';

const API_URL = "http://localhost:3501";

// --- Mock Data (Dropdown) ---
// ใช้สำหรับ Dependent Dropdown (เลือกหมวดหมู่ -> แสดงหัวข้อ)
const DB_TOPICS: Record<string, City[]> = {
    "IT": [{ name: "ເປີດເຄື່ອງບໍ່ຕິດ" }, { name: "ຈໍພາບບໍ່ສະແດງຜົນ" }],
    "NET": [{ name: "ອິນເຕີເນັດຊ້າ" }, { name: "ເຊື່ອມຕໍ່ WiFi ບໍ່ໄດ້" }],
    "SOFT": [{ name: "ໂປຣແກຣມຄ້າງ" }, { name: "ເຂົ້າລະບົບບໍ່ໄດ້" }],
    "PHONE": [{ name: "ໂທລະສັບໂທບໍ່ໄດ້" }, { name: "ສຽງບໍ່ໄດ້ຍິນ" }],
    "SerCOM": [{ name: "ຂໍ ແປ້ນພີມໃໝ່" }, { name: "ຂໍຄອມໃໝ່" }],
    "SerSOFT": [{ name: "ຂໍ Anti-Virus" }, { name: "ຂໍລົງໄອດີໃໝ່" }],
    "SerOTHER": [{ name: "ຂໍໂຕະໃໝ່" }, { name: "ຂໍເບີກເຄື່ອງໃຊ້ຫ້ອງການທົ່ວໄປ" }],
};
const DB_BUILDINGS: City[] = [{ name: "ຕືກ ສຳນັກງານໃຫຍ່" }, { name: "ຕືກ ສະຖາບັນ" }];
const DB_LEVELS: City[] = [{ name: "ຊັ້ນ 01" }, { name: "ຊັ້ນ 02" }];
const DB_ROOMS: City[] = [{ name: "101" }, { name: "102" }, { name: "103" }];

export const ticketService = {

    // 1. Get Master Data (Dropdown)
    getMasterData: async (): Promise<MasterData> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    categories: STATIC_CATEGORIES, // ใช้ข้อมูลกลางจาก ticketData.ts
                    buildings: DB_BUILDINGS,
                    levels: DB_LEVELS,
                    rooms: DB_ROOMS
                });
            }, 300);
        });
    },

    // 2. Get Topics (Dependent Dropdown)
    getTopicsByCategory: async (categoryCode: string): Promise<City[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // @ts-ignore
                const topics = DB_TOPICS[categoryCode] || [];
                resolve(topics);
            }, 200);
        });
    },

    // 3. ✅ [EDITED] Create Ticket (Auto Increment ID)
    createTicket: async (formData: TicketForm) => {
        try {
            if (!formData.category || !formData.topic) {
                return { success: false, message: "ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນ (*)" };
            }

            // A. ดึงข้อมูล Tickets ทั้งหมดมาก่อน เพื่อหา ID ล่าสุด
            const existingTickets = await axios.get<Ticket[]>(`${API_URL}/tickets`);
            const tickets = existingTickets.data;

            // B. คำนวณหา Max ID
            let maxId = 0;
            if (tickets && tickets.length > 0) {
                tickets.forEach((t) => {
                    const currentId = Number(t.id);
                    if (!isNaN(currentId) && currentId > maxId) {
                        maxId = currentId;
                    }
                });
            }

            // C. สร้าง ID ใหม่ (Max + 1)
            const nextId = maxId + 1;

            // D. สร้าง Object ข้อมูลเตรียมบันทึก
            const newTicket = {
                id: nextId.toString(), // ✅ บังคับใส่ ID ที่เรียงลำดับแล้ว
                title: formData.topic.name,
                date: getCurrentDateTimeString(),
                requester: "ທ ທັດສະນີ ມີໄຊບົວ",
                assignees: [],
                status: "ລໍຖ້າຮັບວຽກ",
                priority: "ບໍ່ລະບຸ",
                verified: false,
                category: formData.category.name,
                building: formData.building?.name || "-",
                level: formData.level?.name || "-",
                room: formData.roomNumber?.name || "-",
                description: formData.description || "-"
            };

            // E. ส่งข้อมูลไปยัง API
            const response = await axios.post(`${API_URL}/tickets`, newTicket);
            return { success: true, message: `ບັນທຶກຂໍ້ມູນສຳເລັດ!` };

        } catch (error) {
            console.error("Save Error:", error);
            return { success: false, message: "ບໍ່ສາມາດເຊື່ອມຕໍ່ Server ໄດ້" };
        }
    },

    // 4. Get Tickets
    getTickets: async (): Promise<Ticket[]> => {
        try {
            const res = await axios.get<Ticket[]>(`${API_URL}/tickets`);
            return res.data;
        } catch (error) {
            console.error("Get tickets error:", error);
            throw error;
        }
    },

    // 5. Update Ticket
    updateTicket: async (ticket: Ticket) => {
        try {
            const response = await axios.put(`${API_URL}/tickets/${ticket.id}`, ticket);
            return response.data;
        } catch (error) {
            console.error(`Error updating ticket ID ${ticket.id}:`, error);
            throw error;
        }
    }
};