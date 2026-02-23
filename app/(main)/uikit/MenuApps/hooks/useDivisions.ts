// src/uikit/MenuApps/hooks/useDivisions.ts
import { useState, useEffect, useCallback } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { DivisionOption } from '../types';

export function useDivisions() {
    const [divisions, setDivisions] = useState<DivisionOption[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get('divisions');
            const data = response.data;
            const list = Array.isArray(data) ? data : data?.data;
            setDivisions(Array.isArray(list) ? list : []);
        } catch {
            setDivisions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const options = divisions.map((d) => ({ label: d.division_name, value: d.id }));
    return { divisions, options, loading, fetchData };
}
