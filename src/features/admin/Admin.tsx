import { observeIdentity, signOut } from "../../shared/api/identity";
import "./admin.css";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Eye, LayoutDashboard, Leaf, LogOut, Package, Palette, Save, Settings, ShoppingBag, Undo2 } from "lucide-react";
import { validateCatalog, type Catalog, type Order } from "../../../shared/domain";
import { demo, getDraft, isAdmin, listEvents, listOrders, publish, rollback, saveDraft, type EventRow } from "../../shared/api/admin";
import { Notice } from "../../shared/ui";
import { useUnsavedChanges } from "./useUnsavedChanges";

const Login = lazy(() => import("./auth/Login"));
const Dashboard = lazy(() => import("./reports/Dashboard"));
const CatalogEditor = lazy(() => import("./catalog/CatalogEditor"));
const Appearance = lazy(() => import("./store/Appearance"));
const SettingsPanel = lazy(() => import("./store/SettingsPanel"));
const Orders = lazy(() => import("./orders/Orders"));
const CatalogPreview = lazy(() => import("./store/CatalogPreview"));

type Tab = "dashboard" | "products" | "orders" | "appearance" | "settings";
const tabItems: { id: Tab; name: string; icon: typeof Leaf }[] = [
  { id: "dashboard", name: "Visão geral", icon: LayoutDashboard },
  { id: "orders", name: "Pedidos", icon: ShoppingBag },
  { id: "products", name: "Cardápio", icon: Package },
  { id: "appearance", name: "Aparência", icon: Palette },
  { id: "settings", name: "Configurações", icon: Settings },
];

export default function Admin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [savedDraft, setSavedDraft] = useState<Catalog | null>(null),
    [tab, setTab] = useState<Tab>("dashboard"),
    [orders, setOrders] = useState<Order[]>([]),
    [events, setEvents] = useState<EventRow[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false),
    [pendingOnly, setPendingOnly] = useState(false),
    [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [recovering, setRecovering] = useState(location.hash.includes("type=recovery"));
  const runningAction = useRef(false);
  const dirty = catalog !== savedDraft;
  useUnsavedChanges(dirty);

  async function refresh() {
    try {
      const [o, e] = await Promise.all([listOrders(), listEvents()]);
      setOrders(o);
      setEvents(e);
    } catch (problem) {
      setError((problem as Error).message);
    }
  }
  useEffect(() => {
    void isAdmin().then(setAuthorized).catch((problem) => {
      setError(problem.message);
      setAuthorized(false);
    });
    return observeIdentity((recovery) => {
      if (recovery) setRecovering(true);
      setTimeout(() => {
        void isAdmin().then(setAuthorized).catch(() => setAuthorized(false));
      }, 0);
    });
  }, []);
  useEffect(() => {
    if (!authorized) return;
    void getDraft().then((draft) => {
      setSavedDraft(draft);
      setCatalog(draft);
    }).catch((problem) => setError(problem.message));
    void refresh();
  }, [authorized]);

  function change(next: Catalog) {
    setCatalog(next);
    setNotice("");
  }
  function selectTab(next: Tab) {
    setPendingOnly(false);
    setAvailabilityOnly(false);
    setTab(next);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function action(fn: () => Promise<void>) {
    if (runningAction.current) return;
    runningAction.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      runningAction.current = false;
      setBusy(false);
    }
  }
  if (authorized === null) {
    return <main className="loading"><Leaf className="spin" />Abrindo painel…</main>;
  }
  if (!authorized || recovering) {
    return <Login recovering={recovering} onSuccess={() => {
      setRecovering(false);
      void isAdmin().then(setAuthorized);
    }} />;
  }
  if (!catalog) {
    return <main className="loading">{error ? <Notice error>{error}</Notice> : "Carregando painel…"}</main>;
  }
  const c = catalog;
  const catalogTab = tab === "products" || tab === "appearance" || tab === "settings";
  const pendingCount = orders.filter((order) => order.status === "requested").length;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a className="brand" href="/" target="_blank" rel="noopener noreferrer" aria-label="Abrir cardápio público da Laís Fit Já">
          <img src="/media/logo.webp" width="44" height="44" alt="" />
          <span><strong>Laís Fit Já</strong><small>PAINEL DA PROPRIETÁRIA</small></span>
        </a>
        <nav aria-label="Navegação do painel">
          {tabItems.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => selectTab(id)}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={17} aria-hidden="true" /> Abrir cardápio público
          </a>
          {!demo && (
            <button type="button" onClick={() => {
              if (!dirty || window.confirm("Sair com alterações ainda não salvas?")) void signOut();
            }}>
              <LogOut size={17} aria-hidden="true" /> Sair do painel
            </button>
          )}
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>{demo ? "Demonstração local · dados deste navegador" : "Área da proprietária"}</span>
          {catalogTab && (
            <div className="admin-draft-actions">
              <button type="button" className="button secondary compact" onClick={() => setPreview(true)}>
                <Eye size={17} aria-hidden="true" /> Ver prévia
              </button>
              <button type="button" className="button secondary compact" disabled={busy} onClick={() => void action(async () => {
                await saveDraft(c);
                setSavedDraft(c);
                setNotice("Rascunho salvo. O cardápio público continua como estava.");
              })}>
                <Save size={17} aria-hidden="true" /> Salvar rascunho
              </button>
              <button type="button" className="button primary compact" disabled={busy} onClick={() => void action(async () => {
                validateCatalog(c);
                await publish(c);
                setSavedDraft(c);
                setNotice(demo ? "Publicado na demonstração deste navegador." : "Cardápio publicado.");
              })}>
                <Check size={17} aria-hidden="true" /> Publicar cardápio
              </button>
            </div>
          )}
        </header>
        <main className="admin-content" inert={busy}>
          <div className="admin-page-heading">
            <div>
              <h1>{tabItems.find((t) => t.id === tab)?.name}</h1>
              {catalogTab && <p>O público vê as alterações quando você publica o cardápio.</p>}
            </div>
            {catalogTab && dirty && <span className="draft-label" role="status">Alterações ainda não salvas</span>}
          </div>
          {error && <Notice error>{error}</Notice>}
          {notice && <Notice>{notice}</Notice>}
          <Suspense fallback={<p role="status">Carregando tela…</p>}>
            {tab === "dashboard" && (
              <>
                <section className="admin-queue" aria-label="Trabalho diário">
                  <div>
                    <h2>Pedidos a conferir</h2>
                    <p>{pendingCount} {pendingCount === 1 ? "solicitação" : "solicitações"} aguardando conferência</p>
                    <button type="button" className="button primary" onClick={() => {
                      selectTab("orders");
                      setPendingOnly(true);
                    }}>Abrir pedidos a conferir</button>
                  </div>
                  <div>
                    <h2>Disponibilidade</h2>
                    <p>Revise os esgotados e atualize o rascunho.</p>
                    <button type="button" className="button secondary" onClick={() => {
                      selectTab("products");
                      setAvailabilityOnly(true);
                    }}>Ver itens esgotados</button>
                  </div>
                  <div>
                    <h2>Cardápio e publicação</h2>
                    <p>Edite produtos e publique após conferir a prévia.</p>
                    <button type="button" className="button secondary" onClick={() => selectTab("products")}>Abrir cardápio</button>
                  </div>
                </section>
                <Dashboard orders={orders} events={events} onOrders={() => selectTab("orders")} refresh={refresh} />
              </>
            )}
            {tab === "products" && <CatalogEditor key={String(availabilityOnly)} catalog={c} change={change} outOfStockOnly={availabilityOnly} />}
            {tab === "orders" && <Orders key={String(pendingOnly)} catalog={c} orders={orders} refresh={refresh} report={setError} pendingOnly={pendingOnly} />}
            {tab === "appearance" && <Appearance catalog={c} change={change} preview={() => setPreview(true)} />}
            {tab === "settings" && <SettingsPanel catalog={c} change={change} />}
          </Suspense>
          {catalogTab && (
            <section className="publish-panel">
              <div>
                <strong>Versão anterior do cardápio</strong>
                <p>A restauração recupera o catálogo completo.</p>
              </div>
              <div>
                <button type="button" className="button secondary" disabled={busy} onClick={() => {
                  if (!window.confirm("Restaurar a publicação anterior e substituir o rascunho atual?")) return;
                  void action(async () => {
                    const previous = await rollback();
                    setCatalog(previous);
                    setSavedDraft(previous);
                    setNotice("Publicação anterior restaurada.");
                  });
                }}>
                  <Undo2 size={17} aria-hidden="true" /> Restaurar publicação anterior
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
      {preview && (
        <Suspense fallback={<p role="status">Abrindo prévia…</p>}>
          <CatalogPreview catalog={c} onClose={() => setPreview(false)} />
        </Suspense>
      )}
    </div>
  );
}
