import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { normalizeDataList } from '@/utils/apiNormalizers';
import { getApiErrorMessage } from '@/utils/errorMessage';
import { isAbortError } from '@/utils/abortError';
import type { CategoryData, CreateCategoryPayload, IssueData, CreateIssuePayload } from './types';

type TicketRawItem = Omit<IssueData, 'parentId'> & { categoryId?: number };
type TicketApiPayload = { categoryId?: number; title: string; description: string };

export interface IssueState {
  categories: CategoryData[];
  items: IssueData[];
  loading: boolean;
  error: string;
  successMessage: string;

  setError: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
  clearMessages: () => void;

  fetchCategories: (signal?: AbortSignal) => Promise<void>;
  fetchTickets: (signal?: AbortSignal) => Promise<void>;
  fetchData: (signal?: AbortSignal) => Promise<void>;

  saveCategory: (payload: CreateCategoryPayload, id?: number) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<void>;
  saveTicket: (payload: CreateIssuePayload, id?: number) => Promise<boolean>;
  deleteTicket: (id: number) => Promise<void>;
}

export const useIssueStore = create<IssueState>()(
  devtools(
    (set, get) => ({
      categories: [],
      items: [],
      loading: false,
      error: '',
      successMessage: '',

      setError: (msg) => set({ error: msg ?? '' }),
      setSuccessMessage: (msg) => set({ successMessage: msg ?? '' }),
      clearMessages: () => set({ error: '', successMessage: '' }),

      fetchCategories: async (signal) => {
        set({ loading: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('categorys', { signal });
          const list = normalizeDataList<CategoryData>(res.data);
          set({ categories: list ?? [], loading: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loading: false });
            return;
          }
          set({
            categories: [],
            loading: false,
            error: getApiErrorMessage(e, 'ໂຫຼດໝວດໝູ່ບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchTickets: async (signal) => {
        set({ loading: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('tickets', { signal });
          const raw = normalizeDataList<TicketRawItem>(res.data);
          const items: IssueData[] = (raw ?? []).map((r) => ({
            ...r,
            parentId: r.categoryId ?? (r as IssueData).parentId,
          })) as IssueData[];
          set({ items, loading: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loading: false });
            return;
          }
          set({
            items: [],
            loading: false,
            error: getApiErrorMessage(e, 'ໂຫຼດລາຍການຫົວຂໍ້ບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchData: async (signal) => {
        await get().fetchCategories(signal);
        await get().fetchTickets(signal);
      },

      saveCategory: async (payload, id) => {
        set({ error: '' });
        try {
          if (id != null) {
            await axiosClientsHelpDesk.put(`categorys/${id}`, payload);
          } else {
            await axiosClientsHelpDesk.post('categorys', payload);
          }
          set({ successMessage: id != null ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
          await get().fetchCategories();
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      deleteCategory: async (id) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`categorys/${id}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchCategories();
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
        }
      },

      saveTicket: async (payload, id) => {
        set({ error: '' });
        const apiPayload: TicketApiPayload = {
          title: payload.title,
          description: payload.description,
          categoryId: payload.parentId,
        };
        try {
          if (id != null) {
            await axiosClientsHelpDesk.put(`tickets/${id}`, apiPayload);
          } else {
            await axiosClientsHelpDesk.post('tickets', apiPayload);
          }
          set({ successMessage: id != null ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
          await get().fetchTickets();
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      deleteTicket: async (id) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`tickets/${id}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchTickets();
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
        }
      },
    }),
    { name: 'HelpdeskIssue' }
  )
);
