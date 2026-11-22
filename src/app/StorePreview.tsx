import { useEffect, useState } from "react";
import type { Catalog } from "../../shared/domain";
import { Menu } from "../features/catalog";

export default function StorePreview() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    if (window.parent === window) return;
    function receive(event: MessageEvent) {
      if (event.origin === location.origin && event.source === window.parent &&
        event.data?.type === "fitja:preview-catalog" && event.data.catalog) {
        setCatalog(event.data.catalog);
      }
    }
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "fitja:preview-ready" }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  return catalog ? <Menu previewCatalog={catalog} preview /> : (
    <p role="status">{window.parent === window ? "Abra a prévia pelo painel." : "Carregando rascunho…"}</p>
  );
}
