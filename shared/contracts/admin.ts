import type { CartLine, Order, OrderStatus } from "../domain";

export type EventRow = {
  name: string;
  product_id?: string;
  session_id: string;
  created_at: string;
};

export type OrderEdit = {
  id?: string;
  expectedUpdatedAt?: string;
  cart?: CartLine[];
  notes: string;
  status: OrderStatus;
  source: Order["source"];
  adjustment: number;
  adjustment_reason: string;
};
