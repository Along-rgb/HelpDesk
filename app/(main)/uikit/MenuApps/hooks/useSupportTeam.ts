// src/uikit/MenuApps/hooks/useSupportTeam.ts
import { useCoreApi } from '../hooks/useCoreApi';
// แก้ไข: เปลี่ยน CreatePayload เป็น CreateSupportTeamPayload
import { SupportTeamData, CreateSupportTeamPayload } from '../types';

export function useSupportTeam(activeIndex: number) {
    const getRoleType = (index: number) => {
        const roles = ['SUPPORT', 'ADMIN', 'TECHNICIAN', 'REQUESTER'];
        return roles[index] || 'SUPPORT';
    };

    const role = getRoleType(activeIndex);

    // แก้ไข: ส่ง Generic Type ที่ถูกต้องเข้าไป
    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<SupportTeamData, CreateSupportTeamPayload>(
        '/support-teams',
        { role },
        activeIndex
    );

    return { 
        toast, 
        items, 
        loading, 
        saveData, 
        deleteData: (item: SupportTeamData) => deleteData(item.id),
        fetchData
    };
}