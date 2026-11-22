import { type ReactNode } from "react";
import { Check } from "lucide-react";

export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`notice ${error ? "error" : ""}`}
    >
      {error ? null : <Check size={17} />}
      <span>{children}</span>
    </div>
  );
}
