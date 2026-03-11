import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ReportService } from '@/app/(main)/uikit/reportHD/service';
import type { ReportItem } from '@/app/(main)/uikit/reportHD/types';
import { getApiErrorMessage } from '@/utils/errorMessage';
import { isAbortError } from '@/utils/abortError';

export interface ReportFilter {
  startDate: Date | null;
  endDate: Date | null;
  tabIndex: number;
}

export interface ReportState {
  data: ReportItem[];
  loading: boolean;
  error: string;

  setError: (msg: string) => void;
  clearError: () => void;
  fetchReports: (filter: ReportFilter, signal?: AbortSignal) => Promise<void>;
}

export const useReportStore = create<ReportState>()(
  devtools(
    (set, get) => ({
      data: [],
      loading: false,
      error: '',

      setError: (msg) => set({ error: msg ?? '' }),
      clearError: () => set({ error: '' }),

      fetchReports: async (filter, signal) => {
        if (!filter.startDate || !filter.endDate) {
          set({ data: [], loading: false });
          return;
        }
        set({ loading: true, error: '' });
        try {
          const result = await ReportService.getReports(
            {
              startDate: filter.startDate,
              endDate: filter.endDate,
              tabIndex: filter.tabIndex,
            },
            signal
          );
          set({ data: Array.isArray(result) ? result : [], loading: false });
        } catch (err: unknown) {
          if (isAbortError(err)) {
            set({ loading: false });
            return;
          }
          set({
            data: [],
            loading: false,
            error: getApiErrorMessage(err, 'ເກີດຂໍ້ຜິດພາດກະລຸນາລໍຖ້າ'),
          });
        }
      },
    }),
    { name: 'HelpdeskReport' }
  )
);
