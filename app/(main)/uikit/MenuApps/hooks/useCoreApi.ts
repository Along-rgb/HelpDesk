import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk';

// แสดง toast ເຂົ້າໃໝ່ Server ແຕ່ຄັ້ງດຽວ ເພື່ອບໍ່ໃຫ້ຊ້ຳທຸກ tabIndex
let serverErrorToastShown = false;

export function useCoreApi<T, P>(
    endpoint: string,
    queryParams: Record<string, any> = {},
    triggerFetch: any = null // ตัวแปรที่จะกระตุ้นให้โหลดใหม่ (เช่น activeIndex)
) {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Data
    const fetchData = useCallback(async () => {
        if (!endpoint) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(endpoint, {
                params: queryParams
            });

            if (Array.isArray(response.data)) {
                setItems(response.data);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setItems(response.data.data);
            } else {
                setItems([]);
            }
        } catch {
            setItems([]);
            if (!serverErrorToastShown) {
                serverErrorToastShown = true;
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Server ມີຂໍ້ຜິດພາດກະລຸນາລໍຖ້າ ຫຼື ລອງເຂົ້າໃໝ່ອີກຄັ້ງ',
                    life: 2000
                });
            }
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, JSON.stringify(queryParams)]);

    // Trigger Fetch เมื่อค่า triggerFetch เปลี่ยน (เช่น เปลี่ยน Tab)
    useEffect(() => {
        fetchData();
    }, [fetchData, triggerFetch]);

    // 2. Save Data (Create / Update)
    const saveData = async (payload: P, id?: number, options?: { noQueryParams?: boolean }) => {
        try {
            if (id) {
                await axiosClientsHelpDesk.put(`${endpoint}/${id}`, { ...payload });
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' });
            } else {
                const dataToSend = options?.noQueryParams ? { ...payload } : { ...payload, ...queryParams };
                await axiosClientsHelpDesk.post(endpoint, dataToSend);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
            }
            
            await fetchData(); // โหลดข้อมูลใหม่ทันที
            return true;
        } catch (error: unknown) {
            const msg = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message
                : null;
            const detail = msg && typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
            return false;
        }
    };

    // 3. Delete Data
    const deleteData = async (id: number) => {
        try {
            await axiosClientsHelpDesk.delete(`${endpoint}/${id}`);
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ລຶບຂໍ້ມູນສຳເລັດ' });
            await fetchData();
        } catch (error: unknown) {
            const msg = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            const detail = msg && typeof msg === 'string' ? msg : 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    };

    return { toast, items, loading, saveData, deleteData, fetchData };
}