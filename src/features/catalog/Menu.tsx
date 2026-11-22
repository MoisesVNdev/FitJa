import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Info, Instagram, Leaf, MessageCircle, Search, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { money, normalize, quoteCart, startingOffer, validPhone, type CartLine, type Catalog, type Product } from "../../../shared/domain";
import { demo, loadCatalog, storage, backendConfigured, track } from "../../shared/api/catalog";
import { Modal } from "../../shared/ui";
import { FeaturedProduct, ProductCard, ProductDialog } from "./ProductViews";

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
    [browseCategory, setBrowseCategory] = useState<string | null>(),
    [searchCategory, setSearchCategory] = useState<string | null>(null),
    [selected, setSelected] = useState<Product | null>(null),
    [editLine, setEditLine] = useState<CartLine | undefined>();
  const [cartOpen, setCartOpen] = useState(false),
    [toast, setToast] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const productReturn = useRef<{ opener: HTMLButtonElement; scrollY: number } | null>(null);
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
  useEffect(() => {
    if (selected || !productReturn.current) return;
    const { opener, scrollY } = productReturn.current;
    productReturn.current = null;
    if (opener.isConnected) {
      opener.focus({ preventScroll: true });
      if (!preview && window.scrollY !== scrollY) {
        window.scrollTo({ top: scrollY, behavior: "instant" });
      }
    }
  }, [selected, preview]);
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
    featured = c.products.find(
      (p) => p.featured && startingOffer(c, p),
    );
  let total: number | null = null;
  try {
    if (cart.length) total = quoteCart(c, cart).total;
  } catch {
    /* Cart review identifies stale products. */
  }
  const term = normalize(query.trim());
  const sections = c.categories
    .map((category) => ({
      category,
      products: c.products.filter((p) => p.categoryId === category.id && !p.archived),
    }))
    .filter(({ products }) => products.length > 0);
  const requestedCategory = term
    ? searchCategory
    : browseCategory === undefined ? "marmitas" : browseCategory;
  const activeCategory = sections.find(({ category }) => category.id === requestedCategory);
  const active = activeCategory?.category.id ?? null;
  const visibleSections = sections
    .filter(({ category }) => active === null || category.id === active)
    .map(({ category, products }) => ({
      category,
      products: term
        ? products.filter((p) => normalize(
          [p.name, p.description, p.ingredients, ...p.variants.map((v) => v.name)].join(" "),
        ).includes(term))
        : products,
    }))
    .filter(({ products }) => products.length > 0);
  const resultCount = visibleSections.reduce((sum, { products }) => sum + products.length, 0);
  function choose(p: Product, line?: CartLine) {
    setSelected(p);
    setEditLine(line);
    if (!preview) void track("product_view", p.id);
  }
  function chooseFromCard(product: Product, opener: HTMLButtonElement) {
    productReturn.current = { opener, scrollY: window.scrollY };
    choose(product);
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
  function chooseCategory(id: string | null) {
    if (term) setSearchCategory(id);
    else setBrowseCategory(id);
  }
  function clearSearch() {
    setQuery("");
    setSearchCategory(null);
    searchInput.current?.focus();
  }
  const contactLinks = (
    <>
      {validPhone(c.whatsapp) && (
        <a
          href={`https://wa.me/${c.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => { if (preview) event.preventDefault(); else void track("whatsapp_click"); }}
        >
          <MessageCircle size={19} aria-hidden="true" />
          WhatsApp
        </a>
      )}
      {c.instagram && (
        <a
          href={`https://www.instagram.com/${c.instagram}/`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => { if (preview) event.preventDefault(); else void track("instagram_click"); }}
        >
          <Instagram size={19} aria-hidden="true" />
          Instagram
        </a>
      )}
    </>
  );
  return (
    <div className={`storefront ${preview ? "preview-store" : ""} ${count ? "has-cart" : ""}`}>
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
      {!preview && (
        <a className="skip-link" href="#menu-start">Ir para a busca do cardápio</a>
      )}
      <header className="site-header">
        <div className="brand">
          <img src="/media/logo.webp" width="52" height="52" alt="" />
          <h1 translate="no">{c.name}</h1>
        </div>
        <div className="header-actions">
          <button
            className="icon-button store-info"
            type="button"
            onClick={() => setInfo(true)}
            aria-label="Informações da loja e economia de dados"
          >
            <Info size={21} aria-hidden="true" />
          </button>
          <button
            className="header-cart"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir sacola com ${count} ${count === 1 ? "item" : "itens"}`}
          >
            <ShoppingBag size={19} aria-hidden="true" />
            <span>Sacola</span>
            {count > 0 && <b>{count}</b>}
          </button>
        </div>
      </header>
      <main>
        <div className="menu-shell">
          {!term && featured && (
            <FeaturedProduct product={featured} catalog={c} onSelect={chooseFromCard} />
          )}
          <div className="search-box">
            <Search size={20} aria-hidden="true" />
            <input
              id="menu-start"
              ref={searchInput}
              name="query"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                if (!value.trim()) setSearchCategory(null);
              }}
              placeholder="Buscar produtos…"
              aria-label="Buscar produtos"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Limpar busca"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <nav
            className="category-nav"
            aria-label={term ? "Filtrar resultados por categoria" : "Categorias do cardápio"}
          >
            <button
              type="button"
              className={active === null ? "active" : ""}
              aria-pressed={active === null}
              onClick={() => chooseCategory(null)}
            >
              Todas as categorias
            </button>
            {sections.map(({ category: cat }) => (
              <button
                key={cat.id}
                type="button"
                className={active === cat.id ? "active" : ""}
                aria-pressed={active === cat.id}
                onClick={() => chooseCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </nav>
          {term && (
            <p className="search-summary" role="status">
              {resultCount === 0
                ? activeCategory
                  ? `Nenhum resultado em ${activeCategory.category.name}.`
                  : "Nenhum produto encontrado."
                : `${resultCount} ${resultCount === 1 ? "produto encontrado" : "produtos encontrados"}`}
            </p>
          )}
          {visibleSections.length === 0 && (
            <div className="empty search-empty">
              <p>{term ? "Tente outro termo ou limpe a busca." : "Ainda não há produtos no cardápio."}</p>
              {term && (
                <div>
                  <button type="button" className="button secondary" onClick={clearSearch}>
                    Limpar busca
                  </button>
                  {activeCategory && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setSearchCategory(null);
                        searchInput.current?.focus();
                      }}
                    >
                      Buscar em todas as categorias
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {visibleSections.map(({ category: cat, products }) => (
            <section
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
                <h2>{cat.name}</h2>
                <span className="category-count">
                  {products.length} {products.length === 1 ? "produto" : "produtos"}
                </span>
              </div>
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    catalog={c}
                    categoryName={term ? cat.name : undefined}
                    onSelect={chooseFromCard}
                    economy={economy}
                  />
                ))}
              </div>
            </section>
          ))}
          {c.bannerEnabled && (
            <section className="brand-banner">
              <Leaf size={35} aria-hidden="true" />
              <div>
                <h2>{c.banner}</h2>
              </div>
            </section>
          )}
        </div>
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
          <div className="footer-social">{contactLinks}</div>
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
              <ShoppingBag size={19} aria-hidden="true" />
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
        <Modal title="Informações da loja" onClose={() => setInfo(false)}>
          <div className="detail-content dialog-scroll">
            <h3>Horário e localização</h3>
            <p>{c.hours}</p>
            <p>{c.location}</p>
            <div className="footer-social">{contactLinks}</div>
            <h3>Preferências</h3>
            <label className="switch-row">
              <span>
                <strong>Economia de dados</strong>
                <small>
                  Prefere fotos menores. A ampliação aparece quando a foto tem resolução suficiente.
                </small>
              </span>
              <input
                type="checkbox"
                checked={economy}
                onChange={(e) => {
                  setEconomy(e.target.checked);
                    if (!preview) storage.set("economy", e.target.checked);
                }}
              />
            </label>
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
                if (!preview) storage.set("cart", null);
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
