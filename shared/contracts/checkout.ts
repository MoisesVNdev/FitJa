import type { CartLine, Catalog, Order, Quote, QuotedLine } from "../domain/index.ts";

// Adapter contract preserved by both the local demo and the future Worker API.
export interface CheckoutApi {
  loadCatalog(): Promise<Catalog>;
  // Reprice the entire cart together against the current catalog and return the original request on an exact retry.
  submitOrder(
    cart: CartLine[],
    notes: string,
    idempotencyKey: string,
    expectedSignature: string,
    token: string,
    expectedWhatsApp?: string,
  ): Promise<Order>;
}

export type SubmitCheckout = {
  cart: CartLine[];
  notes: string;
  idempotencyKey: string;
  expectedSignature: string;
  token: string;
  expectedWhatsApp?: string;
};

export type CheckoutLine = {
  key: string;
  quote: QuotedLine | null;
  problem?: string;
};

export type CheckoutReview = {
  catalog: Catalog;
  lines: CheckoutLine[];
  quote: Quote | null;
  problem?: string;
};

export type Fulfillment = "delivery" | "pickup";
