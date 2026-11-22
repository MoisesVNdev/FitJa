import { quoteCart, validPhone, type CartLine } from "../../../shared/domain";
import type { CheckoutApi, Fulfillment } from "../../../shared/contracts/checkout";

export function checkoutNotes(notes: string, fulfillment: Fulfillment) {
  return `Preferência: ${fulfillment === "delivery" ? "Entrega" : "Retirada"}.${notes ? `\n${notes}` : ""}`;
}

export async function reviewSelection(api: CheckoutApi, cart: CartLine[]) {
  const catalog = await api.loadCatalog();
  return { catalog, quote: quoteCart(catalog, cart) };
}

export async function createRequest(
  api: CheckoutApi,
  input: { cart: CartLine[]; notes: string; key: string; signature: string; token: string },
) {
  const { catalog, quote } = await reviewSelection(api, input.cart);
  if (quote.signature !== input.signature)
    throw new Error("O cardápio mudou. Atualize a revisão antes de continuar.");
  if (!validPhone(catalog.whatsapp))
    throw new Error("A loja ainda não configurou o WhatsApp. Tente novamente mais tarde.");
  // The server must independently repeat validation and honor this key.
  return api.submitOrder(input.cart, input.notes, input.key, quote.signature, input.token);
}
