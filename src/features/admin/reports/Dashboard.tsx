import { useState, type ReactNode } from "react";
import { BarChart3, Eye, Leaf, Package, ShoppingBag } from "lucide-react";
import { money, type Order } from "../../../../shared/domain";
import { type EventRow } from "../../../shared/api/admin";

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
  const [days, setDays] = useState(7);
  const now = Date.now(),
    since = now - days * 86400000,
    prev = since - days * 86400000;
  const completed = orders.filter(
      (o) =>
        o.status === "completed" &&
        new Date(o.completed_at || o.updated_at).getTime() >= since,
    ),
    requested = orders.filter(
      (o) => o.source === "site" && new Date(o.created_at).getTime() >= since,
    ),
    prior = orders.filter(
      (o) =>
        o.status === "completed" &&
        new Date(o.completed_at || o.updated_at).getTime() >= prev &&
        new Date(o.completed_at || o.updated_at).getTime() < since,
    );
  const revenue = completed.reduce(
      (n, o) => n + o.current.total + o.adjustment,
      0,
    ),
    oldRevenue = prior.reduce((n, o) => n + o.current.total + o.adjustment, 0),
    ev = events.filter((e) => new Date(e.created_at).getTime() >= since),
    visits = new Set(
      ev.filter((e) => e.name === "visit").map((e) => e.session_id),
    ).size;
  const sales = new Map<string, { name: string; n: number; value: number }>(),
    components = new Map<string, { name: string; n: number }>();
  completed.forEach((o) =>
    o.current.lines.forEach((l) => {
      const current = sales.get(l.productId) || {
        name: l.name,
        n: 0,
        value: 0,
      };
      current.n += l.quantity;
      current.value += l.total;
      sales.set(l.productId, current);
      l.components.forEach((c) => {
        const item = components.get(`${c.productId}:${c.variantId}`) || {
          name: c.name,
          n: 0,
        };
        item.n += c.quantity * l.quantity;
        components.set(`${c.productId}:${c.variantId}`, item);
      });
    }),
  );
  const ranking = [...sales.values()].sort((a, b) => b.n - a.n),
    max = Math.max(1, ...ranking.map((x) => x.n));
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000),
      day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
      }).format(d),
      value = completed
        .filter(
          (o) =>
            new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Sao_Paulo",
            }).format(new Date(o.completed_at || o.updated_at)) === day,
        )
        .reduce((n, o) => n + o.current.total + o.adjustment, 0);
    return {
      label: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        timeZone: "America/Sao_Paulo",
      })
        .format(d)
        .replace(".", ""),
      value,
    };
  });
  const barMax = Math.max(1, ...bars.map((x) => x.value));
  return (
    <>
      <div className="dashboard-toolbar">
        <span>
          <span className="status-dot" />
          Atualização manual de vendas
        </span>
        <div>
          <select
            aria-label="Período do dashboard"
            value={days}
            onChange={(e) => setDays(+e.target.value)}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
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
          value={money(revenue)}
          hint={
            oldRevenue
              ? `${((revenue / oldRevenue - 1) * 100).toFixed(0)}% em relação ao período anterior`
              : "Pedidos marcados como concluídos"
          }
          icon={<BarChart3 />}
        />
        <Stat
          label="Pedidos concluídos"
          value={String(completed.length)}
          hint={`${requested.length} solicitações iniciadas no site`}
          icon={<ShoppingBag />}
        />
        <Stat
          label="Ticket médio"
          value={money(
            completed.length ? Math.round(revenue / completed.length) : 0,
          )}
          hint="Com ajustes registrados no painel"
          icon={<Package />}
        />
        <Stat
          label="Acessos aproximados"
          value={String(visits)}
          hint={`${ev.filter((e) => e.name === "whatsapp_click").length} cliques no WhatsApp`}
          icon={<Eye />}
        />
      </div>
      <div className="dashboard-columns">
        <section className="admin-card">
          <div className="card-heading">
            <div>
              <h2>Uma semana de sabores</h2>
              <p>Valores concluídos · últimos 7 dias</p>
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
              <div className="ranking" key={p.name}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{p.name}</strong>
                  <div className="rank-track">
                    <div style={{ width: `${(p.n / max) * 100}%` }} />
                  </div>
                </div>
                <b>{p.n}</b>
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
      {components.size > 0 && (
        <section className="admin-card">
          <h2>Componentes dos combos</h2>
          <p className="muted">
            Para planejar a produção. Estas unidades não somam receita
            novamente.
          </p>
          <div className="component-chips">
            {[...components.values()].map((x) => (
              <span key={x.name}>
                {x.name}
                <b>{x.n} un.</b>
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
                      <Status status={o.status} />
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
