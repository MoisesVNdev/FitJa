import { lazy, Suspense } from "react";
import { Leaf } from "lucide-react";
import { Menu } from "../features/catalog";

const Admin = lazy(() => import("../features/admin/Admin"));
const StorePreview = lazy(() => import("./StorePreview"));

export default function App() {
  if (location.pathname === "/admin/preview") {
    return <Suspense fallback={<p role="status">Abrindo prévia…</p>}><StorePreview /></Suspense>;
  }
  return location.pathname.startsWith("/admin") ? (
    <Suspense fallback={<div className="loading"><Leaf className="spin" />Abrindo painel…</div>}>
      <Admin />
    </Suspense>
  ) : <Menu />;
}
