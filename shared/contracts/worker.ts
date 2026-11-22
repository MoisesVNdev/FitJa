import type { OrderEdit, OrderFilters, ReportPeriod, SalesReport } from "./admin.ts";
import type { SubmitCheckout } from "./checkout.ts";
import type { AppearancePreview, OperationFailure, OperationResult, RestoreAppearance, UpdateAvailability } from "./operations.ts";
import type { Catalog, Order, Quote } from "../domain/index.ts";

export type CheckoutReceipt = {
  reference: string;
  createdAt: string;
  quote: Quote;
  notes: string;
};

type WorkerOperation<Access extends "public" | "owner", Input, Output> = {
  access: Access;
  input: Input;
  response: OperationResult<Output>;
};

// Method and path form the versioned Worker boundary. GET inputs are query parameters.
export type WorkerOperations = {
  "GET /api/v1/catalog": WorkerOperation<"public", undefined, Catalog>;
  "POST /api/v1/checkout": WorkerOperation<"public", SubmitCheckout, CheckoutReceipt>;
  "GET /api/v1/admin/catalog/draft": WorkerOperation<"owner", undefined, Catalog>;
  "PUT /api/v1/admin/catalog/draft": WorkerOperation<"owner", { catalog: Catalog }, Catalog>;
  "POST /api/v1/admin/catalog/publish": WorkerOperation<"owner", { catalog: Catalog; expectedVersion: string }, Catalog>;
  "PATCH /api/v1/admin/availability": WorkerOperation<"owner", UpdateAvailability, Catalog>;
  "GET /api/v1/admin/appearance/previous": WorkerOperation<"owner", undefined, AppearancePreview>;
  "POST /api/v1/admin/appearance/restore": WorkerOperation<"owner", RestoreAppearance, Catalog>;
  "GET /api/v1/admin/orders/site-reference": WorkerOperation<"owner", { reference: string }, Order>;
  "POST /api/v1/admin/orders": WorkerOperation<"owner", OrderEdit, Order>;
  "GET /api/v1/admin/orders": WorkerOperation<"owner", OrderFilters, Order[]>;
  "GET /api/v1/admin/report": WorkerOperation<"owner", { period: ReportPeriod; source: OrderFilters["source"] }, SalesReport>;
};

export const operationStatus: Record<OperationFailure["code"], number> = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  CATALOG_CHANGED: 409,
  UNAVAILABLE: 409,
  IDEMPOTENCY_CONFLICT: 409,
  RATE_LIMITED: 429,
  UNSUPPORTED: 501,
  UNAVAILABLE_SERVICE: 503,
};
