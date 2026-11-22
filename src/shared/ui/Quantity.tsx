import { Minus, Plus } from "lucide-react";

export function Quantity({
  value,
  set,
  min = 1,
  max = 99,
  label = "Quantidade",
}: {
  value: number;
  set: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label={`Diminuir ${label}`}
        disabled={value <= min}
        onClick={() => set(value - 1)}
      >
        <Minus size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        disabled={value >= max}
        onClick={() => set(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
