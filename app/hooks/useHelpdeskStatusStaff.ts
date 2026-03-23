/**
 * Hook for staff-specific helpdesk status list (helpdeskstatus/staff).
 * Used by pageTechn Details dropdown (ລາຍລະອຽດ).
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';
import { normalizeIdNameList } from '@/utils/apiNormalizers';

export interface HelpdeskStatusStaffItem {
  id: number;
  name: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache: { list: HelpdeskStatusStaffItem[]; fetchedAt: number } = { list: [], fetchedAt: 0 };

function isCacheValid(): boolean {
  return cache.list.length > 0 && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export function useHelpdeskStatusStaff(): {
  list: HelpdeskStatusStaffItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [list, setList] = useState<HelpdeskStatusStaffItem[]>(() =>
    isCacheValid() ? cache.list : []
  );
  const [loading, setLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchStatus = useCallback(async () => {
    if (isCacheValid()) {
      setList(cache.list);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.STATUS_STAFF, { signal });
      const items = normalizeIdNameList(res.data);
      if (signal.aborted) return;
      cache.list = items;
      cache.fetchedAt = Date.now();
      setList(items);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setList([]);
      setError('ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດສະຖານະ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    return () => { abortRef.current?.abort(); };
  }, [fetchStatus]);

  return { list, loading, error, refetch: fetchStatus };
}
