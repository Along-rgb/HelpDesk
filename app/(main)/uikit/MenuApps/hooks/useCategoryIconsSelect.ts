// src/uikit/MenuApps/hooks/useCategoryIconsSelect.ts
import { useEffect, useCallback } from 'react';
import { useSelectDataStore } from '@/app/store/selectDataStore';

/** shouldFetch=false: ไม่เรียก API ເພື່ອຫຼີກເວັ້ນ 403 */
export function useCategoryIconsSelect(triggerFetch: unknown = null, shouldFetch: boolean = true) {
    const items = useSelectDataStore((s) => s.categoryIcons);
    const loading = useSelectDataStore((s) => s.iconsLoading);
    const fetchCategoryIcons = useSelectDataStore((s) => s.fetchCategoryIcons);

    useEffect(() => {
        if (shouldFetch) fetchCategoryIcons();
    }, [shouldFetch, triggerFetch, fetchCategoryIcons]);

    const fetchData = useCallback(() => fetchCategoryIcons(true), [fetchCategoryIcons]);

    return { items, loading, fetchData };
}
