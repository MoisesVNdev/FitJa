// Gerador de dados fictícios para demonstrar o painel (pedidos e eventos de 3 meses).
// Função pura e determinística: sem acesso ao navegador, fácil de testar.
import {
  available, quoteCart, variantInStock,
  type CartLine, type Catalog, type Order, type OrderStatus, type Product, type Selection,
} from "../../../shared/domain";
import type { EventRow } from "../../../shared/contracts/admin";
import { caruaruDate } from "../../../shared/domain/hours";

export const demoPrefix = "demo-";
export const demoDays = 90;

function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Caruaru fica em UTC−3 o ano todo (sem horário de verão).
const instant = (date: string, minutes: number) =>
  new Date(`${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00-03:00`);
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const isWeekday = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
};

const notes = [
  "", "", "", "", "", "Sem cebola, por favor.", "Entregar na portaria.", "Retiro às 12h.",
  "Pode cortar a coxinha ao meio?", "Sem pimenta.", "Molho à parte.", "Troco para 50.",
];
const adjustments = [
  { value: -200, reason: "Desconto para cliente fiel" },
  { value: -300, reason: "Promoção de marmitas" },
  { value: 150, reason: "Taxa de entrega" },
];
const payments = ["Pix", "Pix", "Cartão", "Dinheiro"];

export function generateDemoData(catalog: Catalog, now = new Date(), seed = 20261122) {
  const rnd = random(seed);
  const pick = <T,>(items: T[]) => items[Math.floor(rnd() * items.length)];
  const chance = (p: number) => rnd() < p;
  const today = caruaruDate(now).date;
  const weights: Record<string, number> = { marmitas: 5, lanches: 3, doces: 2, bebidas: 1.5, combos: 1 };
  const products = catalog.products.filter((p) => !p.archived && available(catalog, p));
  const pool = products.flatMap((p) => Array(Math.round((weights[p.categoryId] ?? 1) * 2)).fill(p) as Product[]);
  const orders: Order[] = [];
  const events: EventRow[] = [];
  let sequence = 0;

  function line(product: Product, key: string): CartLine | null {
    const variants = product.variants.filter((v) => variantInStock(catalog, product, v.id));
    if (!variants.length) return null;
    const variant = pick(variants);
    const selections: Selection[] = [];
    for (const group of product.groups) {
      if (group.min > 0 && group.options.length) {
        selections.push({ groupId: group.id, optionId: pick(group.options).id, quantity: group.min });
      }
    }
    const quantity = chance(0.68) ? 1 : chance(0.75) ? 2 : 3;
    return { key, productId: product.id, variantId: variant.id, quantity, selections };
  }

  for (let offset = demoDays; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const open = isWeekday(date);
    const growth = 1 + (demoDays - offset) / demoDays; // pedidos crescem ao longo dos 3 meses
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const volume = open ? Math.round((5 + rnd() * 5) * growth + (weekday === 5 ? 3 : 0)) : 0;

    for (let n = 0; n < volume && pool.length; n++) {
      const minutes = chance(0.62)
        ? 8 * 60 + Math.floor(rnd() * 330 * (0.45 + rnd() * 0.55)) // turno da manhã, mais concentrado no meio
        : 16 * 60 + 30 + Math.floor(rnd() * 240);
      const created = instant(date, Math.min(minutes, 20 * 60 + 29));
      if (+created > +now) continue;
      const lines: CartLine[] = [];
      const used = new Set<string>();
      const count = chance(0.6) ? 1 : chance(0.75) ? 2 : 3;
      sequence += 1;
      for (let i = 0; i < count; i++) {
        const product = pick(pool);
        if (used.has(product.id)) continue;
        used.add(product.id);
        const next = line(product, `${demoPrefix}${sequence}-${i}`);
        if (next) lines.push(next);
      }
      if (!lines.length) continue;
      let quote;
      try { quote = quoteCart(catalog, lines); } catch { continue; }

      const recent = offset <= 1;
      let status: OrderStatus = "completed";
      if (recent) status = pick<OrderStatus>(["requested", "evaluating", "confirmed", "completed", "completed"]);
      else if (chance(0.06)) status = "cancelled";
      const source = chance(0.55) ? "site" : chance(0.62) ? "whatsapp" : "counter";
      const done = status === "completed" ? new Date(Math.min(+created + (20 + Math.floor(rnd() * 100)) * 60000, +now)) : null;
      const adjust = status === "completed" && chance(0.12) ? pick(adjustments) : { value: 0, reason: "" };
      const note = pick(notes);
      const hex = Array.from({ length: 10 }, () => Math.floor(rnd() * 16).toString(16)).join("").toUpperCase();
      orders.push({
        id: `${demoPrefix}${sequence}`,
        reference: `FJ-${date.replaceAll("-", "")}-${hex}`,
        created_at: created.toISOString(),
        updated_at: (done ?? new Date(Math.min(+created + 15 * 60000, +now))).toISOString(),
        status, source, notes: note, originalNotes: note,
        original: quote, current: quote,
        adjustment: adjust.value, adjustment_reason: adjust.reason,
        completed_at: done ? done.toISOString() : null,
        paymentMethod: source !== "site" && status === "completed" ? pick(payments) : undefined,
      });
      if (source === "site") {
        events.push({ name: "whatsapp_click", session_id: `${demoPrefix}s-${sequence}`, created_at: created.toISOString() });
      }
    }

    const visits = Math.round((open ? 28 + rnd() * 30 : 10 + rnd() * 12) * (0.7 + growth * 0.4));
    for (let v = 0; v < visits; v++) {
      const session = `${demoPrefix}v-${date}-${v}`;
      const at = instant(date, 7 * 60 + Math.floor(rnd() * 14 * 60));
      if (+at > +now) continue;
      const stamp = (extra: number) => new Date(+at + extra * 1000).toISOString();
      events.push({ name: "visit", session_id: session, created_at: stamp(0) });
      if (chance(0.4) && pool.length) events.push({ name: "product_view", product_id: pick(pool).id, session_id: session, created_at: stamp(25) });
      if (chance(0.18) && pool.length) events.push({ name: "add_to_cart", product_id: pick(pool).id, session_id: session, created_at: stamp(70) });
    }
  }
  orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { orders, events: events.slice(-8000) };
}
