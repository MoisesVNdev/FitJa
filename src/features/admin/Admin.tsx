import { observeIdentity, signOut } from "../../shared/api/identity";
import "./admin.css";
import { lazy, Suspense, useEffect, useState } from "react";
import { Check, ExternalLink, Eye, LayoutDashboard, Leaf, LogOut, Package, Palette, Save, Settings, ShoppingBag, Undo2 } from "lucide-react";
import { validateCatalog, type Catalog, type Order } from "../../../shared/domain";
import { demo, getDraft, isAdmin, listEvents, listOrders, publish, rollback, saveDraft, type EventRow } from "../../shared/api/admin";
import { Modal, Notice } from "../../shared/ui";
import { Menu } from "../catalog";
import { useTheme } from "../../shared/styles/useTheme";

const Login = lazy(() => import("./auth/Login"));
const Dashboard = lazy(() => import("./reports/Dashboard"));
const CatalogEditor = lazy(() => import("./catalog/CatalogEditor"));
const Appearance = lazy(() => import("./store/Appearance"));
const SettingsPanel = lazy(() => import("./store/SettingsPanel"));
const Orders = lazy(() => import("./orders/Orders"));

type Tab = "dashboard" | "products" | "orders" | "appearance" | "settings";
const tabItems: { id: Tab; name: string; icon: typeof Leaf }[] = [
  { id: "dashboard", name: "Visão geral", icon: LayoutDashboard },
  { id: "products", name: "Cardápio", icon: Package },
  { id: "orders", name: "Pedidos", icon: ShoppingBag },
  { id: "appearance", name: "Aparência", icon: Palette },
  { id: "settings", name: "Configurações", icon: Settings },
];
export default function Admin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [tab, setTab] = useState<Tab>("dashboard"),
    [orders, setOrders] = useState<Order[]>([]),
    [events, setEvents] = useState<EventRow[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState<"mobile" | "desktop" | null>(null);
  const [recovering, setRecovering] = useState(
    location.hash.includes("type=recovery"),
  );
  useTheme(catalog);
  async function refresh() {
    try {
      const [o, e] = await Promise.all([listOrders(), listEvents()]);
      setOrders(o);
      setEvents(e);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void isAdmin()
      .then(setAuthorized)
      .catch((e) => {
        setError(e.message);
        setAuthorized(false);
      });
    const unsubscribe = observeIdentity((recovery) => {
      if (recovery) setRecovering(true);
      setTimeout(() => {
        void isAdmin()
          .then(setAuthorized)
          .catch(() => setAuthorized(false));
      }, 0);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (authorized) {
      void getDraft()
        .then(setCatalog)
        .catch((e) => setError(e.message));
      void refresh();
    }
  }, [authorized]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function change(c: Catalog) {
    setCatalog(c);
    setDirty(true);
    setNotice("");
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (authorized === null)
    return (
      <main className="loading">
        <Leaf className="spin" />
        Abrindo sua cozinha…
      </main>
    );
  if (!authorized || recovering)
    return (
      <Login
        recovering={recovering}
        onSuccess={() => {
          setRecovering(false);
          void isAdmin().then(setAuthorized);
        }}
      />
    );
  if (!catalog)
    return (
      <main className="loading">
        {error ? <Notice error>{error}</Notice> : "Carregando painel…"}
      </main>
    );
  const c = catalog;
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a href="/" className="brand">
          <img src="/media/logo.webp" width="44" height="44" alt="Fit Já" />
          <span>
            <strong>Laís Fit Já</strong>
            <small>PAINEL DA PROPRIETÁRIA</small>
          </span>
        </a>
        <span className="eyebrow sidebar-caption">SUA COZINHA DIGITAL</span>
        <nav>
          {tabItems.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setError("");
                setNotice("");
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-tip">
            <Leaf size={22} />
            <strong>Um cardápio sempre fresquinho.</strong>
            <p>Atualize os sabores e avise o que acabou.</p>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={17} />
            Ver cardápio
          </a>
          {!demo && (
            <button onClick={() => void signOut()}>
              <LogOut size={17} />
              Sair do painel
            </button>
          )}
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>
            {demo ? (
              <>
                <span className="status-dot" />
                Demonstração local
              </>
            ) : (
              <>
                <span className="status-dot" />
                Área protegida
              </>
            )}
          </span>
          <div>
            <button
              className="button secondary compact"
              onClick={() => setPreview("mobile")}
            >
              <Eye size={16} />
              Prévia
            </button>
            <button
              className="button primary compact"
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  await saveDraft(c);
                  setDirty(false);
                  setNotice(
                    "Rascunho salvo. O cardápio público não foi alterado.",
                  );
                })
              }
            >
              <Save size={16} />
              {dirty ? "Salvar rascunho" : "Salvar"}
            </button>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="eyebrow">SEU NEGÓCIO, MAIS ORGANIZADO</span>
              <h1>{tabItems.find((t) => t.id === tab)?.name}</h1>
              <p>
                {
                  {
                    dashboard: "Uma visão do que acontece por aqui.",
                    products: "Cada sabor tem seu lugar no cardápio.",
                    orders: "Da primeira escolha até a venda concluída.",
                    appearance: "Deixe o cardápio com a sua identidade.",
                    settings: "Os detalhes que conectam você aos clientes.",
                  }[tab]
                }
              </p>
            </div>
            {dirty && (
              <span className="draft-label">Alterações ainda não salvas</span>
            )}
          </div>
          {demo && (
            <div className="admin-demo-note">
              <ShieldIcon />
              Você está testando com dados salvos apenas neste navegador. Nenhum
              pedido é enviado automaticamente.
            </div>
          )}
          {error && <Notice error>{error}</Notice>}
          {notice && <Notice>{notice}</Notice>}
          <Suspense fallback={<p role="status">Carregando tela…</p>}>
          {tab === "dashboard" && (
            <Dashboard
              orders={orders}
              events={events}
              onOrders={() => setTab("orders")}
              refresh={refresh}
            />
          )}
          {tab === "products" && <CatalogEditor catalog={c} change={change} />}
          {tab === "orders" && (
            <Orders
              catalog={c}
              orders={orders}
              refresh={refresh}
              report={setError}
            />
          )}
          {tab === "appearance" && (
            <Appearance
              catalog={c}
              change={change}
              preview={() => setPreview("mobile")}
            />
          )}
          {tab === "settings" && <SettingsPanel catalog={c} change={change} />}
          </Suspense>
          {(tab === "appearance" ||
            tab === "products" ||
            tab === "settings") && (
            <section className="publish-panel">
              <div>
                <strong>Pronto para aparecer no cardápio?</strong>
                <p>Confira a prévia antes de publicar suas alterações.</p>
              </div>
              <div>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      const previous = await rollback();
                      setCatalog(previous);
                      setDirty(false);
                      setNotice("Publicação anterior restaurada.");
                    })
                  }
                >
                  <Undo2 size={17} />
                  Restaurar anterior
                </button>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      validateCatalog(c);
                      await publish(c);
                      setDirty(false);
                      setNotice(
                        demo
                          ? "Publicado na demonstração deste navegador."
                          : "Cardápio publicado com sucesso.",
                      );
                    })
                  }
                >
                  <Check size={17} />
                  Publicar cardápio
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
      {preview && (
        <Modal title="Prévia do rascunho" wide onClose={() => setPreview(null)}>
          <div className="preview-toolbar">
            <button
              className={`button ${preview === "mobile" ? "primary" : "secondary"} compact`}
              onClick={() => setPreview("mobile")}
            >
              Celular
            </button>
            <button
              className={`button ${preview === "desktop" ? "primary" : "secondary"} compact`}
              onClick={() => setPreview("desktop")}
            >
              Computador
            </button>
            <span>Prévia · sem pedidos reais</span>
          </div>
          <div className={`preview-frame ${preview}`}>
            <Menu previewCatalog={c} preview />
          </div>
        </Modal>
      )}
    </div>
  );
}
function ShieldIcon() {
  return <Leaf size={17} />;
}
