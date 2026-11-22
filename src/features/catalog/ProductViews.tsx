import { useState } from "react";
import { ChevronDown, Leaf, ShoppingBag, ZoomIn, ZoomOut } from "lucide-react";
import { componentAvailable, hasNutritionValues, money, quoteCart, startingOffer, type CartLine, type Catalog, type Product, type Selection } from "../../../shared/domain";
import { Modal, Quantity } from "../../shared/ui";

type PhotoDimensions = { width: number; height: number };

export function FoodImage({
  image,
  name,
  large = false,
  economy = false,
  eager = false,
  onDimensions,
}: {
  image: string;
  name: string;
  large?: boolean;
  economy?: boolean;
  eager?: boolean;
  onDimensions?: (size: PhotoDimensions | null) => void;
}) {
  const [failed, setFailed] = useState("");
  const local = image.startsWith("/media/") && !/\.[a-z\d]+$/i.test(image);
  const uploaded = /^https:.*\/640\.webp$/.test(image);
  const thumbnail = local ? `${image}-320.webp`
    : uploaded && (!large || economy) ? image.replace("/640.webp", "/320.webp")
    : image;
  const fallback = local ? `${image}.jpg` : uploaded ? image.replace("/640.webp", "/fallback.jpg") : image;
  const [fallbackFor, setFallbackFor] = useState("");
  const useSource = thumbnail !== fallback && fallbackFor !== thumbnail;

  if (!image || failed === thumbnail) {
    return (
      <div className="image-placeholder" role="img" aria-label={`${name}: foto indisponível`}>
        <Leaf aria-hidden="true" />
        <span>Foto indisponível</span>
      </div>
    );
  }
  return (
    <picture>
      {useSource && <source type="image/webp" srcSet={thumbnail} />}
      <img
        src={fallback}
        alt={name}
        width={large ? 640 : 320}
        height={large ? 480 : 320}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        onLoad={({ currentTarget }) => onDimensions?.({
          width: currentTarget.naturalWidth,
          height: currentTarget.naturalHeight,
        })}
        onError={() => {
          if (useSource) setFallbackFor(thumbnail);
          else {
            setFailed(thumbnail);
            onDimensions?.(null);
          }
        }}
      />
    </picture>
  );
}

export function FeaturedProduct({
  product,
  catalog,
  onSelect,
}: {
  product: Product;
  catalog: Catalog;
  onSelect: (product: Product, opener: HTMLButtonElement) => void;
}) {
  const offer = startingOffer(catalog, product);
  if (!offer) return null;
  return (
    <article className="featured-product">
      <div className="featured-photo">
        <FoodImage image={product.image} name={product.name} economy eager />
      </div>
      <div className="featured-details">
        <h2>{product.name}</h2>
        <p>{offer.variant.name}</p>
        <div className="featured-controls">
          <strong className="featured-price">{money(offer.price)}</strong>
          <button
            className="button primary featured-action"
            type="button"
            aria-label={`Escolher ${product.name}`}
            onClick={(event) => onSelect(product, event.currentTarget)}
          >
            Escolher
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCard({
  product: p,
  catalog,
  categoryName,
  economy,
  onSelect,
  eager = false,
}: {
  product: Product;
  catalog: Catalog;
  categoryName?: string;
  economy: boolean;
  onSelect: (product: Product, opener: HTMLButtonElement) => void;
  eager?: boolean;
}) {
  const offer = startingOffer(catalog, p);
  return (
    <article className={`product-card ${offer ? "" : "sold-out"}`}>
      <div className="product-photo">
        <FoodImage image={p.image} name={p.name} economy={economy} eager={eager} />
      </div>
      <div className="product-copy">
        {categoryName && <span className="product-category">{categoryName}</span>}
        <h3 className="product-title">{p.name}</h3>
        <p>{offer?.variant.name ?? p.variants[0]?.name}</p>
        {p.badge && <span className="product-badge">{p.badge}</span>}
        <div className="product-bottom">
          {offer ? (
            <div>
              {(p.variants.length > 1 || p.groups.length > 0) && <small>A partir de</small>}
              <strong>{money(offer.price)}</strong>
            </div>
          ) : <span className="out-badge">Esgotado</span>}
          <button
            className={`button ${offer ? "primary" : "secondary"} product-action`}
            type="button"
            aria-label={`${offer ? "Escolher" : "Ver detalhes de"} ${p.name}`}
            onClick={(event) => onSelect(p, event.currentTarget)}
          >
            {offer ? "Escolher" : "Ver detalhes"}
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
    [zoom, setZoom] = useState(false),
    [photoSize, setPhotoSize] = useState<PhotoDimensions | null>(null);
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
  const showNutrition = p.kind === "product" && selections.length === 0 &&
    nutrition?.confirmed === true && hasNutritionValues(nutrition);
  const canEnlarge = !!photoSize && Math.min(photoSize.width, photoSize.height) >= 320;
  const expanded = canEnlarge && zoom;
  const rows = [
    ["energy", "Valor energético", "kcal"],
    ["carbs", "Carboidratos", "g"],
    ["protein", "Proteínas", "g"],
    ["fat", "Gorduras totais", "g"],
    ["saturated", "Gorduras saturadas", "g"],
    ["fiber", "Fibras alimentares", "g"],
    ["sodium", "Sódio", "mg"],
  ] as const;
  return (
    <Modal title={p.name} onClose={onClose}>
      <div className="dialog-scroll">
        <div className="detail-content product-detail">
          <div className={`product-intro ${expanded ? "is-expanded" : ""}`}>
            <div
              className={expanded ? "product-image-expanded" : "detail-photo"}
              style={expanded && photoSize ? { maxWidth: photoSize.width } : undefined}
            >
              <FoodImage
                image={p.image}
                name={p.name}
                large
                economy={economy}
                eager
                onDimensions={setPhotoSize}
              />
            </div>
            <div className="product-intro-copy">
              <p>{p.description}</p>
              {p.ingredients && <p><strong>Ingredientes:</strong> {p.ingredients}</p>}
              {variant && (
                <p className="detail-price" role="status">
                  <span>{variant.name}</span>
                  <strong>{price === null ? "Preço base " : ""}{money(price ?? variant.price)}</strong>
                </p>
              )}
              {canEnlarge && (
                <button
                  className="text-button detail-zoom"
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setZoom(!zoom)}
                >
                  {expanded ? <ZoomOut size={18} aria-hidden="true" /> : <ZoomIn size={18} aria-hidden="true" />}
                  {expanded ? "Reduzir foto" : "Ampliar foto"}
                </button>
              )}
            </div>
          </div>
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
          {showNutrition && (
            <details className="nutrition" key={variantId}>
              <summary>
                Ver tabela nutricional <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>Porção: {nutrition.serving}</p>
              <table>
                <tbody>
                  {rows.filter(([key]) => nutrition[key]?.trim()).map(([key, label, unit]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>{nutrition[key]} {unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <small>Dados conferidos pela proprietária para a porção selecionada.</small>
            </details>
          )}
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
            <ShoppingBag size={18} aria-hidden="true" />
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
