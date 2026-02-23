// src/uikit/MenuApps/hooks/useHeadCategory.ts
import { useCoreApi } from './useCoreApi';
import { HeadCategoryData, CreateHeadCategoryPayload, UpdateHeadCategoryPayload } from '../types';

export function useHeadCategory(activeIndex: number, enabled: boolean = true) {
    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<
        HeadCategoryData,
        CreateHeadCategoryPayload | UpdateHeadCategoryPayload
    >('headcategorys/selectheadcategory', {}, activeIndex, enabled);

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: HeadCategoryData) => deleteData(item.id),
        fetchData,
    };
}
