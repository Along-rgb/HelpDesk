import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { useCoreApi } from './useCoreApi';
import { BuildingData, CreateBuildingPayload, BuildingTabs } from '../types';
import {
  parseFloorRows,
  parseBuildingDataArray,
  type FloorRow,
  type BuildingApiPayload,
} from '../schemas/building.schema';

export function useBuilding(activeIndex: number) {
  const [buildingOptions, setBuildingOptions] = useState<BuildingData[]>([]);

  const type = activeIndex === BuildingTabs.BUILDING ? 'BUILDING' : activeIndex === BuildingTabs.ROOM ? 'ROOM' : 'LEVEL';
  const endpoint = activeIndex === BuildingTabs.LEVEL ? '/floors' : '/buildings';
  const queryParams = activeIndex === BuildingTabs.LEVEL ? {} : { type };

  const { toast, items: rawItems, loading, saveData, deleteData, fetchData } = useCoreApi<
    FloorRow | BuildingData,
    BuildingApiPayload
  >(endpoint, queryParams, activeIndex);

  const items = useMemo((): BuildingData[] => {
    const raw = Array.isArray(rawItems) ? rawItems : [];
    if (activeIndex !== BuildingTabs.LEVEL) {
      return parseBuildingDataArray(raw).map((item): BuildingData => ({
        ...item,
        code: item.code ?? '',
        status: item.status ?? 'ACTIVE',
      }));
    }
    const floors = parseFloorRows(raw);
    return floors.map((f): BuildingData => ({
      id: f.id,
      name: f.name,
      code: f.code ?? '',
      status: f.status ?? 'ACTIVE',
      parentId: f.buildingId,
      parentName: f.building?.name,
    }));
  }, [activeIndex, rawItems]);

  const fetchBuildingOptions = useCallback(async () => {
    try {
      const response = await axiosClientsHelpDesk.get('/buildings', {
        params: { type: 'BUILDING', status: 'ACTIVE' },
      });
      const data = response.data?.data ?? response.data;
      const list = parseBuildingDataArray(Array.isArray(data) ? data : []).map((item): BuildingData => ({
        ...item,
        code: item.code ?? '',
        status: item.status ?? 'ACTIVE',
      }));
      setBuildingOptions(list);
    } catch {
      setBuildingOptions([]);
    }
  }, []);

  useEffect(() => {
    if (activeIndex > 0) fetchBuildingOptions();
  }, [activeIndex, fetchBuildingOptions]);

  const saveDataWrapper = useCallback(
    async (payload: CreateBuildingPayload, id?: number) => {
      if (activeIndex === BuildingTabs.LEVEL) {
        const buildingId = payload.parentId ?? null;
        const toSend: BuildingApiPayload =
          buildingId != null ? { buildingId, name: payload.name } : { name: payload.name };
        return saveData(toSend, id);
      }
      if (activeIndex === BuildingTabs.BUILDING) {
        const body: BuildingApiPayload = { name: payload.name };
        return saveData(body, id, id == null ? { noQueryParams: true } : undefined);
      }
      return saveData(payload, id);
    },
    [activeIndex, saveData]
  );

  /** ลบตึกแบบ Cascade: ลบ floors ที่เชื่อมกับ buildingId ก่อน แล้วค่อยลบ building */
  const deleteBuildingCascade = useCallback(
    async (buildingId: number) => {
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
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'ລຶບຂໍ້ມູນສຳເລັດ',
          life: 4000,
        });
        await fetchData();
      } catch (error: unknown) {
        const msg =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        const detail =
          msg && typeof msg === 'string' ? msg : 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່';
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail,
          life: 4000,
        });
      }
    },
    [toast, fetchData]
  );

  return {
    toast,
    items,
    loading,
    buildingOptions,
    saveData: saveDataWrapper,
    deleteData: (item: BuildingData) => deleteData(item.id),
    deleteBuildingCascade,
  };
}
