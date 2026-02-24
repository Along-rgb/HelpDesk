// ສຳລັບການເຊື່ອຕໍໃຫ້ກັບ MenuApps/Detail-category_Service_Requests
// services/serviceRequestApi.ts
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk'; 

export interface ItemData {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt?: string;
}

export interface CreatePayload {
    name: string;
    description: string;
    status: string;
}

// baseURL มาจาก env.helpdeskApiUrl (config/axiosClientsHelpDesk) — ບໍ່ໃສ່ /api/ ຊ້ຳໃນ path
export const ServiceRequestApi = {
    // --- 1. หมวดหมู่ (Categories) ---
    getCategories: async () => {
        const response = await axiosClientsHelpDesk.get('master/categories');
        return response.data;
    },
    createCategory: async (data: CreatePayload) => {
        const response = await axiosClientsHelpDesk.post('master/categories', data);
        return response.data;
    },
    updateCategory: async (id: number, data: CreatePayload) => {
        const response = await axiosClientsHelpDesk.put(`master/categories/${id}`, data);
        return response.data;
    },
    deleteCategory: async (id: number) => {
        const response = await axiosClientsHelpDesk.delete(`master/categories/${id}`);
        return response.data;
    },

    // --- 2. รายการหัวข้อ (Services) ---
    getServices: async () => {
        const response = await axiosClientsHelpDesk.get('master/services');
        return response.data;
    },
    createService: async (data: CreatePayload) => {
        const response = await axiosClientsHelpDesk.post('master/services', data);
        return response.data;
    },
    updateService: async (id: number, data: CreatePayload) => {
        const response = await axiosClientsHelpDesk.put(`master/services/${id}`, data);
        return response.data;
    },
    deleteService: async (id: number) => {
        const response = await axiosClientsHelpDesk.delete(`master/services/${id}`);
        return response.data;
    }
};