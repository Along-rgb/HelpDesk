// src/uikit/MenuApps/hooks/useCategoryIconsSelect.ts
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { CategoryIconSelectItem } from '../types';

/** ເລືອກຮູບໄອຄອນ — response: array of { id, catIcon?, sortOrder?, ... } */
const ENDPOINT = 'categoryicons/selectcategoryicon';

export function useCategoryIconsSelect(triggerFetch: unknown = null, enabled: boolean = true) {
    const [items, setItems] = useState<CategoryIconSelectItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT);
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setItems(data.data);
            } else {
                setItems([]);
            }
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        if (enabled) fetchData();
        else setItems([]);
    }, [fetchData, triggerFetch, enabled]);

    return { items, loading, fetchData };
}
