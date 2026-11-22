import { useEffect, useRef, useState } from "react";
import { quoteCart, type CartLine, type Catalog, type Order } from "../../../shared/domain";
import type { CheckoutApi, Fulfillment } from "../../../shared/contracts/checkout";
import { loadCatalog, submitOrder, track } from "../../shared/api/checkout";
import { storage } from "../../shared/api/catalog";
import { checkoutNotes, createRequest, reviewSelection } from "./service";

const checkoutApi: CheckoutApi = { loadCatalog, submitOrder };

export function useCheckout(c: Catalog, cart: CartLine[], preview: boolean, onReload: (c: Catalog) => void) {
  const [notes, setNotes] = useState(() => storage.get("checkoutNotes", "")),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [order, setOrder] = useState<Order | null>(null),
    [token, setToken] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const [fulfillment, setFulfillment] = useState<Fulfillment>(() =>
    storage.get<Fulfillment>("fulfillment", "pickup") === "delivery" ? "delivery" : "pickup",
  );
  const attempt = useRef(storage.get<{ fingerprint: string; key: string } | null>("checkoutAttempt", null) ?? { fingerprint: "", key: crypto.randomUUID() }),
    previousSignature = useRef("");
  let quote: ReturnType<typeof quoteCart> | null = null,
    cartError = "";
  try {
    if (cart.length) quote = quoteCart(c, cart);
  } catch (e) {
    cartError = (e as Error).message;
  }
  const inFlight = useRef(false);
  const fingerprint = JSON.stringify([cart, checkoutNotes(notes, fulfillment)]);
  useEffect(() => {
    if (!preview) {
      try {
        storage.set("checkoutNotes", notes);
        storage.set("fulfillment", fulfillment);
      } catch (error) {
        setError((error as Error).message);
        return;
      }
    }
    setReviewed(false);
    setOrder(null);
    setError("");
  }, [fingerprint]);
  async function finish() {
    if (!quote || preview || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const { catalog: latest, quote: next } = await reviewSelection(checkoutApi, cart);
      onReload(latest);
      if (next.signature !== quote.signature) {
        setReviewed(false);
        setError(
          "O cardápio foi atualizado. Confira os novos valores e revise novamente.",
        );
        return;
      }
      if (!reviewed || previousSignature.current !== next.signature) {
        previousSignature.current = next.signature;
        setReviewed(true);
        return;
      }
      const requestFingerprint = JSON.stringify([fingerprint, next.signature]);
      if (attempt.current.fingerprint !== requestFingerprint)
        attempt.current = { fingerprint: requestFingerprint, key: crypto.randomUUID() };
      storage.set("checkoutAttempt", attempt.current);
      const result = await createRequest(checkoutApi, {
        cart, notes: checkoutNotes(notes, fulfillment), key: attempt.current.key,
        signature: next.signature, token,
      });
      setOrder(result);
      setToken("");
      void track("request_created");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { notes, setNotes, fulfillment, setFulfillment, busy, error, setError, order, token,
    setToken, reviewed, quote, cartError, finish };
}
