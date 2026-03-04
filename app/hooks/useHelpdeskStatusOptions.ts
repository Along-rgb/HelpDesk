/**
 * Shared hook for helpdesk status list (helpdeskstatus/selecthelpdeskstatus).
 * Caches result in memory so multiple pages (table, pageTechn, request-history) do not refetch.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';
import { normalizeIdNameList } from '@/utils/apiNormalizers';

export interface HelpdeskStatusItem {
  id: number;
  name: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache: { list: HelpdeskStatusItem[]; fetchedAt: number } = { list: [], fetchedAt: 0 };

function isCacheValid(): boolean {
  return cache.list.length > 0 && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export function useHelpdeskStatusOptions(): {
  list: HelpdeskStatusItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [list, setList] = useState<HelpdeskStatusItem[]>(() =>
    isCacheValid() ? cache.list : []
  );
  const [loading, setLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (isCacheValid()) {
      setList(cache.list);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.STATUS_SELECT);
      const items = normalizeIdNameList(res.data);
      cache.list = items;
      cache.fetchedAt = Date.now();
      setList(items);
    } catch {
      setList([]);
      setError('ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດສະຖານະ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { list, loading, error, refetch: fetchStatus };
}
