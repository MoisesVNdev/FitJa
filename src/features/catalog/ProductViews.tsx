import { useEffect, useState } from "react";
import { ChevronDown, Leaf, Plus, ShoppingBag, ZoomIn } from "lucide-react";
import { available, componentAvailable, money, quoteCart, type CartLine, type Catalog, type Product, type Selection } from "../../../shared/domain";
import { Modal, Quantity } from "../../shared/ui";

export function FoodImage({
  image,
  name,
  large = false,
  economy = false,
  eager = false,
}: {
  image: string;
  name: string;
  large?: boolean;
  economy?: boolean;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  if (!image || failed)
    return (
      <div
        className="image-placeholder"
        role="img"
        aria-label={`${name}: foto ainda não cadastrada`}
      >
        <Leaf />
        <span>Feito com carinho</span>
      </div>
    );
  const local = image.startsWith("/media/") && !/\.[a-z\d]+$/i.test(image);
  const uploaded = /^https:.*\/640\.webp$/.test(image);
  return (
    <picture>
      {local && (
        <source
          type="image/webp"
          srcSet={
            economy
              ? `${image}-320.webp`
              : `${image}-320.webp 320w, ${image}-640.webp 640w, ${image}-1280.webp 1280w`
          }
          sizes={
            large
              ? "(max-width: 600px) 100vw, 550px"
              : "(max-width: 600px) 44vw, 280px"
          }
        />
      )}
      {uploaded && (
        <source
          type="image/webp"
          srcSet={
            economy
              ? image.replace("/640.webp", "/320.webp")
              : `${image.replace("/640.webp", "/320.webp")} 320w, ${image} 640w, ${image.replace("/640.webp", "/1280.webp")} 1280w`
          }
          sizes={
            large
              ? "(max-width: 600px) 100vw, 550px"
              : "(max-width: 600px) 44vw, 280px"
          }
        />
      )}
      <img
        src={
          local
            ? `${image}.jpg`
            : uploaded
              ? image.replace("/640.webp", "/fallback.jpg")
              : image
        }
        alt={name}
        width={large ? 640 : 320}
        height={large ? 480 : 320}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
export function ProductCard({
  product: p,
  catalog,
  economy,
  onSelect,
  eager = false,
}: {
  product: Product;
  catalog: Catalog;
  economy: boolean;
  onSelect: (p: Product) => void;
  eager?: boolean;
}) {
  const ready = available(catalog, p),
    price = Math.min(...p.variants.map((v) => v.price));
  return (
    <article className={`product-card ${ready ? "" : "sold-out"}`}>
      <button
        className="product-photo"
        onClick={() => onSelect(p)}
        aria-label={`Ver ${p.name}`}
      >
        <FoodImage
          image={p.image}
          name={p.name}
          economy={economy}
          eager={eager}
        />
        {p.badge && <span className="product-badge">{p.badge}</span>}
        {!ready && <span className="out-badge">Esgotado</span>}
      </button>
      <div className="product-copy">
        <button className="product-title" onClick={() => onSelect(p)}>
          {p.name}
        </button>
        <p>{p.description}</p>
        <div className="product-bottom">
          <div>
            {p.variants.length > 1 && <small>A partir de</small>}
            <strong>{money(price)}</strong>
          </div>
          <button
            className="add-button"
            aria-label={`Escolher ${p.name}`}
            onClick={() => onSelect(p)}
            disabled={!ready}
          >
            <Plus size={21} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function ProductDialog({
  product: p,
  catalog: c,
  economy,
  initial,
  onClose,
  onAdd,
}: {
  product: Product;
  catalog: Catalog;
  economy: boolean;
  initial?: CartLine;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const [variantId, setVariant] = useState(
      initial?.variantId || p.variants[0]?.id || "",
    ),
    [quantity, setQuantity] = useState(initial?.quantity || 1),
    [selections, setSelections] = useState<Selection[]>(
      initial?.selections || [],
    ),
    [zoom, setZoom] = useState(false);
  const variant = p.variants.find((v) => v.id === variantId),
    line = {
      key: initial?.key || "preview",
      productId: p.id,
      variantId,
      quantity,
      selections,
    };
  let price: number | null = null,
    problem = "";
  try {
    price = quoteCart(c, [line]).total;
  } catch (e) {
    problem = (e as Error).message;
  }
  function select(groupId: string, optionId: string, n: number) {
    setSelections((old) => [
      ...old.filter((s) => s.groupId !== groupId || s.optionId !== optionId),
      ...(n ? [{ groupId, optionId, quantity: n }] : []),
    ]);
  }
  const nutrition = variant?.nutrition;
  const rows = [
    ["energy", "Valor energético", "kcal"],
    ["carbs", "Carboidratos", "g"],
    ["protein", "Proteínas", "g"],
    ["fat", "Gorduras totais", "g"],
    ["saturated", "Gorduras saturadas", "g"],
    ["fiber", "Fibras alimentares", "g"],
    ["sodium", "Sódio", "mg"],
  ];
  return (
    <Modal title={p.name} onClose={onClose}>
      <div className="dialog-scroll">
        <button
          className={`detail-photo ${zoom ? "zoomed" : ""}`}
          onClick={() => setZoom(!zoom)}
          aria-label={zoom ? "Reduzir foto" : "Ampliar foto"}
        >
          <FoodImage
            image={p.image}
            name={p.name}
            large
            economy={economy && !zoom}
            eager
          />
          <span>
            <ZoomIn size={16} />
            {zoom ? "Reduzir" : "Ver de perto"}
          </span>
        </button>
        <div className="detail-content">
          <span className="eyebrow">FEITO PARA O SEU DIA</span>
          <p>{p.description}</p>
          {p.ingredients && (
            <p className="ingredients">
              <strong>Ingredientes:</strong> {p.ingredients}
            </p>
          )}
          <fieldset className="choice-fieldset">
            <legend>
              Escolha sua opção <span>Obrigatório</span>
            </legend>
            {p.variants.map((v) => (
              <label
                className={`option-row ${v.id === variantId ? "selected" : ""}`}
                key={v.id}
              >
                <span>
                  <input
                    type="radio"
                    name="variant"
                    checked={v.id === variantId}
                    onChange={() => setVariant(v.id)}
                  />
                  {v.name}
                </span>
                <strong>{money(v.price)}</strong>
              </label>
            ))}
          </fieldset>
          {p.groups.map((g) => {
            const count = selections
              .filter((s) => s.groupId === g.id)
              .reduce((n, s) => n + s.quantity, 0);
            return (
              <fieldset className="choice-fieldset" key={g.id}>
                <legend>
                  {g.name}
                  <span>
                    {g.min > 0 ? "Obrigatório" : "Opcional"} · {count}/{g.max}
                  </span>
                </legend>
                <p className="muted">
                  Escolha {g.min === g.max ? g.max : `de ${g.min} a ${g.max}`}{" "}
                  {g.repeat ? "unidades" : "opções"}.
                </p>
                {g.options.map((o) => {
                  const n =
                      selections.find(
                        (s) => s.groupId === g.id && s.optionId === o.id,
                      )?.quantity || 0,
                    ready = !o.component || componentAvailable(c, o.component);
                  return (
                    <div className="option-row" key={o.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={n > 0}
                          disabled={!ready || (!n && count >= g.max)}
                          onChange={(e) =>
                            select(g.id, o.id, e.target.checked ? 1 : 0)
                          }
                        />
                        <span>
                          {o.name}
                          {!ready && <small> · Esgotado</small>}
                          {o.price > 0 && <small> + {money(o.price)}</small>}
                        </span>
                      </label>
                      {g.repeat && n > 0 && (
                        <Quantity
                          label={o.name}
                          value={n}
                          min={0}
                          max={n + g.max - count}
                          set={(v) => select(g.id, o.id, v)}
                        />
                      )}
                    </div>
                  );
                })}
              </fieldset>
            );
          })}
          {p.kind === "fixed" && (
            <div className="info-box">
              <strong>Este combo inclui</strong>
              {p.components.map((x, i) => (
                <p key={i}>
                  {x.quantity}×{" "}
                  {c.products.find((y) => y.id === x.productId)?.name} ·{" "}
                  {
                    c.products
                      .find((y) => y.id === x.productId)
                      ?.variants.find((v) => v.id === x.variantId)?.name
                  }
                </p>
              ))}
            </div>
          )}
          <details className="nutrition">
            <summary>
              Informações nutricionais <ChevronDown size={18} />
            </summary>
            {nutrition &&
            rows.some(([k]) => nutrition[k as keyof typeof nutrition]) ? (
              <>
                <p>Porção: {nutrition.serving || "Não informada"}</p>
                <table>
                  <tbody>
                    {rows.map(([k, label, unit]) => (
                      <tr key={k}>
                        <th>{label}</th>
                        <td>
                          {nutrition[k as keyof typeof nutrition]
                            ? `${nutrition[k as keyof typeof nutrition]} ${unit}`
                            : "Não informado"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <small>
                  Informações fornecidas pela proprietária para a opção
                  selecionada. Adicionais não incluídos.
                </small>
              </>
            ) : (
              <p>
                Informações nutricionais ainda não informadas pela proprietária.
              </p>
            )}
          </details>
          <p className="muted small">
            Tem alguma restrição alimentar? Confirme os ingredientes e o preparo
            com a equipe pelo WhatsApp.
          </p>
        </div>
      </div>
      <div className="modal-footer">
        <div className="purchase-row">
          <Quantity value={quantity} set={setQuantity} />
          <button
            className="button primary"
            disabled={price === null}
            onClick={() =>
              onAdd({ ...line, key: initial?.key || crypto.randomUUID() })
            }
          >
            <ShoppingBag size={18} />
            {initial ? "Atualizar" : "Adicionar"}
            <strong>{price !== null ? money(price) : ""}</strong>
          </button>
        </div>
        {problem && (
          <p className="small muted" role="status">
            {problem}
          </p>
        )}
      </div>
    </Modal>
  );
}
