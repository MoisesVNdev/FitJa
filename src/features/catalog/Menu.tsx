import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Clock3, Coffee, Cookie, Heart, Instagram, Leaf, MapPin, Menu as MenuIcon, MessageCircle, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Utensils, X } from "lucide-react";
import { available, money, normalize, quoteCart, validPhone, type CartLine, type Catalog, type Product } from "../../../shared/domain";
import { demo, loadCatalog, storage, backendConfigured, track } from "../../shared/api/catalog";
import { Modal } from "../../shared/ui";
import { ProductCard, ProductDialog } from "./ProductViews";

import { useTheme } from "../../shared/styles/useTheme";
import { CartDialog, useCart } from "../cart";

export function Menu({
  previewCatalog,
  preview = false,
}: {
  previewCatalog?: Catalog;
  preview?: boolean;
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(
      previewCatalog || null,
    ),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [active, setActive] = useState("all"),
    [selected, setSelected] = useState<Product | null>(null),
    [editLine, setEditLine] = useState<CartLine | undefined>();
  const [cartOpen, setCartOpen] = useState(false),
    [toast, setToast] = useState("");
  const { cart, setCart } = useCart(preview, setToast);
  const [economy, setEconomy] = useState(() => {
      const saved = storage.get<boolean | null>("economy", null);
      const connection = (
        navigator as Navigator & {
          connection?: { saveData?: boolean; effectiveType?: string };
        }
      ).connection;
      return (
        saved ??
        !!(
          connection?.saveData ||
          ["slow-2g", "2g"].includes(connection?.effectiveType || "")
        )
      );
    }),
    [info, setInfo] = useState(false);
  useTheme(catalog);
  useEffect(() => {
    if (previewCatalog) {
      setCatalog(previewCatalog);
      return;
    }
    void loadCatalog()
      .then(setCatalog)
      .catch((e) => setError(e.message));
  }, [previewCatalog]);
  useEffect(() => {
    if (!preview) void track("visit");
  }, [preview]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const catsRef = useRef<HTMLElement>(null);
  if (error)
    return (
      <main className="error-page">
        <Leaf />
        <h1>Uma pausa rapidinha</h1>
        <p>{error}</p>
        <button className="button primary" onClick={() => location.reload()}>
          Tentar novamente
        </button>
      </main>
    );
  if (!catalog)
    return (
      <main className="loading">
        <Leaf className="spin" />
        Preparando algo gostoso…
      </main>
    );
  const c = catalog,
    count = cart.reduce((n, l) => n + l.quantity, 0),
    featured = c.products.filter(
      (p) => p.featured && !p.archived && available(c, p),
    );
  let total: number | null = null;
  try {
    if (cart.length) total = quoteCart(c, cart).total;
  } catch {
    /* Cart review identifies stale products. */
  }
  const filtered = (categoryId: string) =>
    c.products.filter(
      (p) =>
        !p.archived &&
        p.categoryId === categoryId &&
        normalize(
          `${p.name} ${p.description} ${p.variants.map((v) => v.name).join(" ")}`,
        ).includes(normalize(query)),
    );
  function choose(p: Product, line?: CartLine) {
    setSelected(p);
    setEditLine(line);
    if (!preview) void track("product_view", p.id);
  }
  function add(line: CartLine) {
    setCart((old) =>
      old.some((l) => l.key === line.key)
        ? old.map((l) => (l.key === line.key ? line : l))
        : [...old, line],
    );
    setSelected(null);
    setToast(
      editLine ? "Seu pedido foi atualizado." : "Adicionado à sua sacola!",
    );
    if (!preview) void track("add_to_cart", line.productId);
  }
  function category(id: string) {
    setActive(id);
    setTimeout(
      () =>
        document
          .getElementById(id === "all" ? "menu-start" : `section-${id}`)
          ?.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
            block: "start",
          }),
      20,
    );
  }
  const icons: Record<string, typeof Leaf> = {
    marmitas: Utensils,
    lanches: Utensils,
    bebidas: Coffee,
    doces: Cookie,
    combos: Sparkles,
  };
  return (
    <div className={`storefront ${preview ? "preview-store" : ""}`}>
      {!preview && demo && (
        <div className="demo-strip">
          Prévia local · pedidos e alterações ficam somente neste navegador{" "}
          <a href="/admin">Abrir painel</a>
        </div>
      )}
      {!preview && !backendConfigured && !demo && (
        <div className="demo-strip">
          Cardápio em preparação. Pedidos online ainda não disponíveis.
        </div>
      )}
      <header className="site-header">
        <a
          className="brand"
          href={preview ? "#" : "/"}
          aria-label={`${c.name}, início`}
        >
          <img src="/media/logo.webp" width="48" height="48" alt="Fit Já" />
          <span>
            <strong>{c.name}</strong>
            <small>COMIDA SAUDÁVEL</small>
          </span>
        </a>
        <div className="header-actions">
          <span className="header-location">
            <MapPin size={15} />
            {c.location}
          </span>
          <button
            className="icon-button subtle"
            onClick={() => setInfo(true)}
            aria-label="Informações e economia de dados"
          >
            <SlidersHorizontal size={20} />
          </button>
          <button
            className="header-cart"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir sacola com ${count} itens`}
          >
            <ShoppingBag size={21} />
            <span className="desktop-only">Sua sacola</span>
            {count > 0 && <b>{count}</b>}
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">
              <Leaf size={15} /> BOA COMIDA. BOA ENERGIA.
            </span>
            <h1>
              Leve na rotina.
              <br />
              <span>Cheio de sabor.</span>
            </h1>
            <p>{c.tagline} Refeições e lanches para acompanhar o seu ritmo.</p>
            <button
              className="button hero-button"
              onClick={() => category("all")}
            >
              Encontre seu favorito <Utensils size={18} />
            </button>
            <div className="hero-facts">
              <span>
                <Heart size={15} /> Feito com carinho
              </span>
              <span>
                <MessageCircle size={15} /> Peça pelo WhatsApp
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-ring" />
            <img
              className="hero-main-food"
              src="/media/escondidinho-640.webp"
              alt=""
              width="320"
              height="320"
              fetchPriority="high"
            />
            <img
              className="hero-small-food"
              src="/media/suco-laranja-320.webp"
              alt=""
              width="140"
              height="180"
            />
            <div className="hero-sticker">
              <Leaf size={22} />
              <span>
                Seu dia pede
                <br />
                <strong>mais Fit Já.</strong>
              </span>
            </div>
            <span className="hero-sparkle">✳</span>
            <span className="hero-caption">
              COMIDA DE VERDADE, DO SEU JEITO.
            </span>
          </div>
        </section>
        <div className="store-meta">
          <span>
            <Clock3 size={17} />
            {c.hours}
          </span>
          <span>
            <MapPin size={17} />
            {c.location}
          </span>
        </div>
        <div className="menu-shell">
          <div className="menu-heading" id="menu-start">
            <div>
              <span className="eyebrow">ESCOLHA BEM. COMA FELIZ.</span>
              <h2>O que vai bem hoje?</h2>
            </div>
            <label className="search-box">
              <Search size={20} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive("all");
                }}
                placeholder="Busque seu próximo favorito"
                aria-label="Buscar produtos"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Limpar busca">
                  <X size={17} />
                </button>
              )}
            </label>
          </div>
          <nav
            className="category-nav"
            ref={catsRef}
            aria-label="Categorias do cardápio"
          >
            <button
              className={active === "all" ? "active" : ""}
              onClick={() => category("all")}
            >
              <MenuIcon size={17} />
              Tudo de bom
            </button>
            {c.categories
              .filter((cat) =>
                c.products.some((p) => p.categoryId === cat.id && !p.archived),
              )
              .map((cat) => {
                const Icon = icons[cat.id] || Leaf;
                return (
                  <button
                    key={cat.id}
                    className={active === cat.id ? "active" : ""}
                    onClick={() => category(cat.id)}
                  >
                    <Icon size={18} />
                    {cat.name}
                  </button>
                );
              })}
          </nav>
          {!query && active === "all" && featured.length > 0 && (
            <section className="featured-section">
              <div className="section-title">
                <div>
                  <span className="eyebrow orange">UMA ESCOLHA SEM ERRO</span>
                  <h2>
                    Os favoritos da casa <Heart size={22} />
                  </h2>
                </div>
                <span className="small muted desktop-only">
                  Uma pausa gostosa começa aqui.
                </span>
              </div>
              <div className="featured-grid">
                {featured.slice(0, 4).map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    catalog={c}
                    onSelect={choose}
                    economy={economy}
                    eager={i < 2}
                  />
                ))}
              </div>
            </section>
          )}
          {query &&
            !c.products.some(
              (p) =>
                !p.archived &&
                normalize(
                  `${p.name} ${p.description} ${p.variants.map((v) => v.name).join(" ")}`,
                ).includes(normalize(query)),
            ) && (
              <div className="empty">
                <Search />
                <h3>Não encontramos esse sabor.</h3>
                <p>Tente buscar por um ingrediente ou outro nome.</p>
                <button
                  className="button secondary"
                  onClick={() => setQuery("")}
                >
                  Ver todo o cardápio
                </button>
              </div>
            )}
          {c.categories
            .filter(
              (cat) =>
                (active === "all" || active === cat.id) &&
                filtered(cat.id).length > 0,
            )
            .map((cat) => (
              <section
                id={`section-${cat.id}`}
                className="category-section"
                key={cat.id}
                style={
                  {
                    "--section-bg": cat.color,
                    "--section-text": cat.textColor,
                  } as CSSProperties
                }
              >
                <div className="section-title">
                  <div>
                    <span className="eyebrow">UM SABOR PARA CADA MOMENTO</span>
                    <h2>{cat.name}</h2>
                  </div>
                  <span className="category-count">
                    {filtered(cat.id).length} opções
                  </span>
                </div>
                <div className="product-grid">
                  {filtered(cat.id).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      catalog={c}
                      onSelect={choose}
                      economy={economy}
                    />
                  ))}
                </div>
              </section>
            ))}
          {c.bannerEnabled && (
            <section className="brand-banner">
              <Leaf size={35} />
              <div>
                <span className="eyebrow">
                  DA NOSSA COZINHA PARA SUA ROTINA
                </span>
                <h2>{c.banner}</h2>
                <p>Você escolhe. A gente prepara com carinho.</p>
              </div>
              <span className="banner-doodle" aria-hidden="true">
                ♡
              </span>
            </section>
          )}
        </div>
        <section className="how-it-works">
          <span className="eyebrow">SIMPLES ASSIM</span>
          <h2>Do cardápio para a sua rotina.</h2>
          <div>
            <article>
              <span>01</span>
              <h3>Escolha seus favoritos</h3>
              <p>Explore os sabores e monte sua sacola.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Continue no WhatsApp</h3>
              <p>Seu pedido vai preenchido. É só enviar.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Combine os detalhes</h3>
              <p>Pagamento e entrega direto com a equipe.</p>
            </article>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <a className="brand" href="#">
              <img src="/media/logo.webp" alt="" width="42" height="42" />
              <strong>{c.name}</strong>
            </a>
            <p>{c.tagline}</p>
          </div>
          <div>
            <strong>Estamos por aqui</strong>
            <p>{c.hours}</p>
            <p>{c.location}</p>
          </div>
          <div className="footer-social">
            {validPhone(c.whatsapp) && (
              <a
                href={`https://wa.me/${c.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void track("whatsapp_click")}
              >
                <MessageCircle size={19} />
                WhatsApp
              </a>
            )}
            {c.instagram && (
              <a
                href={`https://www.instagram.com/${c.instagram}/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void track("instagram_click")}
              >
                <Instagram size={19} />
                Instagram
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {c.name} · Feito para uma vida leve.
          </span>
          <button onClick={() => setInfo(true)}>
            Privacidade e preferências
          </button>
          {!preview && (
            <a href="/admin">
              <ShieldCheck size={14} />
              Área da proprietária
            </a>
          )}
        </div>
      </footer>
      {count > 0 && (
        <div className="floating-cart">
          <button onClick={() => setCartOpen(true)}>
            <span className="floating-count">
              <ShoppingBag size={19} />
              {count}
            </span>
            <strong>Ver minha sacola</strong>
            <b>{total === null ? "Revisar" : money(total)}</b>
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {selected && (
        <ProductDialog
          product={selected}
          catalog={c}
          economy={economy}
          initial={editLine}
          onClose={() => setSelected(null)}
          onAdd={add}
        />
      )}
      {cartOpen && (
        <CartDialog
          catalog={c}
          cart={cart}
          setCart={setCart}
          onClose={() => setCartOpen(false)}
          onEdit={(line) => {
            const p = c.products.find((p) => p.id === line.productId);
            if (p) choose(p, line);
          }}
          onReload={setCatalog}
          preview={preview}
        />
      )}
      {info && (
        <Modal title="Bom saber" onClose={() => setInfo(false)}>
          <div className="detail-content">
            <h3>Uma experiência mais leve</h3>
            <label className="switch-row">
              <span>
                <strong>Economia de dados</strong>
                <small>
                  Prefere fotos menores. Você ainda pode ampliar ao tocar.
                </small>
              </span>
              <input
                type="checkbox"
                checked={economy}
                onChange={(e) => {
                  setEconomy(e.target.checked);
                  storage.set("economy", e.target.checked);
                }}
              />
            </label>
            <h3>Horário e localização</h3>
            <p>{c.hours}</p>
            <p>{c.location}</p>
            <h3>Seu pedido, seus dados</h3>
            <p>
              A sacola fica salva neste navegador por até sete dias. Ao
              continuar, registramos os produtos e suas observações para que a
              equipe possa atender você. Não inclua dados sensíveis nas
              observações.
            </p>
            <p>
              O envio da mensagem acontece no WhatsApp e depende de você tocar
              em enviar. Pagamento e entrega são combinados na conversa.
            </p>
            <p>
              Contamos acessos aproximados e interações para melhorar o
              cardápio, sem publicidade comportamental. Dados de pedidos ficam
              acessíveis somente à equipe autorizada. Para solicitar a exclusão
              de um pedido, fale com a loja e informe sua referência.
            </p>
            <button
              className="button secondary"
              onClick={() => {
                setCart([]);
                storage.set("cart", null);
                setToast("Sacola apagada deste navegador.");
              }}
            >
              Apagar sacola deste navegador
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

