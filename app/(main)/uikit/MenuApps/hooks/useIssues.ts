import { useCoreApi } from './useCoreApi';
import { IssueData, CreateIssuePayload } from '../types';

/** Tab 1 ລາຍການຫົວຂໍ້: GET/POST/PUT/DELETE /api/issues?type=TOPIC */
export function useIssues(triggerFetch: unknown, enabled: boolean = true) {
    const endpoint = 'issues';
    const queryParams = { type: 'TOPIC' };

    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<
        IssueData,
        CreateIssuePayload
    >(endpoint, queryParams, triggerFetch, enabled);

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: IssueData) => deleteData(item.id),
        fetchData,
    };
}