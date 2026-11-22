import { createClient } from "npm:@supabase/supabase-js@2";
import {
  assert,
  quoteCart,
  safeImage,
  validateCatalog,
  validateOrderEdit,
  validPhone,
  type Catalog,
  type CartLine,
  type Order,
  type Quote,
} from "../_shared/domain.ts";

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Configuração ausente: ${name}`);
  return value;
};
const url = env("SUPABASE_URL"),
  service = createClient(url, env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  origin = env("ALLOWED_ORIGIN");
const uuid = (value: unknown) =>
  typeof value === "string" &&
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
const headers = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });
async function getCatalog(id = "published"): Promise<Catalog> {
  const { data, error } = await service
    .from("catalog_state")
    .select("data")
    .eq("id", id)
    .single();
  assert(!error && data, "Cardápio ainda não publicado.");
  validateCatalog(data.data);
  return data.data;
}
async function admin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  assert(auth.startsWith("Bearer "), "Entre no painel para continuar.");
  const {
    data: { user },
    error,
  } = await service.auth.getUser(auth.slice(7));
  assert(!error && user, "Sua sessão expirou. Entre novamente.");
  const { data } = await service
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  assert(data, "Esta conta não está autorizada.");
  return user.id;
}
function reference() {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
  return `FJ-${day}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}
const notes = (value: unknown) => {
  assert(
    typeof value === "string" && value.length <= 500,
    "Observações inválidas.",
  );
  return value.trim();
};
function publicOrder(
  o: Order & { payload_hash?: string; idempotency_key?: string },
) {
  const { payload_hash: _, idempotency_key: __, ...rest } = o;
  return rest;
}
async function write(
  document: object,
  actor: string | null,
  expected?: string,
) {
  const { data, error } = await service.rpc("write_order", {
    document,
    actor,
    expected_updated: expected || null,
  });
  assert(
    !error && data,
    error?.message || "Não foi possível registrar o pedido.",
  );
  return publicOrder(data);
}

Deno.serve(async (req) => {
  if (req.headers.get("origin") !== origin)
    return json({ error: "Origem não autorizada." }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return json({ error: "Método não permitido." }, 405);
  try {
    // Stream-limit the body even when a caller omits or falsifies Content-Length.
    const reader = req.body?.getReader();
    assert(reader, "Requisição vazia.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      assert(size <= 2_000_000, "Requisição muito grande.");
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    assert(body && typeof body === "object", "Requisição inválida.");
    const action = body.action;
    if (action === "event" || action === "checkout") {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const bucket = await hash(`${env("RATE_LIMIT_SALT")}:${ip}:${action}`);
      const { data, error } = await service.rpc("consume_rate", {
        bucket,
        maximum: action === "event" ? 90 : 15,
      });
      assert(
        !error && data,
        "Muitas tentativas. Aguarde um minuto e tente novamente.",
      );
    }
    if (action === "event") {
      const e = body.event;
      assert(
        e &&
          [
            "visit",
            "product_view",
            "add_to_cart",
            "whatsapp_click",
            "instagram_click",
            "request_created",
          ].includes(e.name) &&
          uuid(e.session_id),
        "Evento inválido.",
      );
      assert(
        e.product_id === undefined ||
          (typeof e.product_id === "string" && e.product_id.length <= 80),
        "Produto inválido.",
      );
      const { error } = await service
        .from("events")
        .insert({
          name: e.name,
          session_id: e.session_id,
          product_id: e.product_id || null,
        });
      assert(!error, "Não foi possível registrar o evento.");
      return json({ ok: true });
    }
    if (action === "checkout") {
      assert(
        uuid(body.idempotencyKey),
        "Identificador de finalização inválido.",
      );
      const cleanNotes = notes(body.notes);
      assert(
        typeof body.token === "string" && body.token.length > 0,
        "Conclua a verificação de segurança.",
      );
      const verification = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: env("TURNSTILE_SECRET_KEY"),
            response: body.token,
          }),
        },
      );
      const verdict = await verification.json();
      assert(
        verdict.success && verdict.hostname === new URL(origin).hostname,
        "A verificação expirou. Atualize a página e tente novamente.",
      );
      const payloadHash = await hash(
        JSON.stringify({
          cart: body.cart,
          notes: cleanNotes,
          signature: body.expectedSignature,
        }),
      );
      const reviewedCatalog = typeof body.expectedWhatsApp === "string" ? await getCatalog() : null;
      if (reviewedCatalog) {
        assert(
          reviewedCatalog.whatsapp === body.expectedWhatsApp,
          "O contato do WhatsApp mudou. Revise a sacola.",
        );
      }
      const { data: existing } = await service
        .from("orders")
        .select("*")
        .eq("idempotency_key", body.idempotencyKey)
        .maybeSingle();
      if (existing) {
        assert(
          existing.payload_hash === payloadHash,
          "Referência já utilizada com outro pedido.",
        );
        return json(publicOrder(existing));
      }
      const c = reviewedCatalog ?? await getCatalog();
      assert(validPhone(c.whatsapp), "WhatsApp da loja ainda não configurado.");
      const q = quoteCart(c, body.cart);
      assert(
        q.signature === body.expectedSignature,
        "O cardápio mudou. Reabra a sacola para revisar itens e preços.",
      );
      return json(
        await write(
          {
            reference: reference(),
            status: "requested",
            source: "site",
            notes: cleanNotes,
            original: q,
            current: q,
            adjustment: 0,
            adjustment_reason: "",
            idempotency_key: body.idempotencyKey,
            payload_hash: payloadHash,
          },
          null,
        ),
      );
    }
    const actor = await admin(req);
    if (action === "save-draft") {
      assert(
        body.catalog &&
          typeof body.catalog === "object" &&
          Array.isArray(body.catalog.products) &&
          body.catalog.products.length <= 500,
        "Rascunho inválido.",
      );
      const { error } = await service
        .from("catalog_state")
        .upsert({
          id: "draft",
          data: body.catalog,
          updated_at: new Date().toISOString(),
        });
      assert(!error, "Não foi possível salvar o rascunho.");
      return json({ ok: true });
    }
    if (action === "publish" || action === "rollback") {
      const c =
        action === "rollback" ? await getCatalog("previous") : body.catalog;
      validateCatalog(c);
      assert(validPhone(c.whatsapp), "Configure o WhatsApp antes de publicar.");
      assert(
        !c.instagram || /^[a-z\d._]{1,30}$/i.test(c.instagram),
        "Usuário de Instagram inválido.",
      );
      assert(
        c.products.every(
          (p: any) => !p.image.startsWith("data:") && safeImage(p.image),
        ),
        "Envie as fotos pelo painel antes de publicar.",
      );
      const published = { ...c, version: crypto.randomUUID() };
      const { error } = await service.rpc("publish_catalog", {
        document: published,
      });
      assert(!error, "Não foi possível publicar o cardápio.");
      return json(published);
    }
    if (action === "save-order") {
      const e = body.edit;
      assert(e && typeof e === "object", "Pedido inválido.");
      validateOrderEdit(e.status, e.source, e.adjustment, e.adjustment_reason);
      const cleanNotes = notes(e.notes);
      let old: Order | null = null;
      if (e.id) {
        assert(
          uuid(e.id) && typeof e.expectedUpdatedAt === "string",
          "Referência inválida.",
        );
        const { data } = await service
          .from("orders")
          .select("*")
          .eq("id", e.id)
          .single();
        assert(data, "Pedido não encontrado.");
        old = data;
      }
      const q: Quote | undefined = e.cart
        ? quoteCart(await getCatalog(), e.cart)
        : old?.current;
      assert(q, "Adicione os produtos do pedido.");
      assert(q.total + e.adjustment >= 0, "O total não pode ser negativo.");
      const document = {
        ...(old ? { id: old.id } : { reference: reference(), original: q }),
        status: e.status,
        source: old?.source || e.source,
        notes: cleanNotes,
        current: q,
        adjustment: e.adjustment,
        adjustment_reason: e.adjustment_reason,
      };
      return json(await write(document, actor, e.expectedUpdatedAt));
    }
    if (action === "delete-order") {
      assert(uuid(body.id), "Pedido inválido.");
      const { error } = await service.from("orders").delete().eq("id", body.id);
      assert(!error, "Não foi possível excluir o pedido.");
      return json({ ok: true });
    }
    return json({ error: "Operação desconhecida." }, 400);
  } catch (e) {
    console.error(
      "API operation failed:",
      e instanceof Error ? e.name : "UnknownError",
    );
    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Não foi possível concluir a operação.",
      },
      400,
    );
  }
});
