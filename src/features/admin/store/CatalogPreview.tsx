import { useEffect, useRef, useState } from "react";
import type { Catalog } from "../../../../shared/domain";
import { Modal } from "../../../shared/ui";

export default function CatalogPreview({ catalog, onClose, title = "Prévia do rascunho", restore }: {
  catalog: Catalog;
  onClose: () => void;
  title?: string;
  restore?: { busy: boolean; onConfirm: () => void; error: string };
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [mobile, setMobile] = useState(true);
  useEffect(() => {
    function receive(event: MessageEvent) {
      const target = frame.current?.contentWindow;
      if (target && event.origin === location.origin && event.source === target &&
        event.data?.type === "fitja:preview-ready") {
        target.postMessage({ type: "fitja:preview-catalog", catalog }, location.origin);
      }
    }
    window.addEventListener("message", receive);
    frame.current?.contentWindow?.postMessage({ type: "fitja:preview-catalog", catalog }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, [catalog]);
  return (
    <Modal title={title} wide onClose={onClose}>
      <div className="preview-toolbar">
        <button type="button" aria-pressed={mobile} className={`button compact ${mobile ? "primary" : "secondary"}`} onClick={() => setMobile(true)}>Celular</button>
        <button type="button" aria-pressed={!mobile} className={`button compact ${mobile ? "secondary" : "primary"}`} onClick={() => setMobile(false)}>Computador</button>
        <span>Somente prévia · sem pedidos reais</span>
      </div>
      <div className={`preview-frame ${mobile ? "mobile" : ""}`}>
        <iframe ref={frame} src="/admin/preview" title={title} />
      </div>
      {restore && <div className="modal-footer">
        {restore.error && <p role="alert" className="field-error">{restore.error}</p>}
        <button className="button primary" type="button" disabled={restore.busy} onClick={restore.onConfirm}>
          Restaurar apenas o tema
        </button>
      </div>}
    </Modal>
  );
}
