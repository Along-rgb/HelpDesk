import { useCoreApi } from './useCoreApi';
import { IssueData, CreateIssuePayload } from '../types';

export function useIssues(activeIndex: number) {
    const getEndpoint = (index: number) => (index === 2 ? '' : '/issues');
    const getParams = (index: number) => {
        if (index === 2) return {};
        const types = ['CATEGORY', 'TOPIC'];
        return { type: types[index] || 'CATEGORY' };
    };

    const endpoint = getEndpoint(activeIndex);
    const queryParams = getParams(activeIndex);

    const { toast, items, loading, saveData, deleteData } = useCoreApi<IssueData, CreateIssuePayload>(
        endpoint,
        queryParams,
        activeIndex
    );

    return { 
        toast, 
        items, 
        loading, 
        saveData, 
        deleteData: (item: IssueData) => deleteData(item.id) 
    };
}