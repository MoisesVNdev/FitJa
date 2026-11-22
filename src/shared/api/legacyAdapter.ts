import type { EventRow, OrderEdit } from "../../../shared/contracts/admin";
import { OperationError, type RestoreAppearance, type UpdateAvailability } from "../../../shared/contracts/operations";
export type { EventRow, OrderEdit } from "../../../shared/contracts/admin";
import { createClient } from "@supabase/supabase-js";
import { initialCatalog } from "../../data";
import {
  assert,
  orderReference,
  quoteCart,
  validPhone,
  validateCatalog,
  validateOrderEdit,
  type Catalog,
  type CartLine,
  type Order,
  type Quote,
} from "../../../shared/domain";
import { historyEntry } from "../../../shared/domain/orders";

const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key && location.pathname !== "/admin/preview"
  ? createClient(url, key)
  : null;
export const backendConfigured = !!supabase;
export const demo =
  !supabase && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`fitja:${key}`);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`fitja:${key}`, JSON.stringify(value));
    } catch {
      throw new Error(
        "Não foi possível salvar neste navegador. Verifique o armazenamento disponível.",
      );
    }
  },
};
export { storage };
const checked = (c: unknown): Catalog => {
  validateCatalog(c);
  return c;
};
type LocalOrder = Order & { manualFingerprint?: string };
const localOrders = () => storage.get<LocalOrder[]>("orders", []);
function orderHistory(order: Order) {
  if (order.history) return order.history;
  const records = storage.get<{ order_id: string; before: Order | null; after: Order }[]>("history", [])
    .filter((entry) => entry.order_id === order.id).reverse();
  if (!records.length) return [historyEntry(order)];
  return [...(records[0].before ? [historyEntry(records[0].before)] : []),
    ...records.map((entry) => historyEntry(entry.after))];
}
let localWrite = Promise.resolve();
function writeLocal<T>(write: () => T | Promise<T>) {
  if (typeof window !== "undefined" && window.navigator.locks) {
    return window.navigator.locks.request("fitja:write", write);
  }
  const pending = localWrite.then(write);
  localWrite = pending.then(() => {}, () => {});
  return pending;
}

function publishedCatalog() {
  return checked(storage.get("published", initialCatalog));
}

function savePublished(catalog: Catalog) {
  const saved = { ...catalog, version: crypto.randomUUID() };
  validateCatalog(saved);
  storage.set("published", saved);
  return saved;
}

function previousPublication() {
  const previous = storage.get<Catalog | null>("previous", null);
  if (!previous) throw new OperationError("NOT_FOUND", "Ainda não há uma publicação anterior.");
  return previous;
}

function requireDemo() {
  if (!demo) throw new OperationError("UNSUPPORTED", "Esta operação depende da integração do novo servidor.");
}

function checkVersion(catalog: Catalog, expectedVersion: string) {
  if (catalog.version !== expectedVersion) {
    throw new OperationError("CONFLICT", "O cardápio publicado mudou. Atualize a tela e confira novamente.");
  }
}

function localQuote(catalog: Catalog, cart: CartLine[]) {
  try {
    return quoteCart(catalog, cart);
  } catch (error) {
    if (error instanceof OperationError) throw error;
    throw new OperationError("INVALID_INPUT", (error as Error).message);
  }
}

export async function updateAvailability({ expectedVersion, change }: UpdateAvailability) {
  requireDemo();
  return writeLocal(() => {
    const catalog = publishedCatalog();
    checkVersion(catalog, expectedVersion);
    const live = catalog.liveAvailability ?? { products: [], variants: [], buildersPaused: false };
    if (change.kind === "builders") {
      return savePublished({ ...catalog, liveAvailability: { ...live, buildersPaused: change.paused } });
    }
    const product = catalog.products.find((item) => item.id === change.productId && !item.archived);
    if (!product || (change.kind === "variant" && !product.variants.some((v) => v.id === change.variantId))) {
      throw new OperationError("NOT_FOUND", "O produto ou sabor já não está no cardápio publicado.");
    }
    if (change.kind === "product") {
      return savePublished({
        ...catalog, liveAvailability: { ...live, products: [
          ...live.products.filter((item) => item.productId !== change.productId), change,
        ] },
      });
    }
    return savePublished({
      ...catalog, liveAvailability: { ...live, variants: [
        ...live.variants.filter((item) => item.productId !== change.productId || item.variantId !== change.variantId),
        change,
      ] },
    });
  });
}

export async function previewAppearance() {
  requireDemo();
  const current = publishedCatalog();
  const { version, theme } = previousPublication();
  return { expectedVersion: current.version, snapshot: { version, theme }, catalog: { ...current, theme } };
}

export async function restoreAppearance({ expectedVersion, snapshotVersion }: RestoreAppearance) {
  requireDemo();
  return writeLocal(() => {
    const current = publishedCatalog();
    const previous = previousPublication();
    checkVersion(current, expectedVersion);
    checkVersion(previous, snapshotVersion);
    return savePublished({ ...current, theme: previous.theme });
  });
}
async function invoke<T>(action: string, body: object = {}): Promise<T> {
  assert(
    supabase,
    "Configure a conexão com o servidor antes de receber pedidos.",
  );
  const { data, error } = await supabase.functions.invoke("api", {
    body: { action, ...body },
  });
  if (error) {
    let message = error.message;
    try {
      const json = await (error as { context?: Response }).context?.json();
      message = json?.error || message;
    } catch {
      /* preserve original */
    }
    throw new Error(message);
  }
  assert(!data?.error, data?.error || "Falha no servidor.");
  return data as T;
}
export async function loadCatalog() {
  if (demo) return publishedCatalog();
  if (!supabase) return structuredClone(initialCatalog);
  const { data, error } = await supabase
    .from("catalog_state")
    .select("data")
    .eq("id", "published")
    .single();
  if (error)
    throw new Error(
      "O cardápio está temporariamente indisponível. Tente novamente em instantes.",
    );
  return checked(data.data);
}
export async function isAdmin() {
  if (demo) return true;
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}
export async function getDraft(): Promise<Catalog> {
  if (demo) return storage.get("draft", await loadCatalog());
  assert(supabase, "Servidor não configurado.");
  const { data, error } = await supabase
    .from("catalog_state")
    .select("data")
    .eq("id", "draft")
    .maybeSingle();
  if (error) throw error;
  if (data) return data.data;
  const { data: published, error: failed } = await supabase
    .from("catalog_state")
    .select("data")
    .eq("id", "published")
    .maybeSingle();
  if (failed) throw failed;
  return published ? checked(published.data) : structuredClone(initialCatalog);
}
export async function saveDraft(c: Catalog) {
  // Drafts may be incomplete; publication performs full domain validation.
  if (demo) {
    storage.set("draft", c);
    return;
  }
  await invoke("save-draft", { catalog: c });
}
export async function publish(c: Catalog) {
  validateCatalog(c);
  if (demo) {
    return writeLocal(() => {
      const current = publishedCatalog();
      storage.set("previous", current);
      savePublished({ ...c, liveAvailability: current.liveAvailability });
      storage.set("draft", c);
    });
  }
  await invoke("publish", { catalog: c });
}
export async function rollback() {
  if (demo) {
    return writeLocal(() => {
      const previous = previousPublication();
      const current = publishedCatalog();
      const restored = savePublished({ ...previous, liveAvailability: current.liveAvailability });
      storage.set("previous", current);
      storage.set("draft", restored);
      return restored;
    });
  }
  return invoke<Catalog>("rollback");
}
export async function submitOrder(
  cart: CartLine[],
  notes: string,
  idempotencyKey: string,
  expectedSignature: string,
  token: string,
  expectedWhatsApp?: string,
): Promise<Order> {
  if (demo) {
    if (!idempotencyKey || idempotencyKey.length > 80 || typeof notes !== "string" || notes.length > 500) {
      throw new OperationError("INVALID_INPUT", "Confira a seleção e a observação antes de preparar o pedido.");
    }
    return writeLocal(() => {
      const catalog = publishedCatalog();
      if (!validPhone(catalog.whatsapp)) throw new OperationError("INVALID_INPUT", "WhatsApp da loja ainda não configurado.");
      if (expectedWhatsApp !== undefined && catalog.whatsapp !== expectedWhatsApp) {
        throw new OperationError("CATALOG_CHANGED", "O contato do WhatsApp mudou. Revise a sacola.");
      }
      const orders = localOrders();
      const previous = orders.find((o) => o.id === idempotencyKey);
      if (previous) {
        const originalNotes = previous.originalNotes ?? orderHistory(previous)[0].notes;
        if (previous.source !== "site" || previous.original.signature !== expectedSignature || originalNotes !== notes ||
          JSON.stringify(cartFromQuote(previous.original)) !== JSON.stringify(cart.map(({ key, productId, variantId, quantity, selections }) =>
            ({ key, productId, variantId, quantity, selections })))) {
          throw new OperationError("IDEMPOTENCY_CONFLICT", "Esta referência já foi utilizada. Revise o pedido.");
        }
        return { ...previous, current: previous.original, notes: originalNotes, adjustment: 0 };
      }
      const quote = localQuote(catalog, cart);
      if (quote.signature !== expectedSignature) {
        throw new OperationError("CATALOG_CHANGED", "O cardápio mudou. Atualize a revisão antes de continuar.");
      }
      const now = new Date().toISOString();
      const order: Order = {
        id: idempotencyKey, reference: orderReference(), created_at: now, updated_at: now,
        status: "requested", source: "site", original: quote, current: quote,
        notes, originalNotes: notes, adjustment: 0, adjustment_reason: "", completed_at: null,
      };
      order.history = [historyEntry(order)];
      storage.set("orders", [order, ...orders]);
      return order;
    });
  }
  return invoke<Order>("checkout", {
    cart,
    notes,
    idempotencyKey,
    expectedSignature,
    token,
    expectedWhatsApp,
  });
}
export async function listOrders(): Promise<Order[]> {
  if (demo) return localOrders().map((order) => ({ ...order, history: orderHistory(order) }));
  assert(supabase, "Servidor não configurado.");
  // Paginate to avoid the default 1,000-row limit silently skewing the dashboard.
  const rows: Order[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export async function findSiteOrder(reference: string): Promise<Order> {
  requireDemo();
  const order = localOrders().find((item) =>
    item.source === "site" && item.reference.toUpperCase() === reference.trim().toUpperCase());
  if (!order) throw new OperationError("NOT_FOUND", "Referência do site não encontrada. Confira o número.");
  return { ...order, history: orderHistory(order) };
}

export async function saveOrder(edit: OrderEdit): Promise<Order> {
  try {
    validateOrderEdit(edit.status, edit.source, edit.adjustment, edit.adjustment_reason, demo);
  } catch (error) {
    throw new OperationError("INVALID_INPUT", (error as Error).message);
  }
  if (!demo) {
    if (edit.siteReference || edit.paymentMethod || edit.idempotencyKey) requireDemo();
    return invoke("save-order", { edit });
  }
  if (edit.paymentMethod !== undefined && (typeof edit.paymentMethod !== "string" || edit.paymentMethod.length > 80)) {
    throw new OperationError("INVALID_INPUT", "Informe a forma de pagamento em até 80 caracteres.");
  }
  return writeLocal(() => saveLocalOrder(edit));
}

function saveLocalOrder(edit: OrderEdit): Order {
  const orders = localOrders(),
    old = orders.find((o) => o.id === edit.id);
  if ((edit.id && !old) || (edit.siteReference && (!old || old.source !== "site" || old.reference !== edit.siteReference))) {
    throw new OperationError("NOT_FOUND", "Abra a solicitação pela referência do site antes de registrar a venda.");
  }
  if (old && old.updated_at !== edit.expectedUpdatedAt) {
    throw new OperationError("CONFLICT", "Pedido atualizado em outra janela. Recarregue antes de salvar.");
  }
  if (!old && edit.source === "site") {
    throw new OperationError("INVALID_INPUT", "Use a referência da solicitação existente para registrar uma venda do site.");
  }
  const manualFingerprint = edit.idempotencyKey && !old ? JSON.stringify([
    edit.cart, edit.notes, edit.status, edit.source, edit.adjustment, edit.adjustment_reason, edit.paymentMethod?.trim() || "",
  ]) : undefined;
  const prior = !old && edit.idempotencyKey ? orders.find((o) => o.id === edit.idempotencyKey) : undefined;
  if (prior) {
    if (prior.manualFingerprint !== manualFingerprint) {
      throw new OperationError("IDEMPOTENCY_CONFLICT", "Esta venda já foi registrada com outros dados. Confira os pedidos.");
    }
    return prior;
  }
  const q = edit.cart
    ? localQuote(publishedCatalog(), edit.cart)
    : old?.current;
  if (!q) throw new OperationError("INVALID_INPUT", "Adicione os produtos do pedido.");
  if (q.total + edit.adjustment < 0) throw new OperationError("INVALID_INPUT", "O total não pode ser negativo.");
  const now = new Date(Math.max(Date.now(), old ? Date.parse(old.updated_at) + 1 : 0)).toISOString();
  const history = old ? orderHistory(old) : [];
  const order: LocalOrder = {
    id: old?.id || edit.idempotencyKey || crypto.randomUUID(),
    reference: old?.reference || orderReference(),
    created_at: old?.created_at || now,
    updated_at: now,
    status: edit.status,
    source: old?.source ?? edit.source,
    notes: edit.notes,
    original: old?.original || q,
    originalNotes: old?.originalNotes ?? history[0]?.notes ?? edit.notes,
    current: q,
    adjustment: edit.adjustment,
    adjustment_reason: edit.adjustment_reason,
    completed_at: edit.status === "completed" ? old?.completed_at || now : null,
    paymentMethod: edit.paymentMethod === undefined ? old?.paymentMethod : edit.paymentMethod.trim() || undefined,
    manualFingerprint: old?.manualFingerprint ?? manualFingerprint,
  };
  order.history = [...history, historyEntry(order)];
  storage.set("orders", [order, ...orders.filter((o) => o.id !== order.id)]);
  return order;
}
let sessionId = "";
function session() {
  if (!sessionId) {
    try {
      sessionId =
        sessionStorage.getItem("fitja-session") || crypto.randomUUID();
      sessionStorage.setItem("fitja-session", sessionId);
    } catch {
      sessionId = crypto.randomUUID();
    }
  }
  return sessionId;
}
export async function track(name: string, productId?: string) {
  const event = {
    name,
    product_id: productId,
    session_id: session(),
    created_at: new Date().toISOString(),
  };
  try {
    if (demo) {
      const events = storage.get<EventRow[]>("events", []);
      storage.set("events", [...events.slice(-9999), event]);
    } else if (supabase) await invoke("event", { event });
  } catch {
    /* Analytics must never block menu or checkout. */
  }
}
export async function listEvents(): Promise<EventRow[]> {
  if (demo) return storage.get("events", []);
  assert(supabase, "Servidor não configurado.");
  const rows: EventRow[] = [];
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("events")
      .select("name,product_id,session_id,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export function readCart(): CartLine[] {
  const stored = storage.get<{ expires: number; lines: CartLine[] } | null>(
    "cart",
    null,
  );
  if (!stored || stored.expires < Date.now() || !Array.isArray(stored.lines))
    return [];
  return stored.lines.slice(0, 50);
}
export function persistCart(lines: CartLine[]) {
  storage.set("cart", { lines, expires: Date.now() + 7 * 86400000 });
}
export function csv(orders: Order[]) {
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const lines: unknown[][] = [
    [
      "Referência",
      "Criação",
      "Conclusão",
      "Origem",
      "Status",
      "Forma de pagamento",
      "Produtos",
      "Total produtos (R$)",
      "Ajuste (R$)",
      "Total registrado (R$)",
      "Observações",
    ],
  ];
  for (const o of orders)
    lines.push([
      o.reference,
      o.created_at,
      o.completed_at,
      o.source,
      o.status,
      o.paymentMethod,
      o.current.lines
        .map(
          (l) =>
            `${l.quantity}x ${l.name} ${l.variant} ${l.details.join("; ")}`,
        )
        .join(" | "),
      (o.current.total / 100).toFixed(2).replace(".", ","),
      (o.adjustment / 100).toFixed(2).replace(".", ","),
      ((o.current.total + o.adjustment) / 100).toFixed(2).replace(".", ","),
      o.notes,
    ]);
  return "\uFEFF" + lines.map((row) => row.map(cell).join(";")).join("\r\n");
}
export function download(
  name: string,
  value: string,
  type = "text/csv;charset=utf-8",
) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([value], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function cartFromQuote(q: Quote): CartLine[] {
  return q.lines.map(({ key, productId, variantId, quantity, selections }) => ({
    key,
    productId,
    variantId,
    quantity,
    selections,
  }));
}
