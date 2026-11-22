import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { initialCatalog } from "../src/data";
import { quoteCart } from "../shared/domain";
const db = new PGlite();
const owner = "11111111-1111-4111-a111-111111111111",
  other = "22222222-2222-4222-a222-222222222222";
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to public;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role; grant select,insert,delete on storage.objects to anon,authenticated,service_role;`);
  const migration = readFileSync(
    new URL("../supabase/migrations/202611200001_initial.sql", import.meta.url),
    "utf8",
  ).replace("create extension if not exists pgcrypto;", "");
  await db.exec(migration);
  await db.query("insert into auth.users(id) values($1),($2)", [owner, other]);
  await db.query("insert into public.admins(user_id) values($1)", [owner]);
}, 30000);
afterAll(async () => {
  await db.close();
});
async function asRole<T>(
  role: string,
  user: string,
  operation: () => Promise<T>,
) {
  await db.exec(`set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  try {
    return await operation();
  } finally {
    await db.exec("reset role");
    await db.exec("select set_config('request.jwt.claim.sub','',false)");
  }
}
const document = (key = "33333333-3333-4333-a333-333333333333") => {
  const quote = quoteCart(initialCatalog, [
    {
      key: "one",
      productId: "tapioca",
      variantId: "v0",
      quantity: 2,
      selections: [],
    },
  ]);
  return {
    reference: `FJ-TEST-${key.slice(0, 8)}`,
    status: "requested",
    source: "site",
    notes: "Pedido de teste",
    original: quote,
    current: quote,
    adjustment: 0,
    adjustment_reason: "",
    idempotency_key: key,
    payload_hash: "same-payload",
  };
};
describe("banco PostgreSQL e políticas de acesso", () => {
  it("publica e restaura catálogo preservando a versão anterior", async () => {
    await asRole("service_role", "", async () => {
      await db.query("select public.publish_catalog($1::jsonb)", [
        JSON.stringify(initialCatalog),
      ]);
      await db.query("select public.publish_catalog($1::jsonb)", [
        JSON.stringify({ ...initialCatalog, name: "Segunda versão" }),
      ]);
    });
    const { rows } = await db.query<{ id: string; data: { name: string } }>(
      "select id,data from public.catalog_state",
    );
    expect(rows.find((r) => r.id === "previous")?.data.name).toBe(
      "Laís Fit Já",
    );
    expect(rows.find((r) => r.id === "published")?.data.name).toBe(
      "Segunda versão",
    );
  });
  it("visitante lê somente catálogo publicado", async () => {
    await asRole("anon", "", async () => {
      const { rows } = await db.query("select id from public.catalog_state");
      expect(rows).toEqual([{ id: "published" }]);
      await expect(db.query("select * from public.orders")).rejects.toThrow();
      await expect(
        db.query("select public.publish_catalog($1::jsonb)", [
          JSON.stringify(initialCatalog),
        ]),
      ).rejects.toThrow();
    });
  });
  it("usuário autenticado sem autorização não lê dados internos", async () => {
    await asRole("authenticated", other, async () => {
      expect((await db.query("select * from public.orders")).rows).toEqual([]);
      expect((await db.query("select * from public.admins")).rows).toEqual([]);
      expect(
        (await db.query("select * from public.order_history")).rows,
      ).toEqual([]);
      expect(
        (await db.query("select id from public.catalog_state")).rows,
      ).toEqual([{ id: "published" }]);
      await expect(
        db.query("select public.write_order($1::jsonb,$2::uuid,null)", [
          JSON.stringify(document()),
          other,
        ]),
      ).rejects.toThrow();
    });
  });
  it("registra o pedido e torna a finalização idempotente", async () => {
    await asRole("service_role", "", async () => {
      const first = await db.query<{ result: { id: string } }>(
        "select public.write_order($1::jsonb,null,null) as result",
        [JSON.stringify(document())],
      );
      const second = await db.query<{ result: { id: string } }>(
        "select public.write_order($1::jsonb,null,null) as result",
        [JSON.stringify(document())],
      );
      expect(second.rows[0].result.id).toBe(first.rows[0].result.id);
      await expect(
        db.query("select public.write_order($1::jsonb,null,null)", [
          JSON.stringify({ ...document(), payload_hash: "different" }),
        ]),
      ).rejects.toThrow(/outro pedido/);
    });
    expect((await db.query("select * from public.orders")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("select * from public.order_history")).rows,
    ).toHaveLength(1);
  });
  it("proprietária lê pedidos mas não consegue inserir diretamente", async () => {
    await asRole("authenticated", owner, async () => {
      expect(
        (await db.query("select id from public.orders")).rows,
      ).toHaveLength(1);
      expect(
        (await db.query("select id from public.catalog_state")).rows,
      ).toHaveLength(3);
      await expect(
        db.query(
          "insert into public.orders(reference,status,source,original,current) values('FAKE','requested','site','{}','{}')",
        ),
      ).rejects.toThrow();
    });
  });
  it("conclui o pedido, preserva original e audita o responsável", async () => {
    const {
      rows: [old],
    } = await db.query<{ id: string; updated_at: string; original: unknown }>(
      "select id,updated_at,original from public.orders",
    );
    const newQuote = quoteCart(initialCatalog, [
      {
        key: "one",
        productId: "tapioca",
        variantId: "v0",
        quantity: 3,
        selections: [],
      },
    ]);
    await asRole("service_role", "", async () => {
      await db.query(
        "select public.write_order($1::jsonb,$2::uuid,$3::timestamptz)",
        [
          JSON.stringify({
            id: old.id,
            current: newQuote,
            status: "completed",
            notes: "Ajustado",
            adjustment: -100,
            adjustment_reason: "Desconto",
            source: "counter",
            original: { tampered: true },
          }),
          owner,
          old.updated_at,
        ],
      );
    });
    const {
      rows: [updated],
    } = await db.query<{
      original: unknown;
      current: { total: number };
      source: string;
      completed_at: string;
    }>("select original,current,source,completed_at from public.orders");
    expect(updated.original).toEqual(old.original);
    expect(updated.current.total).toBe(2700);
    expect(updated.source).toBe("site");
    expect(updated.completed_at).toBeTruthy();
    expect(
      (
        await db.query<{ actor_id: string }>(
          "select actor_id from public.order_history order by id desc limit 1",
        )
      ).rows[0].actor_id,
    ).toBe(owner);
    await expect(
      asRole("service_role", "", () =>
        db.query(
          "select public.write_order($1::jsonb,$2::uuid,$3::timestamptz)",
          [
            JSON.stringify({
              id: old.id,
              current: newQuote,
              status: "confirmed",
              notes: "",
              adjustment: 0,
              adjustment_reason: "",
            }),
            owner,
            old.updated_at,
          ],
        ),
      ),
    ).rejects.toThrow(/outra janela/);
  });
  it("limita tentativas e bloqueia manipulação direta por visitante", async () => {
    await asRole("service_role", "", async () => {
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select public.consume_rate('test',1) as allowed",
          )
        ).rows[0].allowed,
      ).toBe(true);
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select public.consume_rate('test',1) as allowed",
          )
        ).rows[0].allowed,
      ).toBe(false);
    });
    await asRole("anon", "", async () => {
      await expect(
        db.query("select public.consume_rate('test',100000)"),
      ).rejects.toThrow();
      await expect(
        db.query(
          "insert into public.events(name,session_id) values('visit',$1)",
          [owner],
        ),
      ).rejects.toThrow();
    });
  });
  it("protege os uploads e permite upload apenas à proprietária", async () => {
    await asRole("authenticated", other, async () => {
      await expect(
        db.query(
          "insert into storage.objects(bucket_id,name) values('menu-images','unauthorized.webp')",
        ),
      ).rejects.toThrow();
    });
    await asRole("authenticated", owner, async () => {
      await db.query(
        "insert into storage.objects(bucket_id,name) values('menu-images','approved.webp')",
      );
    });
    await asRole("anon", "", async () =>
      expect((await db.query("select name from storage.objects")).rows).toEqual(
        [{ name: "approved.webp" }],
      ),
    );
  });
});
