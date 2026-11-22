import { afterEach, expect, it, vi } from "vitest";
import { initialCatalog } from "../src/data";
import { quoteCart, type CartLine } from "../shared/domain";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

it("adaptador local reusa referência ao retomar e rejeita reaproveitar a chave com outra seleção", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  vi.stubGlobal("location", { hostname: "127.0.0.1" });
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  const catalog = structuredClone(initialCatalog);
  catalog.whatsapp = "5511999999999";
  values.set("fitja:published", JSON.stringify(catalog));
  const cart: CartLine[] = [{ key: "line", productId: "tapioca", variantId: catalog.products.find((p) => p.id === "tapioca")!.variants[0].id, quantity: 1, selections: [] }];
  const { submitOrder, listOrders } = await import("../src/shared/api/legacyAdapter");
  const signature = quoteCart(catalog, cart).signature;
  const first = await submitOrder(cart, "Preferência: Retirada.", "same-key", signature, "");
  // Simulates another dialog / reload: persistence, rather than component memory, owns idempotency.
  const second = await submitOrder(structuredClone(cart), "Preferência: Retirada.", "same-key", signature, "");
  expect(second.reference).toBe(first.reference);
  expect(await listOrders()).toHaveLength(1);
  await expect(submitOrder(cart, "Outra observação", "same-key", signature, "")).rejects.toThrow(/referência já foi utilizada/);
  const changed = [{ ...cart[0], quantity: 2 }];
  await expect(submitOrder(changed, "Preferência: Retirada.", "same-key", quoteCart(catalog, changed).signature, "")).rejects.toThrow();
  expect(await listOrders()).toHaveLength(1);
});
