import { useState, type ReactNode } from "react";
import { BarChart3, Eye, Leaf, Package, ShoppingBag } from "lucide-react";
import { money, type Order } from "../../../../shared/domain";
import { caruaruDate, caruaruTimeZone } from "../../../../shared/domain/hours";
import { filterOrders, salesReport } from "../../../../shared/domain/orders";
import type { ReportPeriod } from "../../../../shared/contracts/admin";
import { clearDemoData, csv, demo, download, hasDemoData, seedDemoData, type EventRow } from "../../../shared/api/admin";

import { sourceLabels, date, Empty, Status } from "../ui";
export default function Dashboard({
  orders,
  events,
  onOrders,
  refresh,
}: {
  orders: Order[];
  events: EventRow[];
  onOrders: () => void;
  refresh: () => Promise<void>;
}) {
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [origin, setOrigin] = useState<Order["source"] | "all">("all");
  const now = new Date();
  const scoped = origin === "all" ? orders : orders.filter((order) => order.source === origin);
  const report = salesReport(scoped, period, now);
  const completed = filterOrders(scoped, { status: "completed", source: "all", search: "", period }, now);
  const windowDays = period === "week" ? 7 : period === "month" ? 30 : 90;
  const ev = events.filter((e) => +new Date(e.created_at) >= +now - windowDays * 86400000),
    visits = new Set(
      ev.filter((e) => e.name === "visit").map((e) => e.session_id),
    ).size;
  const ranking = report.products;
  const max = Math.max(1, ...ranking.map((item) => item.quantity));
  const recent = filterOrders(scoped, { status: "completed", source: "all", search: "" }, now);
  const orderDay = (o: Order) => caruaruDate(new Date(o.completed_at || o.updated_at)).date;
  const total = (o: Order) => o.current.total + o.adjustment;
  // Semana e mês: últimos 7 dias, um por barra. Três meses: 13 semanas, uma por barra.
  const bars = period === "quarter"
    ? Array.from({ length: 13 }, (_, i) => {
        const end = new Date(+now - (12 - i) * 7 * 86400000),
          last = caruaruDate(end).date,
          first = caruaruDate(new Date(+end - 6 * 86400000)).date;
        return {
          label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: caruaruTimeZone }).format(end),
          value: recent.filter((o) => orderDay(o) >= first && orderDay(o) <= last).reduce((n, o) => n + total(o), 0),
        };
      })
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date(+now - (6 - i) * 86400000),
          day = caruaruDate(d).date;
        return {
          label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: caruaruTimeZone }).format(d).replace(".", ""),
          value: recent.filter((o) => orderDay(o) === day).reduce((n, o) => n + total(o), 0),
        };
      });
  const barMax = Math.max(1, ...bars.map((x) => x.value));
  return (
    <>
      {demo && <DemoDataCard refresh={refresh} />}
      <div className="dashboard-toolbar">
        <span>
          <span className="status-dot" />
          Atualização manual de vendas
        </span>
        <div>
          <select
            aria-label="Período do dashboard"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="quarter">Últimos 3 meses</option>
          </select>
          <select aria-label="Origem das vendas" value={origin} onChange={(event) => setOrigin(event.target.value as typeof origin)}>
            <option value="all">Todas as origens</option>
            {Object.entries(sourceLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <button className="button secondary compact" onClick={() => download("fitja-vendas.csv", csv(completed))}>
            Exportar vendas CSV
          </button>
          <button
            className="button secondary compact"
            onClick={() => void refresh()}
          >
            Atualizar
          </button>
        </div>
      </div>
      <div className="stat-grid">
        <Stat
          label="Vendas registradas"
          value={money(report.revenue)}
          hint="Concluídos no período, com ajustes"
          icon={<BarChart3 />}
        />
        <Stat
          label="Pedidos concluídos"
          value={String(report.completed)}
          hint="Pela data de conclusão em Caruaru"
          icon={<ShoppingBag />}
        />
        <Stat
          label="Ticket médio"
          value={money(report.average)}
          hint="Calculado sobre pedidos concluídos"
          icon={<Package />}
        />
        <Stat
          label="Acessos aproximados"
          value={String(visits)}
          hint={`Últimos ${windowDays} dias · ${ev.filter((e) => e.name === "whatsapp_click").length} cliques no WhatsApp`}
          icon={<Eye />}
        />
      </div>
      <section className="admin-card">
        <h2>Vendas por origem</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th scope="col">Origem</th><th scope="col">Pedidos concluídos</th><th scope="col">Vendas</th></tr></thead>
            <tbody>
              {(Object.keys(sourceLabels) as Order["source"][]).filter((source) => origin === "all" || source === origin).map((source) => (
                <tr key={source}><th scope="row">{sourceLabels[source]}</th><td>{report.byOrigin[source].count}</td><td>{money(report.byOrigin[source].total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="dashboard-columns">
        <section className="admin-card">
          <div className="card-heading">
            <div>
              <h2>{period === "quarter" ? "Três meses de sabores" : "Uma semana de sabores"}</h2>
              <p>{period === "quarter" ? "Valores concluídos · por semana, últimas 13 semanas" : "Valores concluídos · últimos 7 dias"}</p>
            </div>
            <span className="chart-legend">Vendas registradas</span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={bars
              .map((b) => `${b.label}: ${money(b.value)}`)
              .join(", ")}
          >
            {bars.map((b, i) => (
              <div key={i}>
                <span className="bar-value">
                  {b.value ? money(b.value) : "—"}
                </span>
                <div className="bar-track">
                  <div
                    style={{
                      height: `${b.value ? Math.max(3, (b.value / barMax) * 100) : 2}%`,
                    }}
                  />
                </div>
                <small>{b.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-card">
          <div className="card-heading">
            <div>
              <h2>Favoritos dos clientes</h2>
              <p>Unidades vendidas no período</p>
            </div>
            <HeartIcon />
          </div>
          {ranking.length ? (
            ranking.slice(0, 5).map((p, i) => (
              <div className="ranking" key={p.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small className="muted">{money(p.total)} em produtos</small>
                  <div className="rank-track">
                    <div style={{ width: `${(p.quantity / max) * 100}%` }} />
                  </div>
                </div>
                <b>{p.quantity}</b>
              </div>
            ))
          ) : (
            <Empty
              title="Os favoritos vão aparecer aqui"
              text="Conclua os primeiros pedidos para acompanhar os produtos mais vendidos."
            />
          )}
        </section>
      </div>
      {report.components.length > 0 && (
        <section className="admin-card">
          <h2>Componentes dos combos</h2>
          <p className="muted">
            Para planejar a produção. Estas unidades não somam receita
            novamente.
          </p>
          <div className="component-chips">
            {report.components.map((x) => (
              <span key={x.id}>
                {x.name}
                <b>{x.quantity} un.</b>
              </span>
            ))}
          </div>
        </section>
      )}
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <h2>Últimas solicitações</h2>
            <p>Abrir o WhatsApp não confirma uma venda.</p>
          </div>
          <button className="text-button" onClick={onOrders}>
            Ver todos os pedidos
          </button>
        </div>
        {orders.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Origem</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.reference}</strong>
                    </td>
                    <td>{date(o.created_at)}</td>
                    <td>{sourceLabels[o.source]}</td>
                    <td>
                      <Status status={o.status} source={o.source} />
                    </td>
                    <td>{money(o.current.total + o.adjustment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Tudo pronto para o primeiro pedido"
            text="As solicitações feitas no cardápio aparecerão aqui."
          />
        )}
      </section>
      <p className="small muted">
        Valores representam registros manuais de vendas, não confirmação
        bancária de pagamento. Acessos e interações são aproximados e podem ser
        afetados por bloqueadores. Eventos disponíveis por até 90 dias.
      </p>
    </>
  );
}
function DemoDataCard({ refresh }: { refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const present = hasDemoData();
  function run(action: () => string) {
    setError("");
    try {
      setMessage(action());
    } catch (problem) {
      setMessage("");
      setError((problem as Error).message);
    }
  }
  return (
    <section className="admin-card demo-data-card" aria-label="Dados fictícios de demonstração">
      <div>
        <h2>Dados de demonstração</h2>
        <p className="muted">
          {present
            ? "Há 3 meses de pedidos e acessos fictícios neste navegador. Eles não são vendas reais."
            : "Preencha o painel com 3 meses de pedidos e acessos fictícios para ver como os números aparecem. Também define o horário comercial: segunda a sexta, 8h–13h30 e 16h30–20h30."}
        </p>
      </div>
      <div className="appearance-actions">
        <button className="button primary compact" type="button" onClick={() => {
          if (present && !window.confirm("Gerar novamente? Os dados fictícios atuais serão substituídos (pedidos reais não são apagados).")) return;
          run(() => {
            const result = seedDemoData();
            void refresh();
            return `Pronto: ${result.orders} pedidos e ${result.events} eventos fictícios. Recarregue a página para atualizar também os horários.`;
          });
        }}>{present ? "Gerar de novo" : "Gerar 3 meses de dados"}</button>
        {present && (
          <button className="button secondary compact" type="button" onClick={() => {
            if (!window.confirm("Apagar somente os dados fictícios? Pedidos reais ficam.")) return;
            run(() => {
              const result = clearDemoData();
              void refresh();
              return `Removidos ${result.orders} pedidos e ${result.events} eventos fictícios.`;
            });
          }}>Apagar dados fictícios</button>
        )}
      </div>
      {message && <p role="status" className="small">{message}</p>}
      {error && <p role="alert" className="small danger">{error}</p>}
    </section>
  );
}
function HeartIcon() {
  return <Leaf className="orange" />;
}
function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <article className="stat-card">
      <div>
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
