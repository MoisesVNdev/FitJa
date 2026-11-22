import { useState } from "react";
import { CheckCheck, Copy, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { money, orderMessage, whatsappUrl, type CartLine, type Catalog } from "../../../shared/domain";
import { demo, backendConfigured, track } from "../../shared/api/checkout";
import { Modal, Notice, Quantity } from "../../shared/ui";
import { FoodImage } from "../catalog/products";

import { Turnstile, useCheckout } from "../checkout";
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
  const { notes, setNotes, fulfillment, setFulfillment, busy, error, setError, order, token,
    setToken, reviewed, quote, cartError, finish } = useCheckout(c, cart, preview, onReload);
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
    >
      <div className="dialog-scroll">
        <div className="detail-content">
          {order ? (
            <>
              <div className="order-ready">
                <span>
                  <CheckCheck size={32} />
                </span>
                <h3>Só falta enviar no WhatsApp.</h3>
                <p>
                  Sua solicitação <strong>{order.reference}</strong> foi
                  registrada. A loja confirma o pedido na conversa.
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
              <ShoppingBag size={42} />
              <h3>Sua sacola está esperando.</h3>
              <p>Encontre algo gostoso no cardápio.</p>
              <button className="button primary" onClick={onClose}>
                Explorar sabores
              </button>
            </div>
          ) : (
            <>
              {cart.map((line) => {
                const p = c.products.find((p) => p.id === line.productId),
                  q = quote?.lines.find((q) => q.key === line.key);
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
                        {p?.variants.find((v) => v.id === line.variantId)
                          ?.name || "Opção indisponível"}
                      </p>
                      {q?.details.map((d, i) => (
                        <small key={i}>{d}</small>
                      ))}
                      <button
                        className="text-button"
                        disabled={!p}
                        onClick={() => onEdit(line)}
                      >
                        Editar escolhas
                      </button>
                      <div className="cart-item-bottom">
                        <Quantity
                          value={line.quantity}
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
                          onClick={() =>
                            setCart(cart.filter((l) => l.key !== line.key))
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {cartError && (
                <Notice error>
                  {cartError} Você pode editar ou remover o item.
                </Notice>
              )}
              <fieldset className="fulfillment-options">
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
                  value={notes}
                  maxLength={450}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: prefiro sem talheres"
                  rows={3}
                />
                <small>
                  {notes.length}/450 · Evite incluir dados pessoais ou
                  sensíveis.
                </small>
              </label>
              <div className="cart-total">
                <span>Total dos produtos</span>
                <strong>{quote ? money(quote.total) : "A revisar"}</strong>
              </div>
              <p className="small muted">
                Pagamento, entrega ou retirada e eventual frete serão combinados
                pelo WhatsApp.
              </p>
              <p>Confira sua lista. Ao abrir a conversa, toque em enviar. Laís vai confirmar os itens, o valor final e o prazo com você.</p>
              {reviewed && (
                <Notice>
                  Itens e preços revisados. Agora prepare a mensagem para
                  continuar.
                </Notice>
              )}
              {reviewed && !demo && backendConfigured && (
                <Turnstile onToken={setToken} />
              )}
            </>
          )}
          {error && <Notice error>{error}</Notice>}
        </div>
      </div>
      {cart.length > 0 && (
        <div className="modal-footer">
          {order ? (
            <>
              <a
                className="button whatsapp full"
                href={whatsappUrl(c.whatsapp, order)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void track("whatsapp_click")}
              >
                <MessageCircle size={20} />
                Abrir WhatsApp
              </a>
              <button
                className="button secondary full"
                onClick={() => void copy()}
              >
                <Copy size={17} />
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
                !quote ||
                busy ||
                preview ||
                (!backendConfigured && !demo) ||
                (reviewed && !demo && !token)
              }
              onClick={() => void finish()}
            >
              {busy
                ? "Conferindo…"
                : preview
                  ? "Prévia do cardápio"
                  : reviewed
                    ? "Preparar pedido para WhatsApp"
                    : "Revisar meu pedido"}
              <MessageCircle size={19} />
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

