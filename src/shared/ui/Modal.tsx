import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  fitVisualViewport = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  fitVisualViewport?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    label = useId();
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    const viewport = window.visualViewport;
    if (!fitVisualViewport || !dialog || !viewport) return;
    const resize = () => {
      if (viewport.scale !== 1) return;
      dialog.style.setProperty("--modal-visible-height", `${viewport.height}px`);
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      dialog.style.setProperty("--modal-keyboard-inset", `${inset}px`);
      if (inset > 0 && document.activeElement instanceof HTMLTextAreaElement &&
        dialog.contains(document.activeElement)) {
        document.activeElement.scrollIntoView({ block: "nearest", behavior: "instant" });
      }
    };
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
    };
  }, [fitVisualViewport]);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""} ${fitVisualViewport ? "cart-modal" : ""}`}
      aria-labelledby={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id={label}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
