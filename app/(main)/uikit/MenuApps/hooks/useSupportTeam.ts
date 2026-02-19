// src/uikit/MenuApps/hooks/useSupportTeam.ts
import { useCoreApi } from './useCoreApi';
// แก้ไข: เปลี่ยน CreatePayload เป็น CreateSupportTeamPayload
import { SupportTeamData, CreateSupportTeamPayload } from '../types';

export function useSupportTeam(activeIndex: number) {
    // tabIndex=0 ໝວດບັນຫາ (ໃຊ້ useIssues ໃນໜ້າ), 1=ວິຊາການ=SUPPORT, 2=ທີມຄຸ້ມຄອງ=ADMIN
    const getRoleType = (index: number) => {
        const roles: (string | undefined)[] = ['SUPPORT', 'SUPPORT', 'ADMIN'];
        return roles[index] ?? 'SUPPORT';
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