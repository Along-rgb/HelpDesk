import axios from 'axios';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { ReportItem, ReportFilter } from './types';
import { fetchReferenceData, getBuildingName, getFloorName } from '@/app/(main)/uikit/shared/referenceDataCache';
import { formatDateTime24h } from '@/app/(main)/uikit/shared/formatUtils';
import { REPORT_ENDPOINTS, REPORT_GROUP_FIELD } from '@/app/(main)/uikit/shared/constants';

// --------------- Helpers ---------------
function getGroupTitle(group: Record<string, unknown>): string {
    return String(
        group.staffName ??
        group.categoryTitle ??
        group.title ??
        group.ticketTitle ??
        group.categoryName ??
        group.departmentName ??
        group.technicianName ??
        group.name ??
        ''
    );
}

function mapRequestToReportItem(
    raw: Record<string, unknown>,
    groupTitle: string,
    tabIndex: number
): ReportItem {
    const req: Record<string, any> =
        tabIndex === 3
            ? ((raw.helpdeskRequest as Record<string, any>) ?? raw)
            : raw;

    const employee = req.createdBy?.employee;
    const firstName: string = employee?.first_name ?? '';
    const lastName: string = employee?.last_name ?? '';

    return {
        id: req.id ?? '',
        code: req.numberSKT ?? '',
        topic: req.ticket?.title ?? groupTitle ?? '',
        detail: req.details ?? req.detail ?? '',
        requester: `${firstName} ${lastName}`.trim(),
        department_main: employee?.department?.department_name ?? '',
        department_sub: employee?.division?.division_name ?? '',
        building: getBuildingName(req.buildingId),
        floor: getFloorName(req.floorId),
        room: req.room ?? '',
        date: req.createdAt ?? '',
        note: req.note ?? '',
        telephone: req.telephone ?? employee?.tel ?? '',
        category: req.ticket?.category?.name ?? '',
        technician: req.technician?.name ?? '',
    };
}

// --------------- Public API ---------------
export const ReportService = {
    getReports: async (filter: ReportFilter, signal?: AbortSignal): Promise<ReportItem[]> => {
        try {
            const endpoint = REPORT_ENDPOINTS[filter.tabIndex] ?? REPORT_ENDPOINTS[0];
            const groupField = (REPORT_GROUP_FIELD[filter.tabIndex] ?? REPORT_GROUP_FIELD[0]) as keyof ReportItem;

            const params = {
                startDate: filter.startDate ? filter.startDate.toISOString().split('T')[0] : undefined,
                endDate: filter.endDate ? filter.endDate.toISOString().split('T')[0] : undefined,
            };

            await fetchReferenceData();

            const response = await axiosClientsHelpDesk.get(endpoint, {
                params,
                signal,
            });

            const groups: Record<string, unknown>[] = Array.isArray(response.data)
                ? response.data
                : [];

            const items: ReportItem[] = [];

            for (const group of groups) {
                const groupTitle = getGroupTitle(group);
                const requests: Record<string, unknown>[] = Array.isArray(group.requests)
                    ? (group.requests as Record<string, unknown>[])
                    : [];

                const groupTotal = typeof group.total === 'number' ? group.total : requests.length;

                for (const raw of requests) {
                    const item = mapRequestToReportItem(raw, groupTitle, filter.tabIndex);
                    item._groupTotal = groupTotal;
                    if (groupTitle) {
                        (item as unknown as Record<string, unknown>)[groupField] = groupTitle;
                    }
                    items.push(item);
                }
            }

            if (items.length > 1) {
                items.sort((a, b) => {
                    const da = a.date || '';
                    const db = b.date || '';
                    return da > db ? -1 : da < db ? 1 : 0;
                });
            }

            for (let i = 0, len = items.length; i < len; i++) {
                items[i].date = formatDateTime24h(items[i].date);
            }

            return items;
        } catch (error: unknown) {
            if (axios.isCancel(error)) {
                throw error;
            }
            if (process.env.NODE_ENV === 'development') {
                const message = error instanceof Error ? error.message : String(error);
                console.error('Error fetching reports:', message);
            }
            return [];
        }
    },
};