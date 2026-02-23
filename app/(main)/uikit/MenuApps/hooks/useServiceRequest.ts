import { useCoreApi } from './useCoreApi';
import { ServiceRequestData, CreateServiceRequestPayload } from '../types';

export function useServiceRequest(activeIndex: number) {
    const getEndpoint = (index: number) => {
        if (index === 2) return ''; // Tab ເພີ່ມໄອຄອນ ໃຊ້ useServiceRequestIcons
        return index === 0 ? '/service-categories' : '/service-items';
    };

    const endpoint = getEndpoint(activeIndex);

    const { toast, items, loading, saveData, deleteData } = useCoreApi<ServiceRequestData, CreateServiceRequestPayload>(
        endpoint, 
        {}, // ไม่มี params พิเศษ
        activeIndex
    );

    return { 
        toast, 
        items, 
        loading, 
        saveData, 
        deleteData: (item: ServiceRequestData) => deleteData(item.id) 
    };
}