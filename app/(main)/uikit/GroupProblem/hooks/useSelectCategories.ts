'use client';

import { useEffect, useCallback } from 'react';
import { useSelectDataStore } from '@/app/store/selectDataStore';

/**
 * Fetches category list from /api/categorys/selectcategory using authenticated client.
 * Used for Group Problem selection (Role 1, 3, 4).
 * Backed by Zustand store for instant navigation (zero-loading on revisit).
 */
export function useSelectCategories(shouldFetch = true) {
  const items = useSelectDataStore((s) => s.categories);
  const loading = useSelectDataStore((s) => s.categoriesLoading);
  const error = useSelectDataStore((s) => s.categoriesError);
  const fetchCategories = useSelectDataStore((s) => s.fetchCategories);

  useEffect(() => {
    if (shouldFetch) fetchCategories();
  }, [shouldFetch, fetchCategories]);

  const refetch = useCallback(() => fetchCategories(true), [fetchCategories]);

  return { items, loading, error, refetch };
}
