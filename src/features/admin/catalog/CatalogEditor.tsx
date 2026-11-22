import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2, Undo2 } from "lucide-react";
import { available, money, normalize, type Catalog, type Product } from "../../../../shared/domain";
import { newProduct } from "../../../data";
import ProductEditor from "./ProductEditor";

import { Empty } from "../ui";
export default function CatalogEditor({
  catalog: c,
  change,
}: {
  catalog: Catalog;
  change: (c: Catalog) => void;
}) {
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState<Product | null>(null),
    [category, setCategory] = useState("all");
  const items = c.products.filter(
    (p) =>
      (category === "all" || p.categoryId === category) &&
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
  return (
    <>
      <div className="section-toolbar">
        <div className="toolbar-inputs">
          <input
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
                    </div>
                  </div>
                </td>
                <td>
                  {c.categories.find((cat) => cat.id === p.categoryId)?.name}
                </td>
                <td>{money(Math.min(...p.variants.map((v) => v.price)))}</td>
                <td>
                  <button
                    className={`availability ${p.available && !p.archived ? "yes" : ""}`}
                    onClick={() => save({ ...p, available: !p.available })}
                    disabled={p.archived}
                  >
                    {p.archived
                      ? "Arquivado"
                      : p.available
                        ? "Disponível"
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
      <div className="info-box">
        <strong>Sobre o conteúdo inicial</strong>
        <p>
          Produtos e preços foram transcritos das artes em Docs. Fotos são
          recortes pequenos dessas referências; substitua pelas fotos originais
          para melhor definição. Marmitas avulsas e salada aguardam preços e
          estão arquivadas. Combos e adicionais devem ser cadastrados com as
          regras reais da loja.
        </p>
      </div>
    </>
  );
}

