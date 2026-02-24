import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';

export interface UseCoreApiOptions {
    /** เมื่อ true ບໍ່ແສງ toast "Server ມີຂໍ້ຜິດພາດ" ເມື່ອ GET ລົ້ມເຫຼວ (ໃຊ້ກັບ tab ສະຖານະ ເວັ້ນເກີດ error ຊ້ຳ) */
    silentFetchError?: boolean;
}

/** enabled=false: ไม่เรียก API (สำหรับ Role 1 หลีกเลี่ยง Forbidden ໃນ endpoint ที่ຫ້າມ) */
export function useCoreApi<T, P>(
    endpoint: string,
    queryParams: Record<string, unknown> = {},
    triggerFetch: unknown = null,
    enabled: boolean = true,
    options: UseCoreApiOptions = {}
) {
    const { silentFetchError = false } = options;
    const toast = useRef<Toast>(null);
    const queryParamsRef = useRef(queryParams);
    const serverErrorShownRef = useRef(false);
    const silentFetchErrorRef = useRef(silentFetchError);
    queryParamsRef.current = queryParams;
    silentFetchErrorRef.current = silentFetchError;

    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!endpoint || !enabled) return;
        const params = queryParamsRef.current;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(endpoint, { params });

            if (Array.isArray(response.data)) {
                setItems(response.data);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setItems(response.data.data);
            } else {
                setItems([]);
            }
            serverErrorShownRef.current = false;
        } catch (error: unknown) {
            setItems([]);
            const status = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { status?: number } }).response?.status
                : undefined;
            const skipToast = status === 403 || serverErrorShownRef.current || silentFetchErrorRef.current;
            if (!skipToast) {
                serverErrorShownRef.current = true;
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
    }, [endpoint, enabled]);

    useEffect(() => {
        if (enabled) fetchData();
        else setItems([]);
    }, [fetchData, triggerFetch, enabled]);

    // 2. Save Data (Create / Update)
    const saveData = async (payload: P, id?: number, options?: { noQueryParams?: boolean }) => {
        try {
            if (id) {
                await axiosClientsHelpDesk.put(`${endpoint}/${id}`, { ...payload });
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' });
            } else {
                const dataToSend = options?.noQueryParams ? { ...payload } : { ...payload, ...queryParamsRef.current };
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