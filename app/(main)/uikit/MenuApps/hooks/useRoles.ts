// src/uikit/MenuApps/hooks/useRoles.ts — GET /api/roles/selectrole (SuperAdmin, Admin, Staff, User)
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { RoleSelectItem } from '../types';

const ENDPOINT = 'roles/selectrole';

export function useRoles(enabled: boolean = true) {
    const [items, setItems] = useState<RoleSelectItem[]>([]);
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
    }, [fetchData, enabled]);

    const options = items.map((r) => ({ label: r.name, value: r.id }));
    return { items, options, loading, fetchData };
}
