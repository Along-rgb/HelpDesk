/**
 * รายการสถานะจาก /api/helpdeskstatus/selecthelpdeskstatus และ map id → doing|done|waiting.
 * ใช้ที่เดียว ดึงไปใช้ได้ทั้ง hook, normalizer, และ component อื่น
 */
'use client';

import { create } from 'zustand';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';
import { normalizeIdNameList } from '@/utils/apiNormalizers';
import { buildStatusIdToAssigneeStatus } from '@/utils/helpdeskStatusMapping';
import { getApiErrorMessage } from '@/utils/errorMessage';

export type AssigneeStatus = 'doing' | 'done' | 'waiting';

export interface HelpdeskStatusItem {
  id: number;
  name: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface HelpdeskStatusState {
  list: HelpdeskStatusItem[];
  /** id → doing|done|waiting จาก list (เทียบชื่อกับ selecthelpdeskstatus) */
  statusIdMap: Record<number, AssigneeStatus>;
  loading: boolean;
  error: string | null;
  fetchedAt: number;

  fetchStatus: () => Promise<void>;
}

export const useHelpdeskStatusStore = create<HelpdeskStatusState>((set) => ({
  list: [],
  statusIdMap: {},
  loading: false,
  error: null,
  fetchedAt: 0,

  fetchStatus: async () => {
    const now = Date.now();
    const state = useHelpdeskStatusStore.getState();
    if (
      state.list.length > 0 &&
      state.fetchedAt > 0 &&
      now - state.fetchedAt < CACHE_TTL_MS
    ) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const res = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.STATUS_SELECT);
      const list = normalizeIdNameList(res.data);
      const statusIdMap = buildStatusIdToAssigneeStatus(list);
      set({
        list: list ?? [],
        statusIdMap,
        loading: false,
        error: null,
        fetchedAt: Date.now(),
      });
    } catch (e) {
      set({
        list: [],
        statusIdMap: {},
        loading: false,
        error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດສະຖານະ'),
      });
    }
  },
}));
