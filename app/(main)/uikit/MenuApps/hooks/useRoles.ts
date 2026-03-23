// src/uikit/MenuApps/hooks/useRoles.ts — GET /api/roles/selectrole (SuperAdmin, Admin, Staff, User)
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { RoleSelectItem } from '../types';

const ENDPOINT = 'roles/selectrole';

export function useRoles(enabled: boolean = true) {
    const [items, setItems] = useState<RoleSelectItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!enabled) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT, { signal });
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setItems(data.data);
            } else {
                setItems([]);
            }
        } catch (err: unknown) {
            if ((err as { name?: string })?.name === 'CanceledError') return;
            setItems([]);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) { setItems([]); return; }
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, enabled]);

    const options = items.map((r) => ({ label: r.name, value: r.id }));
    return { items, options, loading, fetchData };
}
