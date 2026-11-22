import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Credentials are inherited through the environment, never printed or passed as arguments.
const required = (name) => {
  if (!process.env[name]) throw new Error(`Defina ${name} no ambiente.`);
  return process.env[name];
};
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
function pgEnvironment(connection) {
  const u = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(u.protocol))
    throw new Error("DATABASE_URL precisa ser uma conexão PostgreSQL.");
  return {
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
}
function inside(root, relative) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(path.resolve(root) + path.sep))
    throw new Error("Caminho de backup inválido.");
  return absolute;
}
function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    child.stderr.resume();
    child.once("error", () =>
      reject(
        new Error(
          `${command} indisponível. Instale as ferramentas PostgreSQL compatíveis com o servidor.`,
        ),
      ),
    );
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `${command} falhou (código ${code}). Confira a conexão e a versão do PostgreSQL.`,
            ),
          ),
    );
  });
}
async function verify(folder) {
  const m = JSON.parse(
    await readFile(path.join(folder, "manifest.json"), "utf8"),
  );
  for (const item of m.files) {
    const buffer = await readFile(inside(folder, item.path));
    if (digest(buffer) !== item.sha256)
      throw new Error(`Arquivo ausente ou corrompido: ${item.path}`);
  }
  console.log(
    `Integridade verificada: ${m.files.length} arquivos. Isto não substitui o teste de restauração do banco.`,
  );
  return m;
}
async function main() {
  if (process.argv[2] === "--verify") {
    if (!process.argv[3]) throw new Error("Informe a pasta do backup.");
    await verify(path.resolve(process.argv[3]));
    return;
  }
  const client = createClient(
    required("SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
  const directory = path.join(
    process.cwd(),
    "backups",
    new Date().toISOString().replace(/[:.]/g, "-"),
  );
  await mkdir(directory, { recursive: true });
  await run(
    "pg_dump",
    [
      "--format=custom",
      "--no-owner",
      "--schema=public",
      "--schema=auth",
      "--schema=storage",
      `--file=${path.join(directory, "database.dump")}`,
    ],
    pgEnvironment(required("DATABASE_URL")),
  );
  const files = [
    {
      path: "database.dump",
      sha256: digest(await readFile(path.join(directory, "database.dump"))),
    },
  ];
  async function images(prefix = "") {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await client.storage
        .from("menu-images")
        .list(prefix, {
          limit: 100,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
      if (error) throw new Error("Falha ao listar imagens.");
      for (const item of data) {
        const key = prefix ? `${prefix}/${item.name}` : item.name;
        if (!item.id) {
          await images(key);
          continue;
        }
        const { data: blob, error: failed } = await client.storage
          .from("menu-images")
          .download(key);
        if (failed) throw new Error("Falha ao copiar imagem.");
        const relative = `images/${key}`,
          destination = inside(directory, relative),
          buffer = Buffer.from(await blob.arrayBuffer());
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, buffer);
        files.push({ path: relative, sha256: digest(buffer) });
      }
      if (data.length < 100) break;
    }
  }
  await images();
  await writeFile(
    path.join(directory, "manifest.json"),
    JSON.stringify(
      {
        format: 1,
        createdAt: new Date().toISOString(),
        bucket: "menu-images",
        files,
      },
      null,
      2,
    ),
  );
  await verify(directory);
  // Telemetry housekeeping is separate from the backup data and only follows a successful copy.
  const { error } = await client.rpc("cleanup_telemetry");
  if (error) console.log("Backup concluído; limpeza de telemetria pendente.");
  console.log(
    `Backup completo em ${directory}. Copie-o para um destino privado fora deste computador.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
