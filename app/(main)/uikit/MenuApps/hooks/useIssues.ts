import { useCoreApi } from '../hooks/useCoreApi'; // ปรับ path ตามจริง
import { IssueData, CreateIssuePayload } from '../types';

export function useIssues(activeIndex: number) {
    const getIssueType = (index: number) => {
        const types = ['CATEGORY', 'TOPIC'];
        return types[index] || 'CATEGORY';
    };

    const type = getIssueType(activeIndex);

    // เรียกใช้ Hook กลางบรรทัดเดียวจบ
    const { toast, items, loading, saveData, deleteData } = useCoreApi<IssueData, CreateIssuePayload>(
        '/issues',      // Endpoint
        { type },       // Query Params
        activeIndex     // Trigger ให้โหลดใหม่เมื่อเปลี่ยน Tab
    );

    return { 
        toast, 
        items, 
        loading, 
        saveData, 
        deleteData: (item: IssueData) => deleteData(item.id) 
    };
}