import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk'; // ต้อง import เพื่อใช้ดึง options แยก
import { useCoreApi } from './useCoreApi';
import { BuildingData, CreateBuildingPayload, BuildingTabs } from '../types';

// รูปแบบ JSON จาก /api/floors: { id, buildingId, name, building: { id, name } }
interface FloorRow {
    id: number;
    buildingId?: number;
    name: string;
    code?: string;
    status?: string;
    building?: { id: number; name: string };
}

export function useBuilding(activeIndex: number) {
    const [buildingOptions, setBuildingOptions] = useState<BuildingData[]>([]);

    const type = activeIndex === BuildingTabs.BUILDING ? 'BUILDING' : activeIndex === BuildingTabs.ROOM ? 'ROOM' : 'LEVEL';
    // Tab ລະດັບຊັ້ນ (tabIndex=1) ใช้ endpoint /api/floors, ຕຶກ/ອາຄານ ແລະ ຫ້ອງ ໃຊ້ /api/buildings
    const endpoint = activeIndex === BuildingTabs.LEVEL ? '/floors' : '/buildings';
    const queryParams = activeIndex === BuildingTabs.LEVEL ? {} : { type };

    const { toast, items: rawItems, loading, saveData, deleteData, fetchData } = useCoreApi<FloorRow | BuildingData, CreateBuildingPayload>(
        endpoint,
        queryParams,
        activeIndex
    );

    // Map ຂໍ້ມູນຈາກ /api/floors ໃຫ້ມີ parentId, parentName ເພື່ອສະແດງໃນຄໍລໍາ ຕຶກ/ອາຄານ (ຮັບປະກັນເປັນ array เสมอ ເພື່ອຫຼີກລ່ຽງ Object.entries ໃນ DataTable)
    const items = useMemo((): BuildingData[] => {
        const raw = Array.isArray(rawItems) ? rawItems : [];
        if (activeIndex !== BuildingTabs.LEVEL) return raw as BuildingData[];
        return (raw as FloorRow[]).map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code ?? '',
            status: f.status ?? 'ACTIVE',
            parentId: f.buildingId,
            parentName: f.building?.name
        }));
    }, [activeIndex, rawItems]);

    // 2. Logic เสริม: ดึงรายชื่อตึกสำหรับ Dropdown
    const fetchBuildingOptions = useCallback(async () => {
        try {
            const response = await axiosClientsHelpDesk.get('/buildings', {
                params: { type: 'BUILDING', status: 'ACTIVE' }
            });
            if (Array.isArray(response.data)) setBuildingOptions(response.data);
            else if (response.data?.data) setBuildingOptions(response.data.data);
        } catch {
            setBuildingOptions([]);
        }
    }, []);

    useEffect(() => {
        if (activeIndex > 0) fetchBuildingOptions();
    }, [activeIndex, fetchBuildingOptions]);

    // ປັບ payload ໃຫ້ກົງກັບ API: Building ຮັບ { name }, Floor ຮັບແຕ່ { buildingId, name }, Room ສົ່ງ full + type
    const saveDataWrapper = useCallback(
        async (payload: CreateBuildingPayload, id?: number) => {
            if (activeIndex === BuildingTabs.LEVEL) {
                const buildingId = payload.parentId ?? null;
                const toSend = buildingId != null ? { buildingId, name: payload.name } : { name: payload.name };
                return saveData(toSend as CreateBuildingPayload, id);
            }
            if (activeIndex === BuildingTabs.BUILDING) {
                const body = { name: payload.name } as CreateBuildingPayload;
                return saveData(body, id, id == null ? { noQueryParams: true } : undefined);
            }
            return saveData(payload, id);
        },
        [activeIndex, saveData]
    );

    return { 
        toast, 
        items, 
        loading, 
        buildingOptions, 
        saveData: saveDataWrapper, 
        deleteData: (item: BuildingData) => deleteData(item.id) 
    };
}