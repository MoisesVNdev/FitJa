// Em contexto não seguro (ex.: http://192.168.x.x aberto no celular) o navegador
// não expõe crypto.randomUUID. Sem ele, adicionar à sacola e criar produtos falhavam.
// getRandomValues continua disponível nesses contextos, então o fallback usa ele.
export function fallbackRandomUUID(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function") {
  Object.defineProperty(crypto, "randomUUID", { value: fallbackRandomUUID, configurable: true });
}
