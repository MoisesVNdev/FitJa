import { describe, expect, it } from "vitest";
import { initialCatalog } from "../src/data";
import { generateDemoData } from "../src/shared/api/demoData";
import { salesReport } from "../shared/domain/orders";
import { caruaruDate, storeHoursStatus } from "../shared/domain/hours";

const now = new Date("2026-11-22T21:00:00-03:00"); // domingo à noite

describe("dados fictícios de 3 meses", () => {
  const { orders, events } = generateDemoData(initialCatalog, now);

  it("gera pedidos e eventos suficientes e é determinístico", () => {
    expect(orders.length).toBeGreaterThan(300);
    expect(events.length).toBeGreaterThan(1000);
    expect(generateDemoData(initialCatalog, now).orders.map((o) => o.id)).toEqual(orders.map((o) => o.id));
  });

  it("cobre os últimos 3 meses sem datas futuras", () => {
    const dates = orders.map((o) => caruaruDate(new Date(o.created_at)).date).sort();
    expect(dates[0] <= "2026-08-25").toBe(true);
    expect(orders.every((o) => +new Date(o.created_at) <= +now)).toBe(true);
  });

  it("só tem pedidos de segunda a sexta, dentro do horário comercial", () => {
    for (const order of orders) {
      const { time } = caruaruDate(new Date(order.created_at));
      const status = storeHoursStatus(initialCatalog.storeHours, new Date(order.created_at));
      expect(status.state, `${order.reference} às ${time}`).toBe("open");
    }
  });

  it("alimenta o relatório com favoritos, origens e ticket médio", () => {
    const report = salesReport(orders, "quarter", now);
    expect(report.completed).toBeGreaterThan(200);
    expect(report.revenue).toBeGreaterThan(0);
    expect(report.average).toBeGreaterThan(0);
    expect(report.products.length).toBeGreaterThan(3);
    for (const source of ["site", "counter", "whatsapp"] as const) expect(report.byOrigin[source].count).toBeGreaterThan(0);
  });

  it("marca tudo como fictício e não repete identificadores", () => {
    expect(orders.every((o) => o.id.startsWith("demo-"))).toBe(true);
    expect(events.every((e) => e.session_id.startsWith("demo-"))).toBe(true);
    expect(new Set(orders.map((o) => o.id)).size).toBe(orders.length);
  });
});
