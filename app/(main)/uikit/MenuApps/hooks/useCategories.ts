import { useCoreApi } from './useCoreApi';
import { CategoryData, CreateCategoryPayload } from '../types';

/** Tab 0 หมวดหมู่: GET/POST/PUT/DELETE /api/categorys */
export function useCategories(triggerFetch: unknown, enabled: boolean = true) {
    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<
        CategoryData,
        CreateCategoryPayload
    >('categorys', {}, triggerFetch, enabled);

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: CategoryData) => deleteData(item.id),
        fetchData,
    };
}
