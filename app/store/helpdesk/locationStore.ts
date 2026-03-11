import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { normalizeDataList } from '@/utils/apiNormalizers';
import { getApiErrorMessage } from '@/utils/errorMessage';
import { isAbortError } from '@/utils/abortError';
import type { LocationData } from './types';

export interface LocationState {
  locations: LocationData[];
  loading: boolean;
  error: string;

  setError: (msg: string) => void;
  clearError: () => void;
  fetchLocations: (signal?: AbortSignal) => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
  devtools(
    (set, get) => ({
      locations: [],
      loading: false,
      error: '',

      setError: (msg) => set({ error: msg ?? '' }),
      clearError: () => set({ error: '' }),

      fetchLocations: async (signal) => {
        set({ loading: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('locations', { signal });
          const list = normalizeDataList<LocationData>(res.data);
          set({ locations: list ?? [], loading: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loading: false });
            return;
          }
          set({
            locations: [],
            loading: false,
            error: getApiErrorMessage(e, 'ໂຫຼດສະຖານທີ່ບໍ່ສຳເລັດ'),
          });
        }
      },
    }),
    { name: 'HelpdeskLocation' }
  )
);
