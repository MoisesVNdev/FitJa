import { afterEach, describe, expect, it, vi } from "vitest";
import { initialCatalog } from "../src/data";
import { available, quoteCart, startingOffer, type CartLine, type Catalog, type Order, type Product } from "../shared/domain";
import { storeHoursError, storeHoursStatus } from "../shared/domain/hours";
import { filterOrders, salesReport } from "../shared/domain/orders";
import type { OrderEdit } from "../shared/contracts/admin";
import type { StoreHours } from "../shared/contracts/operations";

function fixture() {
  const catalog = structuredClone(initialCatalog);
  catalog.whatsapp = "5511999999999";
  const product = catalog.products.find((p) => p.id === "tapioca")!;
  const cart: CartLine[] = [
    { key: "opened", productId: product.id, variantId: product.variants[0].id, selections: [], quantity: 1 },
    { key: "second", productId: "coxinha", variantId: "v0", selections: [], quantity: 2 },
  ];
  const fixed: Product = {
    ...product, id: "fixture-fixed", name: "Combo fictício", kind: "fixed",
    components: [{ productId: product.id, variantId: product.variants[0].id, quantity: 2 }],
    variants: [{ id: "one", name: "Unitário", price: 1500 }],
  };
  const builder: Product = {
    ...fixed, id: "fixture-builder", name: "Montagem fictícia", kind: "builder", components: [],
    groups: [{ id: "required", name: "Escolha", min: 1, max: 1, repeat: false, options: [
      { id: "opt", name: "Opção", price: 0, component: { productId: product.id, variantId: product.variants[1].id } },
    ] }],
  };
  catalog.products.push(fixed, builder);
  return { catalog, product, fixed, builder, cart };
}

async function adapter(catalog: Catalog) {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  vi.stubGlobal("location", { hostname: "127.0.0.1" });
  const values = new Map([["fitja:published", JSON.stringify(catalog)]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  return import("../src/shared/api/legacyAdapter");
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

describe("horários em Caruaru", () => {
  const hours: StoreHours = {
    days: { mon: [{ opens: "08:00", closes: "13:00" }, { opens: "15:30", closes: "20:30" }], tue: [] },
    closures: [{ date: "2026-11-30", notice: "Feriado de ensaio" }],
  };
  const at = (iso: string) => storeHoursStatus(hours, new Date(iso));
  it("avalia a faixa local e os limites, sem inferir fechamento em dias não cadastrados", () => {
    expect(at("2026-11-23T11:00:00Z")).toMatchObject({ state: "open" });
    expect(at("2026-11-23T16:00:00Z")).toMatchObject({ state: "closed" });
    expect(at("2026-11-23T18:30:00Z")).toMatchObject({ state: "open" });
    expect(at("2026-11-24T01:00:00Z")).toMatchObject({ state: "closed" });
    expect(at("2026-11-24T12:00:00Z")).toMatchObject({ state: "closed" });
    expect(at("2026-11-25T12:00:00Z")).toMatchObject({ state: "unknown" });
    expect(at("2026-11-30T12:00:00Z")).toEqual({ state: "closed", text: "Feriado de ensaio", exceptional: true });
    expect(storeHoursStatus({ days: {}, closures: [] })).toMatchObject({ state: "unknown" });
  });
  it("recusa faixas sobrepostas, virada de dia e datas inexistentes", () => {
    expect(storeHoursError({ ...hours, days: { mon: [{ opens: "20:00", closes: "08:00" }] } })).toMatch(/mesmo dia/);
    expect(storeHoursError({ ...hours, days: { mon: [{ opens: "08:00", closes: "12:00" }, { opens: "11:00", closes: "13:00" }] } })).toMatch(/sobreposição/);
    expect(storeHoursError({ ...hours, closures: [{ date: "2026-02-30", notice: "" }] })).toMatch(/válidas/);
  });
});

it("esgota sabor, preserva rascunho e restaura só o tema com revisão de versão", async () => {
  const { catalog, product, fixed, builder, cart } = fixture();
  const api = await adapter(catalog);
  const newTheme = { ...catalog.theme, font: "Manrope" } as const;
  await api.publish({ ...catalog, theme: newTheme });
  const draft = { ...catalog, tagline: "Alteração fictícia ainda em rascunho", theme: newTheme };
  await api.saveDraft(draft);
  const published = await api.loadCatalog();
  const pause = { kind: "builders", paused: true } as const;
  const paused = await api.updateAvailability({ expectedVersion: published.version, change: pause });
  expect(available(paused, builder)).toBe(false);
  expect(available(paused, fixed)).toBe(true);
  const stale = await api.previewAppearance();
  const soldOut = await api.updateAvailability({
    expectedVersion: paused.version,
    change: { kind: "variant", productId: product.id, variantId: product.variants[0].id, available: false },
  });
  expect(available(soldOut, fixed)).toBe(false);
  expect(startingOffer(soldOut, product)?.variant.id).not.toBe(product.variants[0].id);
  expect(() => quoteCart(soldOut, cart)).toThrow("indisponível");
  await expect(api.restoreAppearance({ expectedVersion: stale.expectedVersion, snapshotVersion: stale.snapshot.version })).rejects.toMatchObject({ code: "CONFLICT" });
  const preview = await api.previewAppearance();
  expect(preview.catalog.theme).toEqual(catalog.theme);
  const restored = await api.restoreAppearance({ expectedVersion: preview.expectedVersion, snapshotVersion: preview.snapshot.version });
  expect(restored).toMatchObject({ theme: catalog.theme, tagline: catalog.tagline, liveAvailability: soldOut.liveAvailability });
  expect(await api.getDraft()).toEqual(draft);
  expect(() => quoteCart(restored, cart)).toThrow("indisponível");
  const unavailable = await api.updateAvailability({
    expectedVersion: restored.version, change: { kind: "product", productId: product.id, available: false },
  });
  expect(available(unavailable, product)).toBe(false);
});

it("encaminha fora do horário, preserva referência e histórico do atendimento parcial e rejeita gravação concorrente", async () => {
  const { catalog, cart } = fixture();
  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Recife", dateStyle: "short" }).format(new Date());
  catalog.storeHours = { days: {}, closures: [{ date, notice: "Fechado para ensaio." }] };
  const api = await adapter(catalog);
  expect(storeHoursStatus(catalog.storeHours).state).toBe("closed");
  const signature = quoteCart(catalog, cart).signature;
  const [created, retry] = await Promise.all([
    api.submitOrder(cart, "Ensaio", "checkout-key", signature, "", catalog.whatsapp),
    api.submitOrder(cart, "Ensaio", "checkout-key", signature, "", catalog.whatsapp),
  ]);
  expect(retry.reference).toBe(created.reference);
  const found = await api.findSiteOrder(created.reference.toLowerCase());
  const edit: OrderEdit = {
    id: found.id, siteReference: found.reference, expectedUpdatedAt: found.updated_at,
    cart: cart.slice(0, 1), status: "evaluating", source: "site", notes: "Atendimento parcial",
    paymentMethod: "Pix", adjustment: 0, adjustment_reason: "",
  };
  const [success, conflict] = await Promise.allSettled([api.saveOrder(edit), api.saveOrder({ ...edit, notes: "Outra aba" })]);
  expect(success.status).toBe("fulfilled");
  expect(conflict).toMatchObject({ status: "rejected", reason: { code: "CONFLICT" } });
  const [order] = await api.listOrders();
  expect(order).toMatchObject({ reference: created.reference, status: "evaluating", paymentMethod: "Pix" });
  expect(order.original.lines).toHaveLength(2);
  expect(order.current.lines).toHaveLength(1);
  expect(order.history?.map((entry) => entry.quote.lines.length)).toEqual([2, 1]);
  await expect(api.saveOrder({ ...edit, id: undefined })).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect((await api.submitOrder(cart, "Ensaio", "checkout-key", signature, "")).notes).toBe("Ensaio");
  expect(await api.listOrders()).toHaveLength(1);
});

it("conta vendas concluídas por origem com ajuste e combo e exporta as linhas filtradas", async () => {
  const { catalog, cart, fixed } = fixture();
  const api = await adapter(catalog);
  const time = "2026-11-23T16:00:00Z";
  const now = new Date("2026-11-24T12:00:00Z");
  const normal = quoteCart(catalog, cart.slice(0, 1));
  const combo = quoteCart(catalog, [{ key: "combo-line", productId: fixed.id, variantId: "one", quantity: 2, selections: [] }]);
  const direct: Order = {
    id: "counter", reference: "FJ-COUNTER", created_at: time, updated_at: time, completed_at: time,
    source: "counter", status: "completed", current: combo, original: combo, notes: "", adjustment: -200,
    adjustment_reason: "Desconto fictício", paymentMethod: "Pix",
  };
  const site: Order = { ...direct, id: "site", reference: "FJ-SITE", source: "site", current: normal, original: normal, adjustment: 0 };
  const records: Order[] = [
    direct, site,
    { ...site, id: "cancelled", reference: "FJ-CANCELLED", status: "cancelled", completed_at: null },
    { ...site, id: "old", reference: "FJ-OLD", completed_at: "2026-11-16T16:00:00Z" },
    { ...site, id: "ask", status: "requested", completed_at: null },
    { ...site, id: "evaluating", status: "evaluating", completed_at: null },
    { ...site, id: "accepted", status: "confirmed", completed_at: null },
  ];
  const week = salesReport(records, "week", now);
  expect(week).toMatchObject({ pending: 2, accepted: 1, completed: 2, revenue: 3700, average: 1850,
    byOrigin: { site: { count: 1, total: 900 }, counter: { count: 1, total: 2800 } } });
  expect(week.products.map(({ quantity }) => quantity)).toEqual([2, 1]);
  expect(week.components[0].quantity).toBe(4);
  expect(salesReport(records, "month", now).completed).toBe(3);
  const filtered = filterOrders(records, { status: "completed", source: "counter", search: "COMBO", period: "week" }, now);
  const output = api.csv(filtered);
  expect(output).toContain("FJ-COUNTER");
  expect(output).toContain("Pix");
  expect(output).not.toMatch(/FJ-SITE|FJ-OLD|FJ-CANCELLED/);
  const edit: OrderEdit = {
    cart, idempotencyKey: "manual-retry", status: "completed", source: "counter",
    notes: "", adjustment: 0, adjustment_reason: "",
  };
  const [first, second] = await Promise.all([api.saveOrder(edit), api.saveOrder(edit)]);
  expect(first.reference).toBe(second.reference);
  expect(await api.listOrders()).toHaveLength(1);
  await expect(api.saveOrder({ ...edit, notes: "payload distinto" })).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
});
