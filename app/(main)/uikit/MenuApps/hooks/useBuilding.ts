import { useState, useEffect, useCallback } from 'react';
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk'; // ต้อง import เพื่อใช้ดึง options แยก
import { useCoreApi } from '../hooks/useCoreApi';
import { BuildingData, CreateBuildingPayload } from '../types';

export function useBuilding(activeIndex: number) {
    const [buildingOptions, setBuildingOptions] = useState<BuildingData[]>([]);

    const getBuildingType = (index: number) => {
        const types = ['BUILDING', 'LEVEL', 'ROOM'];
        return types[index] || 'BUILDING';
    };

    const type = getBuildingType(activeIndex);

    // 1. ใช้ Hook กลางจัดการตารางหลัก (Clean Code)
    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<BuildingData, CreateBuildingPayload>(
        '/buildings',
        { type },
        activeIndex
    );

    // 2. Logic เสริม: ดึงรายชื่อตึกสำหรับ Dropdown
    const fetchBuildingOptions = useCallback(async () => {
        try {
            const response = await axiosClientsHelpDesk.get('/buildings', {
                params: { type: 'BUILDING', status: 'ACTIVE' }
            });
            if (Array.isArray(response.data)) setBuildingOptions(response.data);
            else if (response.data?.data) setBuildingOptions(response.data.data);
        } catch (error) {
            console.error("Failed to fetch building options:", error);
        }
    }, []);

    useEffect(() => {
        if (activeIndex > 0) fetchBuildingOptions();
    }, [activeIndex, fetchBuildingOptions]);

    return { 
        toast, 
        items, 
        loading, 
        buildingOptions, 
        saveData, 
        deleteData: (item: BuildingData) => deleteData(item.id) 
    };
}