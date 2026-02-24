import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { IconItemData, CreateIconPayload } from '../types';
import { getCategoryIconFullUrl } from '../utils/iconUrl';

const ENDPOINT = 'categoryicons';

/** Tab 2 ເພີ່ມໄອຄອນ: GET/DELETE /api/categoryicons, POST/PUT with FormData (catIcon = file) */
export function useCategoryIcons(triggerFetch: unknown, shouldFetch: boolean = true) {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<IconItemData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!ENDPOINT || !shouldFetch) return;
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
    }, [shouldFetch]);

    useEffect(() => {
        if (shouldFetch) {
            setLoading(true); // ໃຫ້ loading=true ກ່ອນ fetch ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນເປີດໜ້າ/refresh
            fetchData();
        }
        // ບໍ່ລ້າງ items ເມື່ອ shouldFetch ເປັນ false — ເກັບ cache ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນສະຫຼັບ tab
    }, [fetchData, triggerFetch, shouldFetch]);

    const saveData = useCallback(
        async (payload: CreateIconPayload, id?: number): Promise<boolean> => {
            try {
                if (!id && !payload.iconFile) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'ກະລຸນາເລືອກຮູບໄອຄອນ',
                        life: 4000,
                    });
                    return false;
                }
                const form = new FormData();
                if (payload.iconFile) {
                    form.append('catIcon', payload.iconFile);
                }
                if (id) {
                    await axiosClientsHelpDesk.put(`${ENDPOINT}/${id}`, form);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ',
                    });
                } else {
                    await axiosClientsHelpDesk.post(ENDPOINT, form);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'ເພີ່ມຂໍ້ມູນສຳເລັດ',
                    });
                }
                await fetchData();
                return true;
            } catch (error: unknown) {
                const msg =
                    error &&
                    typeof error === 'object' &&
                    'response' in error
                        ? (error as { response?: { data?: { message?: string } } }).response?.data
                              ?.message
                        : null;
                const detail =
                    msg && typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ';
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail,
                    life: 4000,
                });
                return false;
            }
        },
        [fetchData]
    );

    const deleteData = useCallback(
        async (id: number) => {
            try {
                await axiosClientsHelpDesk.delete(`${ENDPOINT}/${id}`);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'ລຶບຂໍ້ມູນສຳເລັດ',
                });
                await fetchData();
            } catch (error: unknown) {
                const msg =
                    error &&
                    typeof error === 'object' &&
                    'response' in error
                        ? (error as { response?: { data?: { message?: string } } }).response?.data
                              ?.message
                        : null;
                const detail =
                    msg && typeof msg === 'string' ? msg : 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ';
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail,
                    life: 4000,
                });
            }
        },
        [fetchData]
    );

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: IconItemData) => deleteData(item.id),
        fetchData,
    };
}

/** ปรับ response ให้เป็น IconItemData และแปลงชื่อไฟล์เป็น URL เต็มสำหรับแสดงรูป */
function normalizeIconItem(row: { id: number; sortOrder?: number; iconUrl?: string; catIcon?: string; createdAt?: string }): IconItemData {
    const raw = row.iconUrl ?? row.catIcon ?? '';
    const iconUrl = getCategoryIconFullUrl(raw);
    return {
        id: row.id,
        sortOrder: row.sortOrder ?? 0,
        iconUrl,
        catIcon: row.catIcon,
        createdAt: row.createdAt,
    };
}
