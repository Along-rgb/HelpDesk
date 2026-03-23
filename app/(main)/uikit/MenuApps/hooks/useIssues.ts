import { useMemo, useCallback } from 'react';
import { useCoreApi } from './useCoreApi';
import { IssueData, CreateIssuePayload } from '../types';

/** API ສົ່ງຄືນ categoryId, Frontend ໃຊ້ parentId — ແປງໃຫ້ກົງກັນ (ອ້າງອີງ API.md: /api/tickets) */
type TicketRawItem = Omit<IssueData, 'parentId'> & { categoryId?: number };

/** Payload ທີ່ API /api/tickets ຮັບ: categoryId, title, description */
type TicketApiPayload = { categoryId?: number; title: string; description: string };

/** Tab 1 ລາຍການຫົວຂໍ້: GET/POST/PUT/DELETE /api/tickets (Parameter ໃຊ້ categoryId ບໍ່ແມ່ນ parentId) */
export function useIssues(triggerFetch: unknown, shouldFetch: boolean = true) {
    const endpoint = 'tickets';

    const { toast, items: rawItems, loading, saving, saveData: coreSaveData, deleteData, fetchData } = useCoreApi<
        TicketRawItem,
        TicketApiPayload
    >(endpoint, {}, triggerFetch, shouldFetch);

    /** Map categoryId จาก Backend ເປັນ parentId ໃຫ້ຕາຕະລາງ Frontend ໃຊ້ */
    const items = useMemo((): IssueData[] => {
        return rawItems.map((r) => ({
            ...r,
            parentId: r.categoryId ?? (r as IssueData).parentId,
        })) as IssueData[];
    }, [rawItems]);

    /** ແປງ parentId ກັບເປັນ categoryId ກ່ອນສົ່ງ API (POST/PUT) — PUT ຕ້ອງມີ categoryId ສະເໝີ */
    const saveData = useCallback(
        async (payload: CreateIssuePayload, id?: number) => {
            if (id != null && payload.parentId == null) {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'ກະລຸນາເລືອກໝວດໝູ່', life: 4000 });
                return false;
            }
            const apiPayload: TicketApiPayload = {
                title: payload.title,
                description: payload.description,
                ...(payload.parentId != null ? { categoryId: payload.parentId } : {}),
            };
            return coreSaveData(apiPayload, id);
        },
        [coreSaveData, toast]
    );

    return {
        toast,
        items,
        loading,
        saving,
        saveData,
        deleteData: (item: IssueData) => deleteData(item.id),
        fetchData,
    };
}