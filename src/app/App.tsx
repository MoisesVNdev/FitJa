import { lazy, Suspense } from "react";
import { Leaf } from "lucide-react";
import { Menu } from "../features/catalog";

const Admin = lazy(() => import("../features/admin/Admin"));

export default function App() {
  return location.pathname.startsWith("/admin") ? (
    <Suspense fallback={<div className="loading"><Leaf className="spin" />Abrindo painel…</div>}>
      <Admin />
    </Suspense>
  ) : <Menu />;
}
