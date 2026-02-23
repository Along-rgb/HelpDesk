import { useCoreApi } from './useCoreApi';
import { IconItemData, CreateIconPayload } from '../types';

export function useIssueIcons(activeIndex: number) {
    const { toast, items, loading, saveData, deleteData } = useCoreApi<IconItemData, CreateIconPayload>(
        '/issue-icons',
        {},
        activeIndex
    );
    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: IconItemData) => deleteData(item.id),
    };
}
