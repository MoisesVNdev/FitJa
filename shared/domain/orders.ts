import type { OrderFilters, OrderHistoryEntry, ReportPeriod, SalesReport } from "../contracts/admin";
import { normalize, type Order } from "./index";
import { caruaruDate } from "./hours";

export const isPending = (order: Order) => order.status === "requested" || order.status === "evaluating";

export function filterOrders(orders: Order[], filters: OrderFilters, now = new Date()) {
  const query = normalize(filters.search.trim());
  const start = filters.period && periodStart(filters.period, now);
  return orders.filter((order) =>
    (filters.status === "all" || (filters.status === "pending" ? isPending(order) : order.status === filters.status)) &&
    (filters.source === "all" || order.source === filters.source) &&
    (!start || inPeriod(orderDate(order), start, now)) &&
    normalize([order.reference, ...order.current.lines.map((line) => line.name)].join(" ")).includes(query),
  ).sort((a, b) => Number(isPending(b)) - Number(isPending(a)));
}

export function historyEntry(order: Order): OrderHistoryEntry {
  return {
    at: order.updated_at, status: order.status, notes: order.notes, paymentMethod: order.paymentMethod,
    quote: order.current, adjustment: order.adjustment, adjustmentReason: order.adjustment_reason,
  };
}

function periodStart(period: ReportPeriod, now: Date) {
  const today = caruaruDate(now).date;
  const day = new Date(`${today}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return period === "week" ? day.toISOString().slice(0, 10) : `${today.slice(0, 7)}-01`;
}

function orderDate(order: Order) {
  return order.status === "completed" ? order.completed_at || order.updated_at : order.created_at;
}

function inPeriod(timestamp: string, start: string, now: Date) {
  const date = new Date(timestamp);
  return +date <= +now && caruaruDate(date).date >= start;
}

export function salesReport(orders: Order[], period: ReportPeriod, now = new Date()): SalesReport {
  const completed = filterOrders(orders, { status: "completed", source: "all", search: "", period }, now);
  const byOrigin: SalesReport["byOrigin"] = {
    site: { count: 0, total: 0 }, counter: { count: 0, total: 0 }, whatsapp: { count: 0, total: 0 },
  };
  const products = new Map<string, SalesReport["products"][number]>();
  const components = new Map<string, SalesReport["components"][number]>();
  let revenue = 0;
  for (const order of completed) {
    const total = order.current.total + order.adjustment;
    revenue += total;
    byOrigin[order.source].count += 1;
    byOrigin[order.source].total += total;
    for (const line of order.current.lines) {
      const product = products.get(line.productId) ?? { id: line.productId, name: line.name, quantity: 0, total: 0 };
      product.quantity += line.quantity;
      product.total += line.total;
      products.set(product.id, product);
      for (const component of line.components) {
        const id = JSON.stringify([component.productId, component.variantId]);
        const item = components.get(id) ?? { id, name: component.name, quantity: 0 };
        item.quantity += component.quantity * line.quantity;
        components.set(id, item);
      }
    }
  }
  return {
    pending: orders.filter(isPending).length,
    accepted: orders.filter((order) => order.status === "confirmed").length,
    completed: completed.length,
    revenue,
    average: completed.length ? Math.round(revenue / completed.length) : 0,
    byOrigin,
    products: [...products.values()].sort((a, b) => b.quantity - a.quantity || b.total - a.total),
    components: [...components.values()],
  };
}
