// WhatsApp do Brasil: o 55 é fixo e fica fora do campo; a pessoa digita só DDD + número.
export const brazilCode = "55";

/** Número guardado (55 + DDD + número) → só DDD + número. */
export function nationalDigits(stored: string) {
  const digits = stored.replace(/\D/g, "");
  return digits.startsWith(brazilCode) ? digits.slice(2) : digits;
}

/** O que a pessoa digitou/colou → valor guardado (55 + DDD + número, até 11 dígitos nacionais). */
export function storedFromInput(input: string) {
  let digits = input.replace(/\D/g, "");
  // Número colado já com 55 na frente (DDD 55 também existe, por isso só com mais de 11 dígitos).
  if (digits.length > 11 && digits.startsWith(brazilCode)) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  return digits ? brazilCode + digits : "";
}

/** DDD + número → "(81) 99999-9999", formatando conforme digita. */
export function formatNational(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const rest = d.slice(2);
  const split = d.length > 10 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${rest.slice(0, split)}${rest.length > split ? `-${rest.slice(split)}` : ""}`;
}
