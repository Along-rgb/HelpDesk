import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { BuildingData, CreateBuildingPayload } from './types';
import { normalizeDataList } from '@/utils/apiNormalizers';
import { getApiErrorMessage } from '@/utils/errorMessage';
import { isAbortError } from '@/utils/abortError';
import {
  parseFloorRows,
  parseBuildingDataArray,
  type FloorRow,
  type BuildingApiPayload,
} from '@/app/(main)/uikit/MenuApps/schemas/building.schema';

export type BuildingTabIndex = 0 | 1; // BUILDING | LEVEL

export interface BuildingState {
  items: BuildingData[];
  buildingOptions: BuildingData[];
  loading: boolean;
  error: string;
  successMessage: string;

  setError: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
  clearMessages: () => void;

  fetchBuildings: (type?: string, signal?: AbortSignal) => Promise<void>;
  fetchFloors: (signal?: AbortSignal) => Promise<void>;
  fetchBuildingOptions: (signal?: AbortSignal) => Promise<void>;
  fetchData: (activeIndex: BuildingTabIndex, signal?: AbortSignal) => Promise<void>;

  saveData: (payload: CreateBuildingPayload, activeIndex: BuildingTabIndex, id?: number) => Promise<boolean>;
  deleteData: (id: number) => Promise<void>;
  deleteFloor: (id: number) => Promise<void>;
  deleteBuildingCascade: (buildingId: number) => Promise<void>;
}

export const useBuildingStore = create<BuildingState>()(
  devtools(
    (set, get) => ({
      items: [],
      buildingOptions: [],
      loading: false,
      error: '',
      successMessage: '',

      setError: (msg) => set({ error: msg ?? '' }),
      setSuccessMessage: (msg) => set({ successMessage: msg ?? '' }),
      clearMessages: () => set({ error: '', successMessage: '' }),

      fetchBuildings: async (type = 'BUILDING', signal) => {
        set({ loading: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('/buildings', { params: { type }, signal });
          const raw = normalizeDataList<FloorRow | BuildingData>(res.data);
          const list = parseBuildingDataArray(raw).map((item): BuildingData => ({
            ...item,
            code: item.code ?? '',
            status: item.status ?? 'ACTIVE',
          }));
          set({ items: list ?? [], loading: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loading: false });
            return;
          }
          set({ items: [], loading: false, error: getApiErrorMessage(e, 'ໂຫຼດລາຍການຕຶກ/ອາຄານບໍ່ສຳເລັດ') });
        }
      },

      fetchFloors: async (signal) => {
        set({ loading: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('/floors', { signal });
          const raw = normalizeDataList<FloorRow>(res.data);
          const floors = parseFloorRows(raw);
          const list = floors.map((f): BuildingData => ({
            id: f.id,
            name: f.name,
            code: f.code ?? '',
            status: f.status ?? 'ACTIVE',
            parentId: f.buildingId,
            parentName: f.building?.name,
          }));
          set({ items: list ?? [], loading: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loading: false });
            return;
          }
          set({ items: [], loading: false, error: getApiErrorMessage(e, 'ໂຫຼດລາຍການຊັ້ນບໍ່ສຳເລັດ') });
        }
      },

      fetchBuildingOptions: async (signal) => {
        try {
          const res = await axiosClientsHelpDesk.get('/buildings', {
            params: { type: 'BUILDING', status: 'ACTIVE' },
            signal,
          });
          const data = res.data?.data ?? res.data;
          const raw = Array.isArray(data) ? data : [];
          const list = parseBuildingDataArray(raw).map((item): BuildingData => ({
            ...item,
            code: item.code ?? '',
            status: item.status ?? 'ACTIVE',
          }));
          set({ buildingOptions: list ?? [] });
        } catch (e) {
          if (isAbortError(e)) return;
          set({ buildingOptions: [] });
        }
      },

      fetchData: async (activeIndex, signal) => {
        if (activeIndex === 1) {
          await get().fetchFloors(signal);
        } else {
          await get().fetchBuildings('BUILDING', signal);
        }
      },

      saveData: async (payload, activeIndex, id) => {
        set({ error: '' });
        try {
          if (activeIndex === 1) {
            const buildingId = payload.parentId ?? null;
            const toSend: BuildingApiPayload =
              buildingId != null ? { buildingId, name: payload.name } : { name: payload.name };
            if (id != null) {
              await axiosClientsHelpDesk.put(`/floors/${id}`, toSend);
            } else {
              await axiosClientsHelpDesk.post('/floors', toSend);
            }
          } else {
            const body: BuildingApiPayload = { name: payload.name };
            if (id != null) {
              await axiosClientsHelpDesk.put(`/buildings/${id}`, body);
            } else {
              await axiosClientsHelpDesk.post('/buildings', body);
            }
          }
          set({ successMessage: id != null ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
          await get().fetchData(activeIndex);
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      /** ลบ floor (ใช้ทั้ง tab ລະດັບຊັ້ນ และที่อื่นที่เรียก deleteData) */
      deleteData: async (id) => {
        await get().deleteFloor(id);
      },

      deleteFloor: async (id) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`/floors/${id}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchFloors();
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
        }
      },

      deleteBuildingCascade: async (buildingId) => {
        set({ error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('/floors');
          const data = res.data?.data ?? res.data;
          const arr = Array.isArray(data) ? data : [];
          const floorsToDelete = arr.filter(
            (f: { buildingId?: number; id?: number }) => f.buildingId === buildingId && typeof f.id === 'number'
          );
          for (const floor of floorsToDelete) {
            await axiosClientsHelpDesk.delete(`/floors/${floor.id}`);
          }
          await axiosClientsHelpDesk.delete(`/buildings/${buildingId}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchBuildings('BUILDING');
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່') });
        }
      },
    }),
    { name: 'HelpdeskBuilding' }
  )
);
