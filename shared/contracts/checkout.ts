import type { CartLine, Catalog, Order } from "../domain";

// Adapter contract preserved by both the local demo and the future Worker API.
export interface CheckoutApi {
  loadCatalog(): Promise<Catalog>;
  submitOrder(
    cart: CartLine[],
    notes: string,
    idempotencyKey: string,
    expectedSignature: string,
    token: string,
  ): Promise<Order>;
}

export type Fulfillment = "delivery" | "pickup";
