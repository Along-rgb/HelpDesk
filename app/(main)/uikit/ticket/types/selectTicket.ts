/**
 * Response item from GET /api/tickets/selectticket?categoryId=...
 * Used for Ticket (sub-issue) selection flow.
 */
export interface TicketSelectItem {
  id: number;
  title: string;
  description: string;
  /** Category/parent id when returned by API */
  categoryId?: number;
}
