import { useEffect, useRef, useState } from "react";
import type { Catalog } from "../../../../shared/domain";
import { Modal } from "../../../shared/ui";

export default function CatalogPreview({ catalog, onClose }: {
  catalog: Catalog;
  onClose: () => void;
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
    <Modal title="Prévia do rascunho" wide onClose={onClose}>
      <div className="preview-toolbar">
        <button type="button" aria-pressed={mobile} className={`button compact ${mobile ? "primary" : "secondary"}`} onClick={() => setMobile(true)}>Celular</button>
        <button type="button" aria-pressed={!mobile} className={`button compact ${mobile ? "secondary" : "primary"}`} onClick={() => setMobile(false)}>Computador</button>
        <span>Somente prévia · sem pedidos reais</span>
      </div>
      <div className={`preview-frame ${mobile ? "mobile" : ""}`}>
        <iframe ref={frame} src="/admin/preview" title="Cardápio com o rascunho atual" />
      </div>
    </Modal>
  );
}
