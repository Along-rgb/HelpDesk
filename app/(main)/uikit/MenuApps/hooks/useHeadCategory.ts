// src/uikit/MenuApps/hooks/useHeadCategory.ts
import { useCoreApi } from './useCoreApi';
import { HeadCategoryData, CreateHeadCategoryPayload, UpdateHeadCategoryPayload } from '../types';

/** Full CRUD on GET/POST/PUT/DELETE /api/headcategorys — returns nested department & division. Role 1 only. */
export function useHeadCategory(activeIndex: number, enabled: boolean = true) {
    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<
        HeadCategoryData,
        CreateHeadCategoryPayload | UpdateHeadCategoryPayload
    >('headcategorys', {}, activeIndex, enabled);

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: HeadCategoryData) => deleteData(item.id),
        fetchData,
    };
}
