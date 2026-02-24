import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { env } from '@/config/env';
import { Ticket } from '@/app/(main)/uikit/invalidstate/types';

/** ใช้ client ที่มี Interceptor แนบ Bearer Token แล้ว baseURL override ไปที่ Tickets API */
export const TicketService = {
  async getTickets(): Promise<Ticket[]> {
    try {
      const res = await axiosClientsHelpDesk.get<Ticket[]>('/tickets', {
        baseURL: env.ticketsApiUrl,
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};
