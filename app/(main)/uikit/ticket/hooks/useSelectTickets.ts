'use client';

import { useEffect, useCallback } from 'react';
import { useSelectDataStore } from '@/app/store/selectDataStore';
import type { TicketSelectItem } from '@/app/(main)/uikit/ticket/types/selectTicket';

/** Stable empty array — avoids creating a new [] on every selector call */
const EMPTY_ITEMS: TicketSelectItem[] = [];

/**
 * Fetches tickets/sub-issues for a category from /api/tickets/selectticket?categoryId=...
 * Uses authenticated axios client (Role 1, 3, 4).
 * Backed by Zustand store for instant navigation (zero-loading on revisit).
 *
 * Selective selector: subscribes only to the slice for this categoryId,
 * preventing re-renders when other categories are updated.
 */
export function useSelectTickets(categoryId: number | null, shouldFetch: boolean) {
  const items = useSelectDataStore(
    useCallback(
      (s) => (categoryId != null ? (s.ticketsByCategory[categoryId] ?? EMPTY_ITEMS) : EMPTY_ITEMS),
      [categoryId]
    )
  );
  const loading = useSelectDataStore(
    useCallback(
      (s) => (categoryId != null ? (s.ticketsLoading[categoryId] ?? false) : false),
      [categoryId]
    )
  );
  const error = useSelectDataStore(
    useCallback(
      (s) => (categoryId != null ? (s.ticketsError[categoryId] ?? null) : null),
      [categoryId]
    )
  );
  const fetchTickets = useSelectDataStore((s) => s.fetchTickets);

  useEffect(() => {
    if (shouldFetch && categoryId != null) fetchTickets(categoryId);
  }, [shouldFetch, categoryId, fetchTickets]);

  const refetch = useCallback(() => {
    if (categoryId != null) fetchTickets(categoryId, true);
  }, [categoryId, fetchTickets]);

  return { items, loading, error, refetch };
}
