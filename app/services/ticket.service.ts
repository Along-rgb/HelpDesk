import axios from "axios";
import { env } from "@/config/env";
import { Ticket } from "../(main)/uikit/invalidstate/types";

const TICKETS_BASE = env.ticketsApiUrl;

export const TicketService = {
    async getTickets(): Promise<Ticket[]> {
        try {
            const res = await axios.get<Ticket[]>(`${TICKETS_BASE}/tickets`);
            return res.data;
        } catch (error) {
            console.error("Get tickets error:", error);
            throw error;
        }
    }
};