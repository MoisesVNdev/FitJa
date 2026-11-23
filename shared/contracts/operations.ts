import type { Catalog, Theme } from "../domain/index.ts";

export const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = typeof weekdays[number];
export type TimeRange = { opens: string; closes: string };
export type StoreHours = {
  days: Partial<Record<Weekday, TimeRange[]>>;
  closures: { date: string; notice: string }[];
};

export type AvailabilityChange =
  | { kind: "product"; productId: string; available: boolean }
  | { kind: "variant"; productId: string; variantId: string; available: boolean }
  | { kind: "builders"; paused: boolean };

export type LiveAvailability = {
  products: Extract<AvailabilityChange, { kind: "product" }>[];
  variants: Extract<AvailabilityChange, { kind: "variant" }>[];
  buildersPaused: boolean;
};

export type UpdateAvailability = {
  expectedVersion: string;
  change: AvailabilityChange;
};
export type AppearanceSnapshot = { version: string; theme: Theme };
export type RestoreAppearance = { expectedVersion: string; snapshotVersion: string };

export type OperationCode =
  | "INVALID_INPUT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "CATALOG_CHANGED"
  | "UNAVAILABLE"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "UNSUPPORTED"
  | "UNAVAILABLE_SERVICE";

export type OperationFailure = { code: OperationCode; message: string };
export type OperationResult<T> = { ok: true; value: T } | { ok: false; error: OperationFailure };

export class OperationError extends Error implements OperationFailure {
  constructor(readonly code: OperationCode, message: string) {
    super(message);
    this.name = "OperationError";
  }
}

// The appearance preview carries the current public version alongside the old theme.
export type AppearancePreview = { expectedVersion: string; snapshot: AppearanceSnapshot; catalog: Catalog };

export interface StoreOperations {
  updateAvailability(input: UpdateAvailability): Promise<Catalog>;
  previewAppearance(): Promise<AppearancePreview>;
  restoreAppearance(input: RestoreAppearance): Promise<Catalog>;
}
