import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { IconItemData } from '../types';
import { getCategoryIconProxyUrl } from '../utils/iconUrl';

/** ตาม API.md: GET /api/categoryicons ได้เฉพาะ Role 1 (SuperAdmin). ใช้ select endpoint เพื่อให้ Role 2 โหลดรายการไอคอนได้ (แสดงบนการ์ดเมนู) */
const ENDPOINT = 'categoryicons/selectcategoryicon';

function normalizeIconItem(row: { id: number; sortOrder?: number; iconUrl?: string; catIcon?: string; createdAt?: string }): IconItemData {
    const raw = row.iconUrl ?? row.catIcon ?? '';
    return {
        id: row.id,
        sortOrder: row.sortOrder ?? 0,
        iconUrl: getCategoryIconProxyUrl(raw),
        catIcon: row.catIcon ?? '',
        createdAt: row.createdAt,
    };
}

/** ใช้สำหรับการ์ดเมนู "ການແຈ້ງບັນຫາ" — ดึงรายการไอคอนจาก select endpoint (Role 2 ເຂົ້າເຖິງໄດ້) */
export function useIssueIcons(_activeIndex: number) {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<IconItemData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT);
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data.map(normalizeIconItem));
            } else if (data?.data && Array.isArray(data.data)) {
                setItems(data.data.map(normalizeIconItem));
            } else {
                setItems([]);
            }
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        toast,
        items,
        loading,
        saveData: async () => false,
        deleteData: async () => {},
    };
}
