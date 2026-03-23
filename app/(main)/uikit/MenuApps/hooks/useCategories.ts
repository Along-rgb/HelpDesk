import { useCallback } from 'react';
import { useCoreApi } from './useCoreApi';
import { CategoryData, CreateCategoryPayload } from '../types';

/** Tab 0 หมวดหมู่: GET/POST/PUT/DELETE /api/categorys */
export function useCategories(triggerFetch: unknown, shouldFetch: boolean = true) {
    const { toast, items, loading, saving, saveData: coreSaveData, deleteData, fetchData } = useCoreApi<
        CategoryData,
        CreateCategoryPayload
    >('categorys', {}, triggerFetch, shouldFetch);

    /** PUT: ສົ່ງແຕ່ field ທີ່ແກ້ໄຂໄດ້ (title, description, catIconId) — ບໍ່ສົ່ງ headCategoryId ໄປທັບ */
    const saveData = useCallback(
        async (payload: CreateCategoryPayload, id?: number) => {
            if (id != null) {
                const { headCategoryId: _strip, ...updatePayload } = payload;
                return coreSaveData(updatePayload as CreateCategoryPayload, id);
            }
            return coreSaveData(payload);
        },
        [coreSaveData]
    );

    return {
        toast,
        items,
        loading,
        saving,
        saveData,
        deleteData: (item: CategoryData) => deleteData(item.id),
        fetchData,
    };
}