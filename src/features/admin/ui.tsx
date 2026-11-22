import { Leaf } from "lucide-react";
import { type Order } from "../../../shared/domain";

export const statusLabels: Record<Order["status"], string> = {
  requested: "Solicitação criada",
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
    timeZone: "America/Sao_Paulo",
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
export function Status({ status }: { status: Order["status"] }) {
  return (
    <span className={`order-status ${status}`}>{statusLabels[status]}</span>
  );
}

