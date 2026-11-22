import { useId, useRef, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { available, money, normalize, portionLabel, quoteCart, type Catalog, type CartLine, type Order, type Product, type Quote } from "../../../../shared/domain";
import { cartFromQuote, csv, download, saveOrder } from "../../../shared/api/admin";
import { Modal, Notice } from "../../../shared/ui";
import { ProductDialog } from "../../catalog/products";

import { statusLabels, sourceLabels, date, Empty, Status } from "../ui";
import { useUnsavedChanges } from "../useUnsavedChanges";
export default function Orders({
  catalog: c,
  orders,
  refresh,
  report,
  pendingOnly = false,
}: {
  catalog: Catalog;
  orders: Order[];
  refresh: () => Promise<void>;
  report: (s: string) => void;
  pendingOnly?: boolean;
}) {
  const [status, setStatus] = useState(pendingOnly ? "requested" : "all"),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<Order | null | undefined>(),
    [saving, setSaving] = useState(false);
  const filtered = orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      normalize(
        `${o.reference} ${o.current.lines.map((l) => l.name).join(" ")}`,
      ).includes(normalize(search)),
  ).sort((a, b) => Number(b.status === "requested") - Number(a.status === "requested"));
  return (
    <>
      <div className="section-toolbar">
        <div className="toolbar-inputs">
          <input
            type="search"
            name="order-search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar referência ou produto"
            aria-label="Buscar pedidos"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar status"
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-inputs">
          <button
            className="button secondary"
            onClick={() => download("fitja-pedidos.csv", csv(filtered))}
          >
            <Download size={17} />
            Exportar CSV
          </button>
          <button className="button primary" onClick={() => setEditing(null)}>
            <Plus size={18} />
            Venda manual
          </button>
        </div>
      </div>
      <section className="admin-card table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Data</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="order-reference">
                  <strong>{o.reference}</strong>
                  <small>
                    {portionLabel(o.current.lines.reduce((n, l) => n + l.quantity, 0))}
                  </small>
                </td>
                <td>{date(o.created_at)}</td>
                <td>{sourceLabels[o.source]}</td>
                <td>
                  <Status status={o.status} />
                </td>
                <td>{money(o.current.total + o.adjustment)}</td>
                <td>
                  <button className="button secondary compact" aria-label={`Ver e atualizar ${o.reference}`} onClick={() => setEditing(o)}>
                    Ver e atualizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <Empty
            title="Nenhum pedido encontrado"
            text="Solicitações do site e vendas manuais aparecerão aqui."
          />
        )}
      </section>
      {editing !== undefined && (
        <OrderEditor
          order={editing}
          catalog={c}
          busy={saving}
          onClose={() => setEditing(undefined)}
          onSave={async (edit) => {
            setSaving(true);
            try {
              await saveOrder(edit);
              await refresh();
              setEditing(undefined);
            } catch (e) {
              report((e as Error).message);
              throw e;
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </>
  );
}
function OrderEditor({
  order: o,
  catalog: c,
  busy,
  onClose,
  onSave,
}: {
  order: Order | null;
  catalog: Catalog;
  busy: boolean;
  onClose: () => void;
  onSave: (e: Parameters<typeof saveOrder>[0]) => Promise<void>;
}) {
  const [cart, setCart] = useState<CartLine[]>(
      o ? cartFromQuote(o.current) : [],
    ),
    [changed, setChanged] = useState(false),
    [status, setStatus] = useState<Order["status"]>(o?.status || "completed"),
    [source, setSource] = useState<Order["source"]>(o?.source || "counter"),
    [notes, setNotes] = useState(o?.notes || ""),
    [adjustment, setAdjustment] = useState(String((o?.adjustment || 0) / 100)),
    [reason, setReason] = useState(o?.adjustment_reason || ""),
    [selected, setSelected] = useState<Product | null>(null),
    [line, setLine] = useState<CartLine | undefined>(),
    [error, setError] = useState(""),
    [triedSave, setTriedSave] = useState(false);
  const adjustmentField = useRef<HTMLInputElement>(null);
  const reasonField = useRef<HTMLInputElement>(null);
  const adjustmentError = useId();
  const reasonError = useId();
  const dirty = changed || status !== (o?.status || "completed") || source !== (o?.source || "counter") ||
    notes !== (o?.notes || "") || reason !== (o?.adjustment_reason || "") ||
    adjustment !== String((o?.adjustment || 0) / 100);
  useUnsavedChanges(dirty);
  let q: Quote | null = o && !changed ? o.current : null,
    problem = "";
  if (changed || !o)
    try {
      if (cart.length) q = quoteCart(c, cart);
    } catch (e) {
      problem = (e as Error).message;
    }
  const amount = Math.round(Number(adjustment.replace(",", ".")) * 100);
  const invalidAdjustment = !Number.isSafeInteger(amount);
  const missingReason = !invalidAdjustment && amount !== 0 && !reason.trim();
  return (
    <Modal
      title={o ? o.reference : "Registrar venda manual"}
      wide
      onClose={() => {
        if (!busy && (!dirty || window.confirm("Descartar as alterações ainda não salvas do pedido?"))) onClose();
      }}
    >
      <div className="dialog-scroll">
        <div className="detail-content">
          <div className="form-grid">
            <label className="field">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Order["status"])}
              >
                {Object.entries(statusLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Origem
              <select
                value={source}
                disabled={!!o}
                onChange={(e) => setSource(e.target.value as Order["source"])}
              >
                {o?.source === "site" && <option value="site">Site</option>}
                <option value="counter">Balcão</option>
                <option value="whatsapp">WhatsApp direto</option>
              </select>
            </label>
          </div>
          {cart.map((l) => {
            const item = q?.lines.find((x) => x.key === l.key),
              p = c.products.find((x) => x.id === l.productId);
            return (
              <div className="order-editor-line" key={l.key}>
                <div>
                  <strong>
                    {l.quantity}× {item?.name || p?.name || "Produto removido"}
                  </strong>
                  <p>
                    {item?.variant ||
                      p?.variants.find((v) => v.id === l.variantId)?.name}
                  </p>
                  {item?.details.map((d, i) => (
                    <small key={i}>{d}</small>
                  ))}
                </div>
                <strong>{item ? money(item.total) : "Revisar"}</strong>
                <button
                  className="text-button"
                  disabled={!p}
                  onClick={() => {
                    setSelected(p!);
                    setLine(l);
                  }}
                >
                  Editar
                </button>
                <button
                  className="icon-button danger"
                  aria-label="Remover item"
                  onClick={() => {
                    setCart(cart.filter((x) => x.key !== l.key));
                    setChanged(true);
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
          <label className="field">
            Adicionar produto
            <select
              value=""
              onChange={(e) => {
                setSelected(
                  c.products.find((p) => p.id === e.target.value) || null,
                );
                setLine(undefined);
              }}
            >
              <option value="">Selecione um produto ou combo…</option>
              {c.products
                .filter((p) => available(c, p))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="form-grid">
            <label className="field">
              Ajuste negociado (R$)
              <input
                ref={adjustmentField}
                value={adjustment}
                inputMode="decimal"
                aria-invalid={triedSave && invalidAdjustment || undefined}
                aria-describedby={triedSave && invalidAdjustment ? adjustmentError : undefined}
                onChange={(e) => setAdjustment(e.target.value)}
              />
              {triedSave && invalidAdjustment && <small className="field-error" id={adjustmentError}>Informe um valor válido.</small>}
              <small>
                Use valor negativo para desconto. Frete fica fora das vendas de
                produtos.
              </small>
            </label>
            <label className="field">
              Motivo do ajuste
              <input
                ref={reasonField}
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: desconto combinado"
                aria-invalid={triedSave && missingReason || undefined}
                aria-describedby={triedSave && missingReason ? reasonError : undefined}
              />
              {triedSave && missingReason && <small className="field-error" id={reasonError}>Informe o motivo do ajuste.</small>}
            </label>
          </div>
          <label className="field">
            Observações
            <textarea
              value={notes}
              maxLength={500}
              rows={3}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="cart-total">
            <span>Total registrado</span>
            <strong>
              {q && Number.isFinite(amount)
                ? money(q.total + amount)
                : "A revisar"}
            </strong>
          </div>
          {o && (
            <details className="nutrition">
              <summary>Resumo original preservado</summary>
              <pre className="message-preview">
                {o.original.lines
                  .map(
                    (l) =>
                      `${l.quantity}× ${l.name} · ${l.variant}\n${l.details.join("\n")}\n${money(l.total)}`,
                  )
                  .join("\n\n")}
                <br />
                Total original: {money(o.original.total)}
              </pre>
              <p className="small muted">
                Atualizado em {date(o.updated_at)}. Alterações são registradas
                no histórico de auditoria.
              </p>
            </details>
          )}
          {problem && <Notice error>{problem}</Notice>}
          {error && <Notice error>{error}</Notice>}
        </div>
      </div>
      <div className="modal-footer">
        <button
          className="button primary full"
          disabled={busy || !q || !cart.length}
          onClick={() => {
            setError("");
            setTriedSave(true);
            if (invalidAdjustment || missingReason) {
              (invalidAdjustment ? adjustmentField : reasonField).current?.focus();
              return;
            }
            void onSave({
              id: o?.id,
              expectedUpdatedAt: o?.updated_at,
              cart: changed || !o ? cart : undefined,
              notes,
              status,
              source,
              adjustment: amount,
              adjustment_reason: reason,
            }).catch((e) => setError(e.message));
          }}
        >
          {busy ? "Salvando…" : "Salvar pedido"}
        </button>
      </div>
      {selected && (
        <ProductDialog
          product={selected}
          catalog={c}
          economy
          initial={line}
          onClose={() => setSelected(null)}
          onAdd={(l) => {
            setCart((old) =>
              old.some((x) => x.key === l.key)
                ? old.map((x) => (x.key === l.key ? l : x))
                : [...old, l],
            );
            setChanged(true);
            setSelected(null);
          }}
        />
      )}
    </Modal>
  );
}
