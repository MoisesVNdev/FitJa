import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Intentionally requires the operator to identify an isolated recovery environment.
// Never run this against the live storefront: pg_restore replaces public/auth objects.
async function main() {
  const folder = process.argv[2];
  if (!folder || process.env.RESTORE_TO_ISOLATED_PROJECT !== "yes")
    throw new Error(
      "Use uma cópia isolada do projeto e defina RESTORE_TO_ISOLATED_PROJECT=yes.",
    );
  for (const name of [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ])
    if (!process.env[name]) throw new Error(`Defina ${name}.`);
  const root = path.resolve(folder),
    manifest = JSON.parse(
      await readFile(path.join(root, "manifest.json"), "utf8"),
    );
  for (const item of manifest.files) {
    const file = path.resolve(root, item.path);
    if (!file.startsWith(root + path.sep))
      throw new Error("Caminho inválido no manifesto.");
    const data = await readFile(file);
    if (createHash("sha256").update(data).digest("hex") !== item.sha256)
      throw new Error(`Backup corrompido: ${item.path}`);
  }
  const u = new URL(process.env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(u.protocol))
    throw new Error("Conexão PostgreSQL inválida.");
  const pgEnv = {
    ...process.env,
    PGHOST: u.hostname,
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: decodeURIComponent(u.pathname.slice(1)),
    PGSSLMODE:
      u.searchParams.get("sslmode") ||
      (["localhost", "127.0.0.1"].includes(u.hostname) ? "disable" : "require"),
  };
  await new Promise((resolve, reject) => {
    const child = spawn(
      "pg_restore",
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--single-transaction",
        `--dbname=${pgEnv.PGDATABASE}`,
        path.join(root, "database.dump"),
      ],
      { env: pgEnv, stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
    );
    child.stderr.resume();
    child.once("error", () => reject(new Error("pg_restore indisponível.")));
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Restauração do banco falhou (${code}). O alvo deve ter a mesma versão e permissões necessárias.`,
            ),
          ),
    );
  });
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data: bucket } = await client.storage.getBucket("menu-images");
  if (!bucket) {
    const { error } = await client.storage.createBucket("menu-images", {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/webp"],
    });
    if (error) throw new Error("Não foi possível preparar o bucket.");
  }
  for (const item of manifest.files.filter((x) =>
    x.path.startsWith("images/"),
  )) {
    const key = item.path.slice(7),
      data = await readFile(path.join(root, item.path));
    const { error } = await client.storage
      .from("menu-images")
      .upload(key, data, {
        upsert: true,
        contentType: key.endsWith(".webp") ? "image/webp" : "image/jpeg",
        cacheControl: "31536000",
      });
    if (error) throw new Error("Falha ao restaurar imagens.");
  }
  console.log(
    "Banco e imagens restaurados no projeto isolado. Atualize as URLs de imagens do projeto antigo, as chaves, o SMTP e as configurações do Auth; valide login, catálogo e pedidos antes de qualquer troca de produção.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
