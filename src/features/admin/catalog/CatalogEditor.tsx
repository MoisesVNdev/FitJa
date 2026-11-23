import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Star, Trash2, Undo2 } from "lucide-react";
import { available, money, normalize, variantBasePrice, type Catalog, type Product } from "../../../../shared/domain";
import { newProduct } from "../../../data";
import ProductEditor from "./ProductEditor";

import { Empty } from "../ui";

function catalogPrice(product: Product) {
  const prices = product.variants.flatMap((variant) => variantBasePrice(product, variant) ?? []);
  return prices.length ? money(Math.min(...prices)) : "Sem preço";
}

export default function CatalogEditor({
  catalog: c,
  change,
  outOfStockOnly = false,
}: {
  catalog: Catalog;
  change: (c: Catalog) => void;
  outOfStockOnly?: boolean;
}) {
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState<Product | null>(null),
    [category, setCategory] = useState("all"),
    [stock, setStock] = useState(outOfStockOnly ? "sold-out" : "all");
  const firstFeatured = c.products.find((p) => p.featured && available(c, p));
  const items = c.products.filter(
    (p) =>
      (category === "all" || p.categoryId === category) &&
      (stock === "all" || (stock === "archived" ? p.archived : !p.archived && !available(c, p))) &&
      normalize(p.name).includes(normalize(search)),
  );
  function moveProduct(id: string, delta: number) {
    const products = [...c.products],
      index = products.findIndex((p) => p.id === id),
      next = index + delta;
    if (index < 0 || next < 0 || next >= products.length) return;
    [products[index], products[next]] = [products[next], products[index]];
    change({ ...c, products });
  }
  function save(p: Product) {
    change({
      ...c,
      products: c.products.some((x) => x.id === p.id)
        ? c.products.map((x) => (x.id === p.id ? p : x))
        : [...c.products, p],
    });
    setEditing(null);
  }
  function prioritize(p: Product) {
    if (!firstFeatured || firstFeatured.id === p.id) return;
    const products = c.products.filter((product) => product.id !== p.id);
    products.splice(products.indexOf(firstFeatured), 0, p);
    change({ ...c, products });
  }
  return (
    <>
      <div className="section-toolbar">
        <div className="toolbar-inputs">
          <input
            name="catalog-search"
            type="search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no seu cardápio"
            aria-label="Buscar produtos no painel"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar categoria"
          >
            <option value="all">Todas as categorias</option>
            {c.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select aria-label="Filtrar disponibilidade" value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="all">Todos os itens</option>
            <option value="sold-out">Itens esgotados</option>
            <option value="archived">Itens arquivados</option>
          </select>
        </div>
        <button
          className="button primary"
          onClick={() => setEditing(newProduct(c.categories[0].id))}
        >
          <Plus size={18} />
          Novo produto ou combo
        </button>
      </div>
      <div className="admin-card table-scroll">
        <table className="data-table product-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço inicial</th>
              <th>Disponibilidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="product-cell">
                    {p.image && (
                      <img
                        src={`${p.image.startsWith("/media/") && !p.image.endsWith(".webp") ? p.image + "-320.webp" : p.image}`}
                        alt=""
                        width="44"
                        height="44"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <strong>{p.name || "Novo produto"}</strong>
                      <small>
                        {p.archived
                          ? "Arquivado"
                          : p.kind === "product"
                            ? `${p.variants.length} opções`
                            : p.kind === "fixed"
                              ? "Combo fixo"
                              : "Combo montável"}
                      </small>
                      {p.id === firstFeatured?.id && <small className="featured-label">Primeiro destaque</small>}
                      {p.featured && p.id !== firstFeatured?.id && <small>Na vitrine</small>}
                    </div>
                  </div>
                </td>
                <td>
                  {c.categories.find((cat) => cat.id === p.categoryId)?.name}
                </td>
                <td>{catalogPrice(p)}</td>
                <td>
                  <button
                    className={`availability ${available(c, p) ? "yes" : ""}`}
                    aria-label={p.archived ? `${p.name} arquivado` : `Marcar ${p.name} como ${p.available ? "esgotado" : "disponível"} no rascunho`}
                    onClick={() => save({ ...p, available: !p.available })}
                    disabled={p.archived}
                  >
                    {p.archived
                      ? "Arquivado"
                      : p.available
                        ? available(c, p) ? "Disponível" : "Opções indisponíveis"
                        : "Esgotado"}
                  </button>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={"Subir " + p.name}
                      disabled={c.products.indexOf(p) === 0}
                      onClick={() => moveProduct(p.id, -1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Descer " + p.name}
                      disabled={c.products.indexOf(p) === c.products.length - 1}
                      onClick={() => moveProduct(p.id, 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setEditing(structuredClone(p))}
                    >
                      Editar
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Duplicar ${p.name}`}
                      onClick={() =>
                        setEditing({
                          ...structuredClone(p),
                          id: crypto.randomUUID(),
                          name: `${p.name} (cópia)`,
                        })
                      }
                    >
                      <Copy size={16} />
                    </button>
                    {p.featured && available(c, p) && firstFeatured?.id !== p.id && (
                      <button className="icon-button" aria-label={`Priorizar ${p.name} na vitrine`} onClick={() => prioritize(p)}>
                        <Star size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      aria-label={
                        p.archived
                          ? `Restaurar ${p.name}`
                          : `Arquivar ${p.name}`
                      }
                      onClick={() => save({ ...p, archived: !p.archived })}
                    >
                      {p.archived ? <Undo2 size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <Empty
            title="Nenhum produto por aqui"
            text="Cadastre um produto ou tente outra busca."
          />
        )}
      </div>
      {editing && (
        <ProductEditor
          product={editing}
          catalog={c}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

