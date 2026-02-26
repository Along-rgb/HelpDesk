'use client';

import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { TicketSelectItem } from '../types/selectTicket';

const ENDPOINT = 'tickets/selectticket';

function normalizeResponse(data: unknown): TicketSelectItem[] {
  if (Array.isArray(data)) {
    return data.map((item: Record<string, unknown>) => ({
      id: Number(item.id),
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
      categoryId: item.categoryId != null ? Number(item.categoryId) : undefined,
    }));
  }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return normalizeResponse((data as { data: unknown[] }).data);
  }
  return [];
}

/**
 * Fetches tickets/sub-issues for a category from /api/tickets/selectticket?categoryId=...
 * Uses authenticated axios client (Role 1, 3, 4).
 */
export function useSelectTickets(categoryId: number | null, shouldFetch: boolean) {
  const [items, setItems] = useState<TicketSelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!shouldFetch || categoryId == null) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClientsHelpDesk.get(ENDPOINT, {
        params: { categoryId },
      });
      const list = normalizeResponse(response.data);
      setItems(list);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດລາຍການຫົວຂໍ້');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, shouldFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refetch: fetchData };
}
