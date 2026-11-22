import type { EventRow, OrderEdit } from "../../../shared/contracts/admin";
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
const localOrders = () => storage.get<Order[]>("orders", []);
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
  if (demo) return checked(storage.get("published", initialCatalog));
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
    storage.set("previous", await loadCatalog());
    storage.set("published", { ...c, version: crypto.randomUUID() });
    storage.set("draft", c);
    return;
  }
  await invoke("publish", { catalog: c });
}
export async function rollback() {
  if (demo) {
    const previous = storage.get<Catalog | null>("previous", null);
    assert(previous, "Ainda não há uma publicação anterior.");
    await publish(previous);
    return previous;
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
    const catalog = await loadCatalog();
    assert(validPhone(catalog.whatsapp), "WhatsApp da loja ainda não configurado.");
    assert(
      expectedWhatsApp === undefined || catalog.whatsapp === expectedWhatsApp,
      "O contato do WhatsApp mudou. Revise a sacola.",
    );
    const quote = quoteCart(catalog, cart);
    assert(
      quote.signature === expectedSignature,
      "O cardápio mudou. Atualize a revisão antes de continuar.",
    );
    const orders = localOrders();
    const previous = orders.find((o) => o.id === idempotencyKey);
    if (previous) {
      assert(
        previous.original.signature === quote.signature &&
          previous.notes === notes,
        "Esta referência já foi utilizada. Revise o pedido.",
      );
      return previous;
    }
    const now = new Date().toISOString();
    const order: Order = {
      id: idempotencyKey,
      reference: orderReference(),
      created_at: now,
      updated_at: now,
      status: "requested",
      source: "site",
      original: quote,
      current: quote,
      notes,
      adjustment: 0,
      adjustment_reason: "",
      completed_at: null,
    };
    storage.set("orders", [order, ...orders]);
    return order;
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
  if (demo) return localOrders();
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
export async function saveOrder(edit: OrderEdit): Promise<Order> {
  validateOrderEdit(
    edit.status,
    edit.source,
    edit.adjustment,
    edit.adjustment_reason,
  );
  if (!demo) return invoke("save-order", { edit });
  const orders = localOrders(),
    old = orders.find((o) => o.id === edit.id);
  assert(!edit.id || old, "Pedido não encontrado.");
  assert(
    !old || old.updated_at === edit.expectedUpdatedAt,
    "Pedido atualizado em outra janela. Recarregue antes de salvar.",
  );
  const q = edit.cart
    ? quoteCart(await loadCatalog(), edit.cart)
    : old?.current;
  assert(q, "Adicione os produtos do pedido.");
  assert(q.total + edit.adjustment >= 0, "O total não pode ser negativo.");
  const now = new Date().toISOString();
  const order: Order = {
    id: old?.id || crypto.randomUUID(),
    reference: old?.reference || orderReference(),
    created_at: old?.created_at || now,
    updated_at: now,
    status: edit.status,
    source: old?.source === "site" ? "site" : edit.source,
    notes: edit.notes,
    original: old?.original || q,
    current: q,
    adjustment: edit.adjustment,
    adjustment_reason: edit.adjustment_reason,
    completed_at: edit.status === "completed" ? old?.completed_at || now : null,
  };
  storage.set("orders", [order, ...orders.filter((o) => o.id !== order.id)]);
  const history = storage.get<object[]>("history", []);
  storage.set("history", [
    { order_id: order.id, before: old || null, after: order, at: now },
    ...history,
  ]);
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
