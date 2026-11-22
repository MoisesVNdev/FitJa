import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Plus, Trash2, Undo2 } from "lucide-react";
import { validateCatalog, type Catalog } from "../../../../shared/domain";
import { initialCatalog } from "../../../data";
import { Notice } from "../../../shared/ui";

export default function Appearance({
  catalog: c,
  change,
  preview,
}: {
  catalog: Catalog;
  change: (c: Catalog) => void;
  preview: () => void;
}) {
  function theme(key: keyof Catalog["theme"], value: string | number) {
    change({ ...c, theme: { ...c.theme, [key]: value } });
  }
  function move(i: number, delta: number) {
    const cats = [...c.categories];
    [cats[i], cats[i + delta]] = [cats[i + delta], cats[i]];
    change({ ...c, categories: cats });
  }
  const [problem, setProblem] = useState("");
  useEffect(() => {
    try {
      validateCatalog(c);
      setProblem("");
    } catch (e) {
      setProblem((e as Error).message);
    }
  }, [c]);
  return (
    <>
      <div className="appearance-grid">
        <section className="admin-card">
          <h2>Sua identidade</h2>
          <p className="muted">
            As alterações ficam no rascunho até você publicar.
          </p>
          <div className="color-grid">
            {(
              [
                ["primary", "Cor principal"],
                ["primaryText", "Texto dos botões"],
                ["background", "Fundo da página"],
                ["surface", "Fundo dos cartões"],
                ["text", "Texto principal"],
              ] as const
            ).map(([key, label]) => (
              <label className="color-field" key={key}>
                <span>{label}</span>
                <div>
                  <input
                    type="color"
                    value={c.theme[key]}
                    onChange={(e) => theme(key, e.target.value)}
                  />
                  <code>{c.theme[key].toUpperCase()}</code>
                </div>
              </label>
            ))}
          </div>
          <label className="field">
            Fonte
            <select
              value={c.theme.font}
              onChange={(e) => theme("font", e.target.value)}
            >
              <option>Nunito Sans</option>
              <option>DM Sans</option>
              <option>Manrope</option>
            </select>
          </label>
          <label className="field">
            Tamanho do texto · {Math.round(c.theme.scale * 100)}%
            <input
              type="range"
              min={1}
              max={1.25}
              step={0.05}
              value={c.theme.scale}
              onChange={(e) => theme("scale", +e.target.value)}
            />
            <small>A escala mantém os textos legíveis em qualquer tela.</small>
          </label>
          {problem && <Notice error>{problem}</Notice>}
          <button
            className="button secondary"
            onClick={() => change({ ...c, theme: initialCatalog.theme })}
          >
            <Undo2 size={16} />
            Restaurar cores e fonte da marca
          </button>
        </section>
        <section className="admin-card appearance-preview">
          <h2>Prévia do cardápio</h2>
          <p>Confira as fotos, os destaques e as categorias com as cores e a fonte do rascunho.</p>
          <button className="button secondary" type="button" onClick={preview}>
            <Eye size={18} aria-hidden="true" />
            Conferir no celular
          </button>
        </section>
      </div>
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <h2>Categorias e seções</h2>
            <p>Escolha a ordem, o nome e as cores de cada parte do cardápio.</p>
          </div>
          <button
            className="button secondary compact"
            onClick={() =>
              change({
                ...c,
                categories: [
                  ...c.categories,
                  {
                    id: crypto.randomUUID(),
                    name: "Nova categoria",
                    color: "#F1F5EC",
                    textColor: "#24382B",
                  },
                ],
              })
            }
          >
            <Plus size={16} />
            Categoria
          </button>
        </div>
        {c.categories.map((cat, i) => (
          <div className="category-editor" key={cat.id}>
            <input
              aria-label={`Nome da categoria ${i + 1}`}
              value={cat.name}
              maxLength={60}
              onChange={(e) =>
                change({
                  ...c,
                  categories: c.categories.map((x) =>
                    x.id === cat.id ? { ...x, name: e.target.value } : x,
                  ),
                })
              }
            />
            <label>
              Fundo
              <input
                type="color"
                value={cat.color}
                onChange={(e) =>
                  change({
                    ...c,
                    categories: c.categories.map((x) =>
                      x.id === cat.id ? { ...x, color: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <label>
              Texto
              <input
                type="color"
                value={cat.textColor}
                onChange={(e) =>
                  change({
                    ...c,
                    categories: c.categories.map((x) =>
                      x.id === cat.id ? { ...x, textColor: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <button
              className="icon-button"
              aria-label={`Subir ${cat.name}`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp size={17} />
            </button>
            <button
              className="icon-button"
              aria-label={`Descer ${cat.name}`}
              disabled={i === c.categories.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown size={17} />
            </button>
            <button
              className="icon-button danger"
              aria-label={`Excluir ${cat.name}`}
              disabled={
                c.products.some((p) => p.categoryId === cat.id) ||
                c.categories.length === 1
              }
              title="Só é possível excluir categorias sem produtos, inclusive arquivados"
              onClick={() =>
                change({
                  ...c,
                  categories: c.categories.filter((x) => x.id !== cat.id),
                })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </section>
    </>
  );
}

