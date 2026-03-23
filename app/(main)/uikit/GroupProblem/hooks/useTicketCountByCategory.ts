'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSelectDataStore } from '@/app/store/selectDataStore';

/**
 * Fetches ticket count per category. Returns a map categoryId -> count.
 * Used on Group Problem page to show "N ລາຍການ" on each category card.
 * Backed by Zustand store for instant navigation (zero-loading on revisit).
 */
export function useTicketCountByCategory(categoryIds: number[], shouldFetch: boolean) {
  const countByCategory = useSelectDataStore((s) => s.ticketCountByCategory);
  const loading = useSelectDataStore((s) => s.countsLoading);
  const fetchTicketCounts = useSelectDataStore((s) => s.fetchTicketCounts);

  const idsKey = useMemo(() => categoryIds.join(','), [categoryIds]);

  useEffect(() => {
    if (shouldFetch && categoryIds.length > 0) fetchTicketCounts(categoryIds);
  }, [shouldFetch, idsKey, fetchTicketCounts]);

  const refetch = useCallback(() => fetchTicketCounts(categoryIds, true), [categoryIds, fetchTicketCounts]);

  return { countByCategory, loading, refetch };
}
