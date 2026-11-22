import { money, quoteCart, validPhone, type CartLine, type Catalog } from "../../../shared/domain";
import type { CheckoutApi, CheckoutReview, Fulfillment } from "../../../shared/contracts/checkout";

export const missingWhatsApp = "A loja ainda não configurou o WhatsApp. Sua sacola fica salva neste navegador.";

export function checkoutNotes(notes: string, fulfillment: Fulfillment) {
  return `Preferência: ${fulfillment === "delivery" ? "Entrega" : "Retirada"}.${notes ? `\n${notes}` : ""}`;
}

export function inspectSelection(catalog: Catalog, cart: CartLine[]): CheckoutReview {
  if (cart.length === 0) return { catalog, lines: [], quote: null };
  try {
    const quote = quoteCart(catalog, cart);
    return { catalog, lines: quote.lines.map((line) => ({ key: line.key, quote: line })), quote };
  } catch (error) {
    const lines = cart.map((line) => {
      try {
        return { key: line.key, quote: quoteCart(catalog, [line]).lines[0] };
      } catch (lineError) {
        return { key: line.key, quote: null, problem: (lineError as Error).message };
      }
    });
    const validLines = cart.filter((_, index) => !lines[index].problem);
    if (validLines.length > 0 && validLines.length < cart.length) {
      try {
        const validQuote = quoteCart(catalog, validLines);
        const byKey = new Map(validQuote.lines.map((line) => [line.key, line]));
        for (const line of lines) {
          if (!line.problem) line.quote = byKey.get(line.key) ?? line.quote;
        }
      } catch {
        // Keep line-level guidance when the remaining selection exceeds a cart limit.
      }
    }
    return {
      catalog,
      lines,
      quote: null,
      problem: lines.every((line) => !line.problem) ? (error as Error).message : undefined,
    };
  }
}

export function describeChanges(before: CheckoutReview, after: CheckoutReview) {
  const changes: Record<string, string> = {};
  const previousLines = new Map(before.lines.map((line) => [line.key, line.quote]));
  for (const current of after.lines) {
    const previous = previousLines.get(current.key);
    const next = current.quote;
    if (!next) continue;
    if (!previous) changes[current.key] = "Disponibilidade atualizada. Confira esta opção.";
    else if (previous.unitPrice !== next.unitPrice) {
      changes[current.key] = `Preço atualizado por porção: ${money(previous.unitPrice)} → ${money(next.unitPrice)}.`;
    } else if (
      previous.name !== next.name || previous.variant !== next.variant ||
      JSON.stringify(previous.details) !== JSON.stringify(next.details)
    ) {
      changes[current.key] = "A composição ou o nome desta opção mudou. Confira os detalhes.";
    }
  }
  return changes;
}

export async function reviewSelection(api: CheckoutApi, cart: CartLine[]) {
  return inspectSelection(await api.loadCatalog(), cart);
}

export function isCatalogConflict(error: unknown) {
  // The legacy endpoint exposes error text. Keep the compatibility check at the checkout boundary.
  return error instanceof Error &&
    /cardápio mudou|está indisponível|escolha uma opção e quantidade válidas|escolha inválida ou repetida|: selecione de|WhatsApp da loja ainda não configurado|contato do WhatsApp mudou/i.test(error.message);
}

export async function createRequest(
  api: CheckoutApi,
  input: { cart: CartLine[]; notes: string; key: string; signature: string; token: string; whatsapp: string },
) {
  if (!validPhone(input.whatsapp)) throw new Error(missingWhatsApp);
  // The adapter must independently validate the final price and availability.
  return api.submitOrder(input.cart, input.notes, input.key, input.signature, input.token, input.whatsapp);
}
