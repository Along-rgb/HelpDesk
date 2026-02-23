import axios from 'axios';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { env } from '@/config/env';
import { AUTH_FORBIDDEN_MSG } from '@/global/types/api';
import { TicketForm, MasterData, City, Ticket } from '@/app/(main)/uikit/invalidstate/types';
import { STATIC_CATEGORIES } from '@/app/(main)/uikit/invalidstate/ticketData';
import { getCurrentDateTimeString } from '@/utils/dateUtils';

const TICKETS_BASE = env.ticketsApiUrl;

// รูปแบบจาก API: { id: number, name: string }
interface BuildingApiItem {
    id: number;
    name: string;
}

// รูปแบบจาก API floors/selectfloor: { id, buildingId, name, building?: {...} }
interface FloorApiItem {
    id: number;
    buildingId?: number;
    name: string;
    building?: { id: number; name: string };
}

// รูปแบบจาก API turnings / turnings/selectturning: { id, name }
interface TurningApiItem {
    id: number;
    name: string;
}

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
const DB_ROUTES: City[] = [{ name: "ເສັ້ນທາງ 1" }, { name: "ເສັ້ນທາງ 2" }];
const DB_LEVELS: City[] = [{ name: "ຊັ້ນ 01" }, { name: "ຊັ້ນ 02" }];
const DB_ROOMS: City[] = [{ name: "101" }, { name: "102" }, { name: "103" }];

// ดึงรายการຕຶກ/ອາຄານ จาก API buildings/selectbuilding — JSON: { id, name }[] หรือ { data: [...] }
async function fetchBuildings(): Promise<City[]> {
    try {
        const response = await axiosClientsHelpDesk.get<BuildingApiItem[] | { data: BuildingApiItem[] }>('buildings/selectbuilding');
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : (raw as { data: BuildingApiItem[] })?.data ?? [];
        return list.map((item) => ({ name: item.name, code: String(item.id) }));
    } catch (error) {
        const err = error as { message?: string; response?: { status?: number } };
        const is403 = err?.response?.status === 403 || err?.message === AUTH_FORBIDDEN_MSG;
        if (is403) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.warn('[ticketService] GET buildings/selectbuilding 403 — ໃຊ້ລາຍການ fallback');
            }
            return DB_BUILDINGS;
        }
        console.error('Failed to fetch buildings', error);
        return DB_BUILDINGS;
    }
}

// ดึงລະດັບຊັ້ນ (floors) ຕາມ buildingId จาก API floors/selectfloor — JSON: { id, buildingId, name, building?: {...} }[]
async function fetchFloorsByBuilding(buildingId: string | number): Promise<City[]> {
    try {
        const response = await axiosClientsHelpDesk.get<FloorApiItem[] | { data: FloorApiItem[] }>('floors/selectfloor', {
            params: { buildingId: String(buildingId) },
        });
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : (raw as { data: FloorApiItem[] })?.data ?? [];
        return list.map((item) => ({ name: item.name, code: String(item.id) }));
    } catch (error) {
        const err = error as { message?: string; response?: { status?: number } };
        const is403 = err?.response?.status === 403 || err?.message === AUTH_FORBIDDEN_MSG;
        if (is403 || err?.response?.status === 404) {
            return [];
        }
        console.error('Failed to fetch floors', error);
        return [];
    }
}

// ดึงรายการເສັ້ນທາງ (turnings) จาก API turnings — JSON: { id, name }[] หรือ { data: [...] }
async function fetchTurnings(): Promise<City[]> {
    try {
        const response = await axiosClientsHelpDesk.get<TurningApiItem[] | { data: TurningApiItem[] }>('turnings');
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : (raw as { data: TurningApiItem[] })?.data ?? [];
        return list.map((item) => ({ name: item.name, code: String(item.id) }));
    } catch (error) {
        const err = error as { message?: string; response?: { status?: number } };
        const is403 = err?.response?.status === 403 || err?.message === AUTH_FORBIDDEN_MSG;
        if (is403) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.warn('[ticketService] GET turnings 403 — ໃຊ້ລາຍການ fallback');
            }
            return DB_ROUTES;
        }
        console.error('Failed to fetch turnings', error);
        return DB_ROUTES;
    }
}

// รายการເສັ້ນທາງໃຫ້ເລືອກ (dropdown) จาก API turnings/selectturning — JSON: { id, name }[]
export async function fetchTurningsForSelect(): Promise<City[]> {
    try {
        const response = await axiosClientsHelpDesk.get<TurningApiItem[] | { data: TurningApiItem[] }>('turnings/selectturning');
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : (raw as { data: TurningApiItem[] })?.data ?? [];
        return list.map((item) => ({ name: item.name, code: String(item.id) }));
    } catch (error) {
        const err = error as { message?: string; response?: { status?: number } };
        const is403 = err?.response?.status === 403 || err?.message === AUTH_FORBIDDEN_MSG;
        if (is403) {
            return DB_ROUTES;
        }
        console.error('Failed to fetch turnings/selectturning', error);
        return DB_ROUTES;
    }
}

export const ticketService = {

    getBuildings: fetchBuildings,
    getFloorsByBuilding: fetchFloorsByBuilding,

    // 1. Get Master Data (Dropdown) — buildings จาก API, routes จาก API turnings/selectturning (ເລືອກເສັ້ນທາງ), levels โหลดแยกตาม building
    getMasterData: async (): Promise<MasterData> => {
        const [buildings, routes] = await Promise.all([fetchBuildings(), fetchTurningsForSelect()]);
        return {
            categories: STATIC_CATEGORIES,
            buildings,
            routes,
            levels: [], // ລະດັບຊັ້ນໃຊ້ getFloorsByBuilding(buildingId) ແທນ
            rooms: DB_ROOMS
        };
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

    // 3. ✅ [EDITED] Create Ticket (Auto Increment ID) — requesterName = ชื่อผู้ขอ (firstName + lastName ของ user ที่ login)
    createTicket: async (formData: TicketForm, requesterName?: string) => {
        try {
            if (!formData.category || !formData.topic) {
                return { success: false, message: "ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນ (*)" };
            }

            // A. ดึงข้อมูล Tickets ทั้งหมดมาก่อน เพื่อหา ID ล่าสุด
            const existingTickets = await axios.get<Ticket[]>(`${TICKETS_BASE}/tickets`);
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

            // ຜູ້ຮ້ອງຂໍ = ชื่อ user ที่ login (firstName + lastName)
            const requesterDisplay = (requesterName && requesterName.trim()) ? requesterName.trim() : "ທ ທັດສະນີ ມີໄຊບົວ";

            // D. สร้าง Object ข้อมูลเตรียมบันทึก
            const newTicket = {
                id: nextId.toString(), // ✅ บังคับใส่ ID ที่เรียงลำดับแล้ว
                title: formData.topic.name,
                date: getCurrentDateTimeString(),
                requester: requesterDisplay,
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
            const response = await axios.post(`${TICKETS_BASE}/tickets`, newTicket);
            return { success: true, message: `ບັນທຶກຂໍ້ມູນສຳເລັດ!` };

        } catch (error) {
            console.error("Save Error:", error);
            return { success: false, message: "ບໍ່ສາມາດເຊື່ອມຕໍ່ Server ໄດ້" };
        }
    },

    // 4. Get Tickets
    getTickets: async (): Promise<Ticket[]> => {
        try {
            const res = await axios.get<Ticket[]>(`${TICKETS_BASE}/tickets`);
            return res.data;
        } catch (error) {
            console.error("Get tickets error:", error);
            throw error;
        }
    },

    // 5. Update Ticket
    updateTicket: async (ticket: Ticket) => {
        try {
            const response = await axios.put(`${TICKETS_BASE}/tickets/${ticket.id}`, ticket);
            return response.data;
        } catch (error) {
            console.error(`Error updating ticket ID ${ticket.id}:`, error);
            throw error;
        }
    }
};