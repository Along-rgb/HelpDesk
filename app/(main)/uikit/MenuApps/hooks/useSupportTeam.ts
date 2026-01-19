import { useCoreApi } from '../hooks/useCoreApi';
import { SupportTeamData, CreatePayload } from '../types';

export function useSupportTeam(activeIndex: number) {
    const getRoleType = (index: number) => {
        const roles = ['SUPPORT', 'ADMIN', 'TECHNICIAN', 'REQUESTER'];
        return roles[index] || 'SUPPORT';
    };

    const role = getRoleType(activeIndex);

    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<SupportTeamData, CreatePayload>(
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