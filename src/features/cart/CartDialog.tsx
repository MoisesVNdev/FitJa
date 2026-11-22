import { useState } from "react";
import { CheckCheck, Copy, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { money, orderMessage, portionLabel, validPhone, variantLabel, whatsappUrl, type CartLine, type Catalog } from "../../../shared/domain";
import { demo, backendConfigured, track } from "../../shared/api/checkout";
import { Modal, Notice, Quantity } from "../../shared/ui";
import { FoodImage } from "../catalog/products";

import { Turnstile, useCheckout } from "../checkout";
import { missingWhatsApp } from "../checkout/service";
import { storage } from "../../shared/api/catalog";

export function CartDialog({
  catalog: c,
  cart,
  setCart,
  onClose,
  onEdit,
  onReload,
  preview,
}: {
  catalog: Catalog;
  cart: CartLine[];
  setCart: (c: CartLine[]) => void;
  onClose: () => void;
  onEdit: (l: CartLine) => void;
  onReload: (c: Catalog) => void;
  preview: boolean;
}) {
  const { notes, setNotes, fulfillment, setFulfillment, busy, error, setError, prepared,
    token, setToken, verificationCycle, reviewed, selection, changes, finish } =
    useCheckout(c, cart, preview, onReload);
  const order = prepared?.order;
  const submitting = busy === "submit";
  const [copied, setCopied] = useState(false);
  const message = order ? orderMessage(order) : "";
  const longMessage = encodeURIComponent(message).length > 5500;
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setError(
        "Não foi possível copiar automaticamente. Selecione o resumo abaixo e copie.",
      );
    }
  }
  return (
    <Modal
      title={order ? "Seu pedido está preparado" : "Sua sacola"}
      onClose={onClose}
      fitVisualViewport
    >
      <div className="dialog-scroll">
        <div className="detail-content cart-content">
          {order ? (
            <>
              <div className="order-ready">
                <span>
                  <CheckCheck size={32} aria-hidden="true" />
                </span>
                <h3>Abra a conversa e toque em enviar.</h3>
                <p>
                  Sua solicitação <strong>{order.reference}</strong> foi
                  registrada. A Laís confirma os itens, o valor e o prazo na conversa.
                </p>
              </div>
              {longMessage && <Notice>A lista é longa. Copie o pedido completo e cole na conversa do WhatsApp.</Notice>}
              <pre className="message-preview" tabIndex={0}>{message}</pre>
              <p className="small muted">
                Abrir a conversa não envia a mensagem automaticamente.
              </p>
            </>
          ) : !cart.length ? (
            <div className="empty">
              <ShoppingBag size={42} aria-hidden="true" />
              <h3>Sua sacola está esperando.</h3>
              <p>Encontre algo gostoso no cardápio.</p>
              <button className="button primary" onClick={onClose}>
                Explorar sabores
              </button>
            </div>
          ) : (
            <>
              {!preview && !validPhone(c.whatsapp) && <Notice error>{missingWhatsApp}</Notice>}
              {cart.map((line, index) => {
                const p = c.products.find((product) => product.id === line.productId);
                const item = selection.lines[index];
                const q = item.quote;
                const variant = p?.variants.find((option) => option.id === line.variantId);
                const details = q?.details ?? line.selections.map((choice) => {
                  const option = p?.groups.find((group) => group.id === choice.groupId)
                    ?.options.find((candidate) => candidate.id === choice.optionId);
                  return `${choice.quantity}× ${option?.name ?? "Escolha antiga indisponível"}`;
                });
                return (
                  <article className="cart-item" key={line.key}>
                    <div className="cart-thumbnail">
                      <FoodImage
                        image={p?.image || ""}
                        name={p?.name || "Produto removido"}
                        economy
                      />
                    </div>
                    <div className="cart-item-main">
                      <strong>{p?.name || "Produto removido"}</strong>
                      <p>
                        {portionLabel(line.quantity)} · {p && variant ? variantLabel(p, variant) : "Opção indisponível"}
                      </p>
                      {details.map((d, i) => (
                        <small key={i}>{d}</small>
                      ))}
                      {item.problem && <Notice error>{item.problem} Edite ou remova este item.</Notice>}
                      {changes[line.key] && !item.problem && <Notice>{changes[line.key]}</Notice>}
                      <button
                        className="text-button"
                        disabled={!p || submitting}
                        onClick={() => onEdit(line)}
                      >
                        Editar escolhas
                      </button>
                      <div className="cart-item-bottom">
                        <Quantity
                          value={line.quantity}
                          label={`porções de ${p?.name ?? "produto"}`}
                          disabled={submitting}
                          set={(v) =>
                            setCart(
                              cart.map((l) =>
                                l.key === line.key ? { ...l, quantity: v } : l,
                              ),
                            )
                          }
                        />
                        <strong>{q ? money(q.total) : "Revisar"}</strong>
                        <button
                          className="icon-button danger"
                          aria-label={`Remover ${p?.name || "produto"}`}
                          disabled={submitting}
                          onClick={() =>
                            setCart(cart.filter((l) => l.key !== line.key))
                          }
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {selection.problem && <Notice error>{selection.problem}</Notice>}
              <fieldset className="fulfillment-options" disabled={submitting}>
                <legend>Como prefere receber?</legend>
                {([['delivery', 'Entrega'], ['pickup', 'Retirada']] as const).map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="fulfillment" value={value}
                      checked={fulfillment === value} onChange={() => setFulfillment(value)} />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label className="field">
                Alguma observação?
                <textarea
                  name="notes"
                  disabled={submitting}
                  value={notes}
                  maxLength={450}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: prefiro sem talheres…"
                  rows={3}
                />
                <small>
                  {notes.length}/450 · Evite incluir dados pessoais ou
                  sensíveis.
                </small>
              </label>
              <div className="cart-total">
                <span>Total dos produtos</span>
                <strong aria-live="polite">{selection.quote ? money(selection.quote.total) : "A revisar"}</strong>
              </div>
              <p className="small muted">
                A Laís confirma itens, valor, pagamento e prazo pelo WhatsApp.
              </p>
              {reviewed && (
                <Notice>
                  Itens e preços revisados. Agora prepare a mensagem para
                  continuar.
                </Notice>
              )}
              {reviewed && !demo && backendConfigured && (
                <Turnstile key={verificationCycle} onToken={setToken} />
              )}
            </>
          )}
          {!cart.length && error && <Notice error>{error}</Notice>}
        </div>
      </div>
      {cart.length > 0 && (
        <div className="modal-footer">
          {error && <Notice error>{error}</Notice>}
          {prepared ? (
            <>
              <a
                className="button primary whatsapp full"
                href={whatsappUrl(prepared.whatsapp, prepared.order)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void track("whatsapp_click")}
              >
                <MessageCircle size={20} aria-hidden="true" />
                Abrir WhatsApp
              </a>
              <button
                className="button secondary full"
                onClick={() => void copy()}
              >
                <Copy size={17} aria-hidden="true" />
                {copied ? "Pedido copiado" : "Copiar pedido completo"}
              </button>
              <button
                className="text-button full"
                onClick={() => {
                  storage.set("checkoutAttempt", null);
                  storage.set("checkoutNotes", "");
                  setCart([]);
                  onClose();
                }}
              >
                Começar uma nova sacola
              </button>
            </>
          ) : (
            <button
              className="button primary full"
              disabled={
                !!busy ||
                preview ||
                (!backendConfigured && !demo) ||
                (reviewed && !demo && !token)
              }
              onClick={() => void finish()}
            >
              {busy
                ? submitting ? "Preparando…" : "Conferindo…"
                : preview
                  ? "Prévia do cardápio"
                  : reviewed
                    ? "Preparar pedido para WhatsApp"
                    : selection.quote ? "Revisar itens e preços" : "Atualizar cardápio"}
              <MessageCircle size={19} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
