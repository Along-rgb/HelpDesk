import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';

interface RefItem {
    id: number;
    name: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

let buildingMap: Map<number, string> | null = null;
let floorMap: Map<number, string> | null = null;
let statusMap: Map<number, string> | null = null;
let cacheTimestamp = 0;
let pendingFetch: Promise<void> | null = null;

function isCacheValid(): boolean {
    return (
        buildingMap !== null &&
        floorMap !== null &&
        statusMap !== null &&
        Date.now() - cacheTimestamp < CACHE_TTL_MS
    );
}

export async function fetchReferenceData(): Promise<void> {
    if (isCacheValid()) return;
    if (pendingFetch) return pendingFetch;

    pendingFetch = (async () => {
        try {
            const [buildingsRes, floorsRes, statusRes] = await Promise.all([
                axiosClientsHelpDesk
                    .get<RefItem[]>('buildings/selectbuilding')
                    .catch(() => ({ data: [] as RefItem[] })),
                axiosClientsHelpDesk
                    .get<RefItem[]>('floors/selectfloor')
                    .catch(() => ({ data: [] as RefItem[] })),
                axiosClientsHelpDesk
                    .get<RefItem[]>('helpdeskstatus/selecthelpdeskstatus')
                    .catch(() => ({ data: [] as RefItem[] })),
            ]);

            const buildings: RefItem[] = Array.isArray(buildingsRes.data) ? buildingsRes.data : [];
            const floors: RefItem[] = Array.isArray(floorsRes.data) ? floorsRes.data : [];
            const statuses: RefItem[] = Array.isArray(statusRes.data) ? statusRes.data : [];

            buildingMap = new Map(buildings.map((b) => [b.id, b.name]));
            floorMap = new Map(floors.map((f) => [f.id, f.name]));
            statusMap = new Map(statuses.map((s) => [s.id, s.name]));
            cacheTimestamp = Date.now();
        } finally {
            pendingFetch = null;
        }
    })();

    return pendingFetch;
}

export function getBuildingName(id: unknown): string {
    if (id == null || id === '') return '';
    return buildingMap?.get(Number(id)) ?? String(id);
}

export function getFloorName(id: unknown): string {
    if (id == null || id === '') return '';
    return floorMap?.get(Number(id)) ?? String(id);
}

export function getStatusName(id: unknown): string {
    if (id == null || id === '') return '';
    return statusMap?.get(Number(id)) ?? String(id);
}
