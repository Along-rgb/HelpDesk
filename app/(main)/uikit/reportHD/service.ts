// src/app/reports/service.ts
import axios from 'axios';
import { env } from '@/config/env';
import { ReportItem, ReportFilter } from './types';

const API_URL = env.reportsApiUrl;

export const ReportService = {
    getReports: async (filter: ReportFilter, signal?: AbortSignal): Promise<ReportItem[]> => {
        try {
            const params = {
                startDate: filter.startDate?.toISOString(),
                endDate: filter.endDate?.toISOString(),
                type: filter.tabIndex
            };
            const response = await axios.get(`${API_URL}/reports`, {
                params,
                signal: signal
            });
            return response.data;
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