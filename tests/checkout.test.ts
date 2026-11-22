import { describe, expect, it, vi } from "vitest";
import { initialCatalog } from "../src/data";
import { orderMessage, quoteCart, whatsappUrl, type CartLine, type Order } from "../shared/domain";
import type { CheckoutApi } from "../shared/contracts/checkout";
import { checkoutNotes, createRequest, reviewSelection } from "../src/features/checkout/service";

const cart: CartLine[] = [{ key: "item-1", productId: "tapioca", variantId: "frango", quantity: 1, selections: [] }];

function fixture() {
  const catalog = structuredClone(initialCatalog);
  catalog.whatsapp = "5511999999999";
  const product = catalog.products.find((p) => p.id === "tapioca")!;
  const selection = [{ ...cart[0], variantId: product.variants[0].id }];
  const quote = quoteCart(catalog, selection);
  const order: Order = {
    id: "request-key", reference: "TEST-001", status: "requested", source: "site",
    original: quote, current: quote, notes: checkoutNotes("Sem talheres", "delivery"),
    adjustment: 0, adjustment_reason: "", completed_at: null,
    created_at: "2026-11-22T12:00:00Z", updated_at: "2026-11-22T12:00:00Z",
  };
  const api: CheckoutApi = { loadCatalog: vi.fn(async () => catalog), submitOrder: vi.fn(async () => order) };
  return { catalog, selection, quote, order, api };
}

describe("revisão e encaminhamento", () => {
  it("revisar não registra solicitação; criar encaminha escolhas e chave estável ao adaptador", async () => {
    const { api, selection, quote, order } = fixture();
    expect((await reviewSelection(api, selection)).quote.total).toBe(900);
    expect(api.submitOrder).not.toHaveBeenCalled();
    const input = { cart: selection, notes: order.notes, key: "request-key", signature: quote.signature, token: "" };
    expect(await createRequest(api, input)).toBe(order);
    expect(await createRequest(api, input)).toBe(order);
    expect(api.submitOrder).toHaveBeenLastCalledWith(selection, order.notes, "request-key", quote.signature, "");
  });

  it("interrompe criação quando preço ou disponibilidade mudam", async () => {
    const { api, selection, quote, catalog } = fixture();
    const input = { cart: selection, notes: "", key: "request-key", signature: quote.signature, token: "" };
    catalog.products.find((p) => p.id === "tapioca")!.variants[0].price += 100;
    await expect(createRequest(api, input)).rejects.toThrow(/cardápio mudou/);
    catalog.products.find((p) => p.id === "tapioca")!.available = false;
    await expect(createRequest(api, input)).rejects.toThrow();
    expect(api.submitOrder).not.toHaveBeenCalled();
  });

  it("preserva falhas de rede e impede registro sem contato válido", async () => {
    const { api, selection, quote, catalog } = fixture();
    const input = { cart: selection, notes: "", key: "request-key", signature: quote.signature, token: "" };
    catalog.whatsapp = "";
    await expect(createRequest(api, input)).rejects.toThrow(/WhatsApp/);
    expect(api.submitOrder).not.toHaveBeenCalled();
    vi.mocked(api.loadCatalog).mockRejectedValueOnce(new Error("Sem conexão"));
    await expect(reviewSelection(api, selection)).rejects.toThrow("Sem conexão");
  });

  it("mantém referência, preferência, observações e lista completa no resumo e link curto", () => {
    const { order } = fixture();
    const message = orderMessage(order);
    expect(message).toContain("TEST-001");
    expect(message).toContain("Preferência: Entrega");
    expect(message).toContain("Sem talheres");
    expect(message).toContain("R$ 9,00");
    expect(new URL(whatsappUrl("5511999999999", order)).searchParams.get("text")).toBe(message);
    expect(checkoutNotes("", "pickup")).toBe("Preferência: Retirada.");
  });

  it("dez composições extensas continuam completas para cópia, sem truncar silenciosamente no link", () => {
    const { order } = fixture();
    order.current.lines = Array.from({ length: 10 }, (_, i) => ({
      ...order.current.lines[0], key: `item-${i}`, name: `Montagem fictícia ${i + 1}`,
      details: [`Escolhas ${i + 1}: ${"arroz, feijão, legumes; ".repeat(25)}`],
    }));
    const message = orderMessage(order);
    for (let i = 1; i <= 10; i++) expect(message).toContain(`Escolhas ${i}:`);
    expect(whatsappUrl("5511999999999", order)).toBe("https://wa.me/5511999999999");
  });
});
