import { weekdays, type StoreHours, type Weekday } from "../contracts/operations.ts";

export const caruaruTimeZone = "America/Recife";
export const weekdayLabels: Record<Weekday, string> = {
  mon: "Segunda-feira", tue: "Terça-feira", wed: "Quarta-feira", thu: "Quinta-feira",
  fri: "Sexta-feira", sat: "Sábado", sun: "Domingo",
};
const localTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: caruaruTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function caruaruDate(now: Date) {
  const parts = Object.fromEntries(localTime.formatToParts(now).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function validDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const value = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(+value) && value.toISOString().slice(0, 10) === date;
}

export function storeHoursError(hours: StoreHours) {
  if (!hours?.days || typeof hours.days !== "object" || Array.isArray(hours.days) ||
    !Array.isArray(hours.closures) || hours.closures.length > 30) {
    return "Configure os dias da semana e até 30 datas excepcionais.";
  }
  for (const [day, ranges] of Object.entries(hours.days)) {
    if (!weekdays.includes(day as Weekday) || !Array.isArray(ranges) || ranges.length > 6) {
      return "Informe até 6 faixas por dia da semana.";
    }
    let previousEnd = "";
    for (const range of ranges) {
      if (!range || typeof range.opens !== "string" || typeof range.closes !== "string" ||
        !timePattern.test(range.opens) || !timePattern.test(range.closes) ||
        range.opens >= range.closes || range.opens < previousEnd) {
        return `${weekdayLabels[day as Weekday]}: use faixas em ordem, sem sobreposição, com abertura e fechamento no mesmo dia.`;
      }
      previousEnd = range.closes;
    }
  }
  const dates = new Set<string>();
  for (const closure of hours.closures) {
    if (!closure || !validDate(closure.date) || dates.has(closure.date) ||
      typeof closure.notice !== "string" || closure.notice.length > 200) {
      return "Informe datas excepcionais válidas e sem repetição, com avisos de até 200 caracteres.";
    }
    dates.add(closure.date);
  }
  return null;
}

export function storeHoursStatus(hours?: StoreHours, now = new Date()) {
  if (!hours || storeHoursError(hours)) return { state: "unknown", text: "Consulte os horários pelo WhatsApp." } as const;
  const { date, time } = caruaruDate(now);
  const exception = hours.closures.find((closure) => closure.date === date);
  if (exception) return {
    state: "closed", exceptional: true, text: exception.notice.trim() || "Atendimento fechado hoje.",
  } as const;
  const weekday = weekdays[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7];
  const ranges = hours.days[weekday];
  if (!ranges) return { state: "unknown", text: "Consulte os horários pelo WhatsApp." } as const;
  const active = ranges.find((range) => range.opens <= time && time < range.closes);
  return active
    ? { state: "open", text: `Em atendimento até ${active.closes} (hora de Caruaru).` } as const
    : { state: "closed", text: "Fora do horário de atendimento." } as const;
}
