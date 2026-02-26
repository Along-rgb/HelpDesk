'use client';

import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { CategorySelectItem } from '../types/selectCategory';

const ENDPOINT = 'categorys/selectcategory';

function normalizeResponse(data: unknown): CategorySelectItem[] {
  if (Array.isArray(data)) {
    return data.map((item: Record<string, unknown>) => ({
      id: Number(item.id),
      title: String(item.title ?? item.name ?? ''),
      description: String(item.description ?? ''),
      catIconId: item.catIconId != null ? Number(item.catIconId) : undefined,
      catIcon: typeof item.catIcon === 'string' ? item.catIcon : undefined,
    }));
  }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return normalizeResponse((data as { data: unknown[] }).data);
  }
  return [];
}

/**
 * Fetches category list from /api/categorys/selectcategory using authenticated client.
 * Used for Group Problem selection (Role 1, 3, 4).
 */
export function useSelectCategories(shouldFetch = true) {
  const [items, setItems] = useState<CategorySelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!shouldFetch) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClientsHelpDesk.get(ENDPOINT);
      const list = normalizeResponse(response.data);
      setItems(list);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refetch: fetchData };
}
