import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type Catalog,
  type ChoiceGroup,
  type Component,
  type Nutrition,
  type Option,
  type Product,
  type Variant,
} from "../../../../shared/domain";
import { Modal, Notice } from "../../../shared/ui";
import { FoodImage } from "../../catalog/products";
import { optimizeUpload } from "./images";

const uid = () => crypto.randomUUID();
const cents = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
function Price({
  value,
  onChange,
  label = "Preço (R$)",
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  const [text, setText] = useState((value / 100).toFixed(2).replace(".", ","));
  return (
    <label className="field">
      {label}
      <input
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = cents(text);
          onChange(n);
          setText((n / 100).toFixed(2).replace(".", ","));
        }}
      />
    </label>
  );
}
export default function ProductEditor({
  product,
  catalog: c,
  onSave,
  onClose,
}: {
  product: Product;
  catalog: Catalog;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState<Product>(structuredClone(product)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [nutrition, setNutrition] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const change = <K extends keyof Product>(key: K, value: Product[K]) =>
    setP((old) => ({ ...old, [key]: value }));
  const updateVariant = (id: string, patch: Partial<Variant>) =>
    setP((old) => ({
      ...old,
      variants: old.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  const updateGroup = (id: string, patch: Partial<ChoiceGroup>) =>
    setP((old) => ({
      ...old,
      groups: old.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      change("image", await optimizeUpload(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  function save() {
    setError("");
    if (!p.name.trim()) {
      setError("Informe o nome do produto.");
      return;
    }
    if (
      !p.variants.length ||
      p.variants.some(
        (v) => !v.name.trim() || v.price < 0 || !Number.isSafeInteger(v.price),
      )
    ) {
      setError("Preencha opções e preços válidos.");
      return;
    }
    onSave(p);
  }
  return (
    <Modal
      title={product.name ? `Editar ${product.name}` : "Novo produto ou combo"}
      wide
      onClose={onClose}
    >
      <div className="dialog-scroll editor-scroll">
        <div className="editor-grid">
          <div>
            <div className="upload-preview">
              <FoodImage
                image={p.image}
                name={p.name || "Novo produto"}
                large
              />
              {busy && <span className="upload-busy">Otimizando foto…</span>}
            </div>
            <input
              ref={input}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <button
              className="button secondary full"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <Upload size={17} />
              {p.image ? "Trocar foto" : "Adicionar foto real"}
            </button>
            <p className="small muted">
              JPEG, PNG ou WebP · até 15 MB. A foto será otimizada e os
              metadados removidos.
            </p>
            {p.image && (
              <button
                className="text-button danger"
                onClick={() => change("image", "")}
              >
                Remover foto do produto
              </button>
            )}
            <label className="switch-row">
              <span>Disponível para pedir</span>
              <input
                type="checkbox"
                checked={p.available}
                onChange={(e) => change("available", e.target.checked)}
              />
            </label>
            <label className="switch-row">
              <span>Destacar nos favoritos</span>
              <input
                type="checkbox"
                checked={p.featured}
                onChange={(e) => change("featured", e.target.checked)}
              />
            </label>
            <label className="switch-row">
              <span>Arquivado</span>
              <input
                type="checkbox"
                checked={p.archived}
                onChange={(e) => change("archived", e.target.checked)}
              />
            </label>
          </div>
          <div>
            <div className="form-grid">
              <label className="field">
                Nome
                <input
                  value={p.name}
                  maxLength={120}
                  onChange={(e) => change("name", e.target.value)}
                />
              </label>
              <label className="field">
                Categoria
                <select
                  value={p.categoryId}
                  onChange={(e) => change("categoryId", e.target.value)}
                >
                  {c.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Descrição
              <textarea
                value={p.description}
                maxLength={1500}
                rows={3}
                onChange={(e) => change("description", e.target.value)}
              />
            </label>
            <label className="field">
              Ingredientes
              <textarea
                value={p.ingredients}
                maxLength={1500}
                rows={2}
                onChange={(e) => change("ingredients", e.target.value)}
                placeholder="Informe os ingredientes reais do produto"
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Etiqueta opcional
                <input
                  value={p.badge}
                  maxLength={50}
                  onChange={(e) => change("badge", e.target.value)}
                  placeholder="Ex.: Feito na hora"
                />
              </label>
              <label className="field">
                Tipo
                <select
                  value={p.kind}
                  onChange={(e) =>
                    setP({
                      ...p,
                      kind: e.target.value as Product["kind"],
                      components:
                        e.target.value === "fixed" ? p.components : [],
                      groups: p.groups,
                    })
                  }
                >
                  <option value="product">Produto avulso</option>
                  <option value="fixed">Combo fixo</option>
                  <option value="builder">Combo montável</option>
                </select>
              </label>
            </div>
            <div className="editor-section-heading">
              <h3>
                {p.kind === "product"
                  ? "Tamanhos, sabores e preços"
                  : "Opções e preço-base do combo"}
              </h3>
              <button
                className="text-button"
                onClick={() =>
                  change("variants", [
                    ...p.variants,
                    { id: uid(), name: "Nova opção", price: 0 },
                  ])
                }
              >
                <Plus size={15} />
                Opção
              </button>
            </div>
            {p.variants.map((v, i) => (
              <div className="variant-editor" key={v.id}>
                <label className="field">
                  Nome da opção
                  <input
                    value={v.name}
                    maxLength={100}
                    onChange={(e) =>
                      updateVariant(v.id, { name: e.target.value })
                    }
                  />
                </label>
                <Price
                  value={v.price}
                  onChange={(price) => updateVariant(v.id, { price })}
                />
                <button
                  className="icon-button danger"
                  aria-label={`Remover opção ${i + 1}`}
                  disabled={p.variants.length === 1}
                  onClick={() =>
                    change(
                      "variants",
                      p.variants.filter((x) => x.id !== v.id),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="text-button nutrition-edit-button"
                  onClick={() => setNutrition(nutrition === v.id ? "" : v.id)}
                >
                  {nutrition === v.id ? "Fechar tabela" : "Tabela nutricional"}
                </button>
                {nutrition === v.id && (
                  <div className="nutrition-editor">
                    <p className="small muted">
                      Valores da opção selecionada, sem adicionais. Campos
                      vazios serão mostrados como não informados.
                    </p>
                    {(
                      [
                        ["serving", "Porção (ex.: 300 g)"],
                        ["energy", "Valor energético (kcal)"],
                        ["carbs", "Carboidratos (g)"],
                        ["protein", "Proteínas (g)"],
                        ["fat", "Gorduras totais (g)"],
                        ["saturated", "Gorduras saturadas (g)"],
                        ["fiber", "Fibras (g)"],
                        ["sodium", "Sódio (mg)"],
                      ] as [keyof Nutrition, string][]
                    ).map(([key, label]) => (
                      <label className="field" key={key}>
                        {label}
                        <input
                          value={v.nutrition?.[key] || ""}
                          maxLength={100}
                          onChange={(e) =>
                            updateVariant(v.id, {
                              nutrition: {
                                serving: "",
                                ...v.nutrition,
                                [key]: e.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {p.kind === "fixed" && (
              <section className="editor-section">
                <div className="editor-section-heading">
                  <h3>Composição fixa</h3>
                  <button
                    className="text-button"
                    onClick={() => {
                      const target = c.products.find(
                        (x) =>
                          x.kind === "product" && !x.archived && x.id !== p.id,
                      );
                      if (target)
                        change("components", [
                          ...p.components,
                          {
                            productId: target.id,
                            variantId: target.variants[0].id,
                            quantity: 1,
                          },
                        ]);
                      else setError("Cadastre primeiro um produto avulso.");
                    }}
                  >
                    <Plus size={15} />
                    Componente
                  </button>
                </div>
                {p.components.map((item, i) => (
                  <div className="component-editor" key={i}>
                    <ComponentSelect
                      catalog={c}
                      exclude={p.id}
                      value={item}
                      onChange={(v) =>
                        change(
                          "components",
                          p.components.map((x, j) =>
                            i === j ? { ...x, ...v } : x,
                          ),
                        )
                      }
                    />
                    <label className="field">
                      Quantidade
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={item.quantity}
                        onChange={(e) =>
                          change(
                            "components",
                            p.components.map((x, j) =>
                              i === j ? { ...x, quantity: +e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      className="icon-button danger"
                      aria-label="Remover componente"
                      onClick={() =>
                        change(
                          "components",
                          p.components.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </section>
            )}
            <section className="editor-section">
              <div className="editor-section-heading">
                <h3>
                  {p.kind === "builder"
                    ? "Escolhas do combo e adicionais"
                    : "Adicionais opcionais ou obrigatórios"}
                </h3>
                <button
                  className="text-button"
                  onClick={() =>
                    change("groups", [
                      ...p.groups,
                      {
                        id: uid(),
                        name:
                          p.kind === "builder"
                            ? "Escolha os sabores"
                            : "Adicionais",
                        min: p.kind === "builder" ? 1 : 0,
                        max: 5,
                        repeat: true,
                        options: [],
                      },
                    ])
                  }
                >
                  <Plus size={15} />
                  Grupo
                </button>
              </div>
              {p.groups.map((g) => (
                <GroupEditor
                  key={g.id}
                  group={g}
                  catalog={c}
                  productId={p.id}
                  update={(patch) => updateGroup(g.id, patch)}
                  remove={() =>
                    change(
                      "groups",
                      p.groups.filter((x) => x.id !== g.id),
                    )
                  }
                />
              ))}
            </section>
          </div>
        </div>
        {error && <Notice error>{error}</Notice>}
      </div>
      <div className="modal-footer editor-footer">
        <span className="small muted">
          Salvar adiciona ao rascunho. Publique para atualizar o cardápio.
        </span>
        <button className="button primary" disabled={busy} onClick={save}>
          Salvar produto no rascunho
        </button>
      </div>
    </Modal>
  );
}
function ComponentSelect({
  catalog: c,
  exclude,
  value,
  onChange,
}: {
  catalog: Catalog;
  exclude: string;
  value: Omit<Component, "quantity">;
  onChange: (c: Omit<Component, "quantity">) => void;
}) {
  const products = c.products.filter(
      (p) => p.kind === "product" && p.id !== exclude,
    ),
    target = products.find((p) => p.id === value.productId);
  return (
    <>
      <label className="field">
        Produto
        <select
          value={value.productId}
          onChange={(e) => {
            const p = products.find((p) => p.id === e.target.value)!;
            onChange({ productId: p.id, variantId: p.variants[0].id });
          }}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.archived ? " (arquivado)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Opção
        <select
          value={value.variantId}
          onChange={(e) => onChange({ ...value, variantId: e.target.value })}
        >
          {target?.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
function GroupEditor({
  group: g,
  catalog: c,
  productId,
  update,
  remove,
}: {
  group: ChoiceGroup;
  catalog: Catalog;
  productId: string;
  update: (g: Partial<ChoiceGroup>) => void;
  remove: () => void;
}) {
  const updateOption = (id: string, patch: Partial<Option>) =>
    update({
      options: g.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  return (
    <div className="group-editor">
      <div className="group-top">
        <label className="field">
          Nome do grupo
          <input
            value={g.name}
            maxLength={100}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <button
          className="icon-button danger"
          aria-label="Remover grupo"
          onClick={remove}
        >
          <Trash2 size={17} />
        </button>
      </div>
      <div className="form-grid three">
        <label className="field">
          Mínimo
          <input
            type="number"
            min={0}
            max={50}
            value={g.min}
            onChange={(e) => update({ min: +e.target.value })}
          />
        </label>
        <label className="field">
          Máximo
          <input
            type="number"
            min={1}
            max={50}
            value={g.max}
            onChange={(e) => update({ max: +e.target.value })}
          />
        </label>
        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={g.repeat}
            onChange={(e) => update({ repeat: e.target.checked })}
          />
          Permitir repetição
        </label>
      </div>
      {g.options.map((o) => (
        <div className="group-option" key={o.id}>
          <div className="form-grid">
            <label className="field">
              Nome da escolha
              <input
                value={o.name}
                maxLength={120}
                onChange={(e) => updateOption(o.id, { name: e.target.value })}
              />
            </label>
            <Price
              value={o.price}
              label="Acréscimo (R$)"
              onChange={(price) => updateOption(o.id, { price })}
            />
          </div>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={!!o.component}
              onChange={(e) => {
                const target = c.products.find(
                  (p) =>
                    p.kind === "product" && !p.archived && p.id !== productId,
                );
                updateOption(o.id, {
                  component:
                    e.target.checked && target
                      ? {
                          productId: target.id,
                          variantId: target.variants[0].id,
                        }
                      : undefined,
                });
              }}
            />
            Vincular a um produto do cardápio
          </label>
          {o.component && (
            <div className="form-grid">
              <ComponentSelect
                catalog={c}
                exclude={productId}
                value={o.component}
                onChange={(component) => updateOption(o.id, { component })}
              />
            </div>
          )}
          <button
            className="text-button danger"
            onClick={() =>
              update({ options: g.options.filter((x) => x.id !== o.id) })
            }
          >
            Remover escolha
          </button>
        </div>
      ))}
      <button
        className="button secondary compact"
        onClick={() =>
          update({
            options: [
              ...g.options,
              { id: uid(), name: "Nova escolha", price: 0 },
            ],
          })
        }
      >
        <Plus size={15} />
        Adicionar escolha
      </button>
    </div>
  );
}
