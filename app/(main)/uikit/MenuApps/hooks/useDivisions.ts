// src/uikit/MenuApps/hooks/useDivisions.ts
import { useState, useEffect, useCallback } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { DivisionOption } from '../types';

/** enabled=false: ບໍ່ເອີ້ນ GET /api/divisions (Role 2 ໄດ້ 403). */
export function useDivisions(enabled: boolean = true) {
    const [divisions, setDivisions] = useState<DivisionOption[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!enabled) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get('divisions', { signal });
            const data = response.data;
            const list = Array.isArray(data) ? data : data?.data;
            setDivisions(Array.isArray(list) ? list : []);
        } catch (err: unknown) {
            if ((err as { name?: string })?.name === 'CanceledError') return;
            setDivisions([]);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) { setDivisions([]); setLoading(false); return; }
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, enabled]);

    const options = divisions.map((d) => ({ label: d.division_name, value: d.id }));
    return { divisions, options, loading, fetchData };
}
