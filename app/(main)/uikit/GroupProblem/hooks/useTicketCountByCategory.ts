'use client';

import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';

const ENDPOINT = 'tickets/selectticket';

function normalizeCount(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: unknown[] }).data.length;
  }
  return 0;
}

/**
 * Fetches ticket count per category. Returns a map categoryId -> count.
 * Used on Group Problem page to show "N ລາຍການ" on each category card.
 */
export function useTicketCountByCategory(categoryIds: number[], shouldFetch: boolean) {
  const [countByCategory, setCountByCategory] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!shouldFetch || categoryIds.length === 0) {
      setCountByCategory({});
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        categoryIds.map(async (id) => {
          try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT, {
              params: { categoryId: id },
            });
            return { id, count: normalizeCount(response.data) };
          } catch {
            return { id, count: 0 };
          }
        })
      );
      const map: Record<number, number> = {};
      results.forEach(({ id, count }) => {
        map[id] = count;
      });
      setCountByCategory(map);
    } catch {
      setCountByCategory({});
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, categoryIds.join(',')]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { countByCategory, loading, refetch: fetchData };
}
