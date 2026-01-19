import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk'; // ปรับ path ให้ตรงกับที่อยู่ไฟล์ axios ของคุณ

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
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            setItems([]);
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
    const saveData = async (payload: P, id?: number) => {
        try {
            // รวม params (เช่น type, role) เข้าไปกับ payload
            const dataToSend = { ...payload, ...queryParams };

            if (id) {
                await axiosClientsHelpDesk.put(`${endpoint}/${id}`, dataToSend);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' });
            } else {
                await axiosClientsHelpDesk.post(endpoint, dataToSend);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
            }
            
            await fetchData(); // โหลดข้อมูลใหม่ทันที
            return true;
        } catch (error) {
            console.error("Failed to save:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ' });
            return false;
        }
    };

    // 3. Delete Data
    const deleteData = async (id: number) => {
        try {
            await axiosClientsHelpDesk.delete(`${endpoint}/${id}`);
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ລຶບຂໍ້ມູນສຳເລັດ' });
            await fetchData();
        } catch (error) {
            console.error("Failed to delete:", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ' });
        }
    };

    return { toast, items, loading, saveData, deleteData, fetchData };
}