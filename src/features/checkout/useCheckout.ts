import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { validPhone, type CartLine, type Catalog, type Order } from "../../../shared/domain";
import type { CheckoutApi, Fulfillment } from "../../../shared/contracts/checkout";
import { loadCatalog, submitOrder, track } from "../../shared/api/checkout";
import { storage } from "../../shared/api/catalog";
import { checkoutNotes, createRequest, describeChanges, inspectSelection, isCatalogConflict, reviewSelection } from "./service";

const checkoutApi: CheckoutApi = { loadCatalog, submitOrder };

export function useCheckout(c: Catalog, cart: CartLine[], preview: boolean, onReload: (c: Catalog) => void) {
  const [notes, setNotes] = useState(() => storage.get("checkoutNotes", "")),
    [busy, setBusy] = useState<"review" | "submit" | null>(null),
    [error, setError] = useState(""),
    [prepared, setPrepared] = useState<{ order: Order; whatsapp: string } | null>(null),
    [token, setToken] = useState(""),
    [verificationCycle, setVerificationCycle] = useState(0),
    [review, setReview] = useState<{ revision: number; signature: string; whatsapp: string } | null>(null),
    [changes, setChanges] = useState<Record<string, string>>({});
  const [fulfillment, setFulfillment] = useState<Fulfillment>(() =>
    storage.get<Fulfillment>("fulfillment", "pickup") === "delivery" ? "delivery" : "pickup",
  );
  const revision = useRef(0);
  const inFlight = useRef(false);
  const note = checkoutNotes(notes, fulfillment);
  const fingerprint = JSON.stringify([cart, note]);
  const selection = useMemo(() => inspectSelection(c, cart), [c, cart]);

  useLayoutEffect(() => {
    revision.current += 1;
    return () => { revision.current += 1; };
  }, [fingerprint]);

  useEffect(() => {
    setReview(null);
    setPrepared(null);
    setError("");
  }, [fingerprint]);

  useEffect(() => {
    if (preview) return;
    try {
      storage.set("checkoutNotes", notes);
      storage.set("fulfillment", fulfillment);
    } catch (problem) {
      setError((problem as Error).message);
    }
  }, [notes, fulfillment, preview]);

  const reviewed = review !== null && review.revision === revision.current &&
    review.signature === selection.quote?.signature && review.whatsapp === c.whatsapp;

  async function finish() {
    if (!cart.length || preview || inFlight.current) return;
    const step = reviewed ? "submit" : "review";
    const startedRevision = revision.current;
    const isCurrent = () => revision.current === startedRevision;
    inFlight.current = true;
    setBusy(step);
    setError("");

    async function refresh() {
      const next = await reviewSelection(checkoutApi, cart);
      if (!isCurrent()) return;
      const lineChanges = describeChanges(selection, next);
      const changed = selection.quote?.signature !== next.quote?.signature ||
        Object.keys(lineChanges).length > 0;
      onReload(next.catalog);
      setChanges(lineChanges);
      if (changed) setError("O cardápio mudou. Confira os itens indicados na sacola.");
      if (step === "review" && !changed && next.quote && validPhone(next.catalog.whatsapp)) {
        setReview({ revision: startedRevision, signature: next.quote.signature, whatsapp: next.catalog.whatsapp });
      } else {
        setReview(null);
      }
    }

    try {
      if (step === "review") {
        await refresh();
        return;
      }
      if (!review) return;
      const requestFingerprint = JSON.stringify([fingerprint, review.signature]);
      const saved = storage.get<{ fingerprint: string; key: string } | null>("checkoutAttempt", null);
      const key = saved?.fingerprint === requestFingerprint ? saved.key : crypto.randomUUID();
      storage.set("checkoutAttempt", { fingerprint: requestFingerprint, key });
      const order = await createRequest(checkoutApi, {
        cart, notes: note, key, signature: review.signature, token, whatsapp: review.whatsapp,
      });
      if (!isCurrent()) return;
      setPrepared({ order, whatsapp: review.whatsapp });
      void track("request_created");
    } catch (problem) {
      if (!isCurrent()) return;
      setError((problem as Error).message);
      if (step === "submit" && isCatalogConflict(problem)) {
        setReview(null);
        try { await refresh(); }
        catch (refreshError) {
          if (isCurrent()) setError((refreshError as Error).message);
        }
      }
    } finally {
      inFlight.current = false;
      setBusy(null);
      if (step === "submit" && isCurrent()) {
        setToken("");
        setVerificationCycle((cycle) => cycle + 1);
      }
    }
  }

  return { notes, setNotes, fulfillment, setFulfillment, busy, error, setError, prepared,
    token, setToken, verificationCycle, reviewed, selection, changes, finish };
}
