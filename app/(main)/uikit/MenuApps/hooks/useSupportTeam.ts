// src/uikit/MenuApps/hooks/useSupportTeam.ts
import { useCoreApi } from './useCoreApi';
// แก้ไข: เปลี่ยน CreatePayload เป็น CreateSupportTeamPayload
import { SupportTeamData, CreateSupportTeamPayload } from '../types';

/** enabled=false: ไม่เรียก /support-teams (Role 1 ເຂົ້າໃຊ້ແຕ່ headcategorys) */
export function useSupportTeam(activeIndex: number, enabled: boolean = true) {
    // tabIndex=0 ທິມສະໜັບສະໜູນ (ໃຊ້ useIssues ໃນໜ້າ), 1=ວິຊາການ=SUPPORT
    const getRoleType = (index: number) => {
        const roles: (string | undefined)[] = ['SUPPORT', 'SUPPORT'];
        return roles[index] ?? 'SUPPORT';
    };

    const role = getRoleType(activeIndex);

    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<SupportTeamData, CreateSupportTeamPayload>(
        '/support-teams',
        { role },
        activeIndex,
        enabled
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