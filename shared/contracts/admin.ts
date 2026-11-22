import type { CartLine, Order, OrderStatus, Quote } from "../domain/index.ts";

export type EventRow = {
  name: string;
  product_id?: string;
  session_id: string;
  created_at: string;
};

export type OrderEdit = {
  id?: string;
  expectedUpdatedAt?: string;
  siteReference?: string;
  idempotencyKey?: string;
  cart?: CartLine[];
  notes: string;
  status: OrderStatus;
  source: Order["source"];
  adjustment: number;
  adjustment_reason: string;
  paymentMethod?: string;
};

export type OrderHistoryEntry = {
  at: string;
  status: OrderStatus;
  notes: string;
  paymentMethod?: string;
  quote: Quote;
  adjustment: number;
  adjustmentReason: string;
};

export type OrderFilters = {
  status: OrderStatus | "all" | "pending";
  source: Order["source"] | "all";
  search: string;
  period?: ReportPeriod;
};

export type ReportPeriod = "week" | "month";
export type SalesReport = {
  pending: number;
  accepted: number;
  completed: number;
  revenue: number;
  average: number;
  byOrigin: Record<Order["source"], { count: number; total: number }>;
  products: { id: string; name: string; quantity: number; total: number }[];
  components: { id: string; name: string; quantity: number }[];
};

export interface OrderOperations {
  saveOrder(input: OrderEdit): Promise<Order>;
  findSiteOrder(reference: string): Promise<Order>;
}
