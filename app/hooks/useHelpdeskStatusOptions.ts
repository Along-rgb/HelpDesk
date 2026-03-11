/**
 * Hook สำหรับรายการสถานะจาก helpdeskstatus/selecthelpdeskstatus.
 * ดึงจาก store/helpdesk (useHelpdeskStatusStore) — ที่เดียว ใช้ได้ทั้ง table, pageTechn, request-history
 */
'use client';

import { useEffect } from 'react';
import { useHelpdeskStatusStore } from '@/app/store/helpdesk';

export type { HelpdeskStatusItem } from '@/app/store/helpdesk';

export function useHelpdeskStatusOptions(): {
  list: { id: number; name: string }[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const list = useHelpdeskStatusStore((s) => s.list);
  const loading = useHelpdeskStatusStore((s) => s.loading);
  const error = useHelpdeskStatusStore((s) => s.error);
  const fetchStatus = useHelpdeskStatusStore((s) => s.fetchStatus);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { list, loading, error, refetch: fetchStatus };
}
