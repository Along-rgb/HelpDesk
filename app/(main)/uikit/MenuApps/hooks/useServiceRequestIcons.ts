import { useCoreApi } from './useCoreApi';
import { IconItemData, CreateIconPayload } from '../types';

export function useServiceRequestIcons(activeIndex: number) {
    const { toast, items, loading, saveData, deleteData } = useCoreApi<IconItemData, CreateIconPayload>(
        '/service-icons',
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
