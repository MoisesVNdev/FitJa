import { Leaf } from "lucide-react";
import { type Order } from "../../../shared/domain";
import { caruaruTimeZone } from "../../../shared/domain/hours";

export const statusLabels: Record<Order["status"], string> = {
  requested: "Criado no site",
  evaluating: "Em avaliação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};
export const sourceLabels: Record<Order["source"], string> = {
  site: "Site",
  counter: "Balcão",
  whatsapp: "WhatsApp direto",
};
export const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: caruaruTimeZone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty admin-empty">
      <Leaf size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Status({ status, source }: { status: Order["status"]; source?: Order["source"] }) {
  return (
    <span className={`order-status ${status}`}>
      {status === "requested" && source && source !== "site" ? "Solicitação criada" : statusLabels[status]}
    </span>
  );
}

