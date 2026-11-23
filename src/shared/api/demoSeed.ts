// Liga o gerador ao armazenamento do navegador. Só faz sentido na demonstração local.
import type { Catalog, Highlight, Order } from "../../../shared/domain";
import type { EventRow } from "../../../shared/contracts/admin";
import { initialCatalog } from "../../data";
import { demoPrefix, generateDemoData } from "./demoData";
import { storage } from "./legacyAdapter";

const isDemoOrder = (order: Order) => order.id.startsWith(demoPrefix);
const isDemoEvent = (event: EventRow) => event.session_id.startsWith(demoPrefix);
const isDemoHighlight = (item: Highlight) => item.id.startsWith(demoPrefix);

// Avisos de teste: um de feriado (Natal) e uma promoção, com as imagens de 1200×600 em public/media/destaques.
export const demoHighlights: Highlight[] = [
  {
    id: "demo-natal",
    title: "Feliz Natal!",
    text: "24/12 atendemos até 13h30. 25/12 não vamos funcionar.",
    image: "/media/destaques/destaque-natal.webp",
    active: true,
    until: "2026-12-31",
  },
  {
    id: "demo-promocao",
    title: "Promoção da semana",
    text: "5 marmitas e ganha 1 brigadeiro de presente.",
    image: "/media/destaques/destaque-promocao.webp",
    active: true,
  },
];

export function hasDemoData() {
  return storage.get<Order[]>("orders", []).some(isDemoOrder);
}

export function seedDemoData(now = new Date()) {
  const published = storage.get<Catalog>("published", initialCatalog);
  const { orders, events } = generateDemoData(published, now);
  const realOrders = storage.get<Order[]>("orders", []).filter((order) => !isDemoOrder(order));
  const realEvents = storage.get<EventRow[]>("events", []).filter((event) => !isDemoEvent(event));
  storage.set("orders", [...orders, ...realOrders].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  storage.set("events", [...events, ...realEvents].sort((a, b) => a.created_at.localeCompare(b.created_at)));
  // Horário comercial da Laís (seg–sex, dois turnos) no cardápio publicado e no rascunho.
  const storeHours = initialCatalog.storeHours;
  const draft = storage.get<Catalog | null>("draft", null);
  const withNotices = (catalog: Catalog): Catalog => ({
    ...catalog,
    storeHours,
    highlights: [...(catalog.highlights ?? []).filter((item) => !isDemoHighlight(item)), ...demoHighlights],
  });
  storage.set("published", { ...withNotices(published), version: crypto.randomUUID() });
  if (draft) storage.set("draft", withNotices(draft));
  return { orders: orders.length, events: events.length };
}

export function clearDemoData() {
  const orders = storage.get<Order[]>("orders", []);
  const events = storage.get<EventRow[]>("events", []);
  for (const key of ["published", "draft"] as const) {
    const catalog = storage.get<Catalog | null>(key, null);
    if (catalog?.highlights?.some(isDemoHighlight)) {
      storage.set(key, { ...catalog, highlights: catalog.highlights.filter((item) => !isDemoHighlight(item)) });
    }
  }
  storage.set("orders", orders.filter((order) => !isDemoOrder(order)));
  storage.set("events", events.filter((event) => !isDemoEvent(event)));
  return { orders: orders.filter(isDemoOrder).length, events: events.filter(isDemoEvent).length };
}
