import { useCoreApi } from './useCoreApi';
import { IconItemData, CreateIconPayload } from '../types';

/** รายการไอคอนສຳລັບ Service Request — ถ้า backend ຍັງບໍ່ມີ /service-icons (404) ຈະຄືນ [] ແລະບໍ່ແສງ toast */
export function useServiceRequestIcons(activeIndex: number) {
    const { toast, items, loading, saveData, deleteData } = useCoreApi<IconItemData, CreateIconPayload>(
        '/service-icons',
        {},
        activeIndex,
        true,
        { silentFetchError: true }
    );
    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: IconItemData) => deleteData(item.id),
    };
}
