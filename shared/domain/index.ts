export type Nutrition = {
  serving: string;
  confirmed?: boolean;
  energy?: string;
  carbs?: string;
  protein?: string;
  fat?: string;
  saturated?: string;
  fiber?: string;
  sodium?: string;
};
export function hasNutritionValues(nutrition: Nutrition | undefined) {
  return !!nutrition?.serving?.trim() &&
    Object.entries(nutrition).some(([key, value]) =>
      key !== "serving" && typeof value === "string" && value.trim().length > 0,
    );
}
export type QuantityTier = {
  minQuantity: number;
  unitPrice: number;
};
export type Variant = {
  id: string;
  name: string;
  price: number;
  weightGrams?: number;
  quantityTiers?: QuantityTier[];
  nutrition?: Nutrition;
};
export type Component = {
  productId: string;
  variantId: string;
  quantity: number;
};
export type Option = {
  id: string;
  name: string;
  price: number;
  component?: Omit<Component, "quantity">;
};
export type ChoiceGroup = {
  id: string;
  name: string;
  min: number;
  max: number;
  repeat: boolean;
  options: Option[];
};
export type Product = {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  categoryId: string;
  image: string;
  available: boolean;
  archived: boolean;
  featured: boolean;
  badge: string;
  kind: "product" | "fixed" | "builder";
  pricePerKg?: number;
  variants: Variant[];
  groups: ChoiceGroup[];
  components: Component[];
};
export type Category = {
  id: string;
  name: string;
  color: string;
  textColor: string;
};
export type Theme = {
  primary: string;
  primaryText: string;
  background: string;
  surface: string;
  text: string;
  font: "Nunito Sans" | "DM Sans" | "Manrope";
  scale: number;
};
export type Catalog = {
  version: string;
  name: string;
  tagline: string;
  whatsapp: string;
  instagram: string;
  hours: string;
  location: string;
  banner: string;
  bannerEnabled: boolean;
  theme: Theme;
  categories: Category[];
  products: Product[];
};
export type Selection = { groupId: string; optionId: string; quantity: number };
export type CartLine = {
  key: string;
  productId: string;
  variantId: string;
  quantity: number;
  selections: Selection[];
};
export type QuotedLine = CartLine & {
  name: string;
  variant: string;
  unitPrice: number;
  total: number;
  quantityDiscount?: number;
  details: string[];
  components: (Component & { name: string })[];
};
export type Quote = { lines: QuotedLine[]; total: number; signature: string };
export type OrderStatus = "requested" | "confirmed" | "completed" | "cancelled";
export type Order = {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  source: "site" | "counter" | "whatsapp";
  notes: string;
  original: Quote;
  current: Quote;
  adjustment: number;
  adjustment_reason: string;
  completed_at: string | null;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const integer = (v: unknown, min = 0, max = 1_000_000) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
export function weightPortionPrice(pricePerKg: number, grams: number | undefined) {
  if (!integer(pricePerKg, 1) || grams === undefined || !integer(grams, 1)) return null;
  const price = (pricePerKg * grams) / 1000;
  return integer(price, 1) ? price : null;
}

export function variantBasePrice(product: Product, variant: Variant) {
  return product.pricePerKg === undefined
    ? variant.price
    : weightPortionPrice(product.pricePerKg, variant.weightGrams);
}

export function variantLabel(product: Product, variant: Variant) {
  return product.pricePerKg === undefined
    ? variant.name
    : `${variant.name} · ${variant.weightGrams} g`;
}

export function supportsQuantityTiers(product: Product) {
  return product.kind === "product" && product.pricePerKg === undefined && product.groups?.length === 0;
}

export function quantityTierError(product: Product, variant: Variant) {
  const tiers = variant.quantityTiers;
  if (tiers === undefined) return null;
  if (!Array.isArray(tiers)) return "Faixas de quantidade inválidas.";
  if (tiers.length === 0) return null;
  if (!supportsQuantityTiers(product)) return "Use faixas somente em avulsos com preço fixo e sem adicionais.";
  if (tiers.length > 10) return "Cadastre até 10 faixas por opção.";
  let previousQuantity = 1;
  let previousPrice = variant.price;
  for (const tier of tiers) {
    if (!tier || !integer(tier.minQuantity, previousQuantity + 1, 99)) {
      return "Informe quantidades inteiras de 2 a 99 em ordem crescente.";
    }
    if (!integer(tier.unitPrice, 1, previousPrice - 1)) {
      return "Informe um preço unitário positivo e menor que o da faixa anterior ou do preço base.";
    }
    previousQuantity = tier.minQuantity;
    previousPrice = tier.unitPrice;
  }
  return null;
}

export function quantityTierDrops(variant: Variant) {
  return (variant.quantityTiers ?? []).flatMap((tier, index, tiers) => {
    const previousQuantity = tier.minQuantity - 1;
    const previousTotal = previousQuantity * (tiers[index - 1]?.unitPrice ?? variant.price);
    const total = tier.minQuantity * tier.unitPrice;
    return total < previousTotal ? [{ previousQuantity, previousTotal, quantity: tier.minQuantity, total }] : [];
  });
}

export function validPhone(phone: string) {
  return /^55[1-9]\d{9,10}$/.test(phone);
}
export function safeImage(url: string) {
  return (
    !url ||
    /^\/media\/[a-z\d._/-]+$/i.test(url) ||
    /^https:\/\/[^\s]+$/i.test(url) ||
    (url.length <= 400000 && /^data:image\/webp;base64,[a-z\d+/=]+$/i.test(url))
  );
}
export function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function validateCatalog(value: unknown): asserts value is Catalog {
  const c = value as Catalog;
  const text = (v: unknown, max: number, required = false) =>
    typeof v === "string" &&
    v.length <= max &&
    (!required || v.trim().length > 0);
  assert(c && typeof c === "object", "Catálogo inválido.");
  assert(
    text(c.version, 80, true) &&
      text(c.name, 120, true) &&
      text(c.tagline, 500) &&
      text(c.hours, 500) &&
      text(c.location, 500) &&
      text(c.banner, 200) &&
      typeof c.bannerEnabled === "boolean",
    "Preencha as informações da loja dentro dos limites.",
  );
  assert(
    text(c.whatsapp, 13) &&
      (!c.whatsapp || validPhone(c.whatsapp)) &&
      text(c.instagram, 30) &&
      (!c.instagram || /^[a-z\d._]+$/i.test(c.instagram)),
    "Confira o WhatsApp e o usuário do Instagram.",
  );
  for (const k of [
    "name",
    "tagline",
    "hours",
    "location",
    "banner",
    "whatsapp",
    "instagram",
    "version",
  ] as const)
    assert(text(c[k], k === "banner" ? 500 : 250), `Campo ${k} inválido.`);
  assert(
    c.name.trim() && (!c.whatsapp || validPhone(c.whatsapp)),
    "Informe o nome e um WhatsApp brasileiro com DDD e código 55.",
  );
  assert(
    !c.instagram || /^[\w.]{1,30}$/.test(c.instagram),
    "Informe apenas o usuário do Instagram, sem @.",
  );
  assert(
    typeof c.bannerEnabled === "boolean",
    "Configuração de banner inválida.",
  );
  assert(
    c.theme && ["Nunito Sans", "DM Sans", "Manrope"].includes(c.theme.font),
    "Fonte inválida.",
  );
  for (const k of [
    "primary",
    "primaryText",
    "background",
    "surface",
    "text",
  ] as const)
    assert(
      /^#[\da-f]{6}$/i.test(c.theme[k]),
      "Use cores em hexadecimal de seis dígitos.",
    );
  assert(
    c.theme.scale >= 1 && c.theme.scale <= 1.25,
    "Escala de texto entre 100% e 125%.",
  );
  assert(
    contrast(c.theme.primary, c.theme.primaryText) >= 4.5 &&
      contrast(c.theme.surface, c.theme.text) >= 4.5 &&
      contrast(c.theme.background, c.theme.text) >= 4.5,
    "Contraste insuficiente: ajuste as cores do texto e do fundo.",
  );
  assert(
    Array.isArray(c.categories) &&
      c.categories.length > 0 &&
      c.categories.length <= 30,
    "Cadastre de 1 a 30 categorias.",
  );
  const cats = new Set<string>();
  for (const cat of c.categories) {
    assert(
      text(cat.id, 80, true) && !cats.has(cat.id) && text(cat.name, 60, true),
      "Categoria inválida ou repetida.",
    );
    cats.add(cat.id);
    assert(
      /^#[\da-f]{6}$/i.test(cat.color) &&
        /^#[\da-f]{6}$/i.test(cat.textColor) &&
        contrast(cat.color, cat.textColor) >= 4.5,
      `Contraste insuficiente na categoria ${cat.name}.`,
    );
  }
  assert(
    Array.isArray(c.products) && c.products.length <= 500,
    "Limite de 500 produtos.",
  );
  const ids = new Set<string>();
  for (const p of c.products) {
    assert(
      text(p.id, 80, true) && !ids.has(p.id),
      "Identificador de produto inválido ou repetido.",
    );
    ids.add(p.id);
    assert(
      text(p.name, 120, true) &&
        text(p.description, 1500) &&
        text(p.ingredients, 1500) &&
        text(p.badge, 50),
      "Preencha os textos do produto dentro dos limites.",
    );
    assert(
      cats.has(p.categoryId) &&
        ["product", "fixed", "builder"].includes(p.kind),
      `Categoria ou tipo inválido em ${p.name}.`,
    );
    assert(
      typeof p.available === "boolean" &&
        typeof p.archived === "boolean" &&
        typeof p.featured === "boolean",
      "Disponibilidade inválida.",
    );
    assert(
      text(p.image, 400000) && safeImage(p.image),
      "Imagem deve ser uma foto enviada pelo painel.",
    );
    assert(
      Array.isArray(p.variants) &&
        p.variants.length > 0 &&
        p.variants.length <= 30,
      "Cadastre de 1 a 30 opções de produto.",
    );
    const variants = new Set<string>();
    assert(
      p.pricePerKg === undefined || (p.kind === "product" && integer(p.pricePerKg, 1)),
      `Preço por quilo inválido em ${p.name}.`,
    );
    for (const v of p.variants) {
      assert(
        text(v.id, 80, true) &&
          !variants.has(v.id) &&
          text(v.name, 100, true) &&
          integer(v.price),
        "Opção ou preço inválido.",
      );
      variants.add(v.id);
      assert(
        p.pricePerKg !== undefined || p.archived || v.price > 0,
        `Informe preços maiores que zero em ${p.name} antes de publicar.`,
      );
      if (p.pricePerKg !== undefined) {
        assert(
          variantBasePrice(p, v) !== null,
          `Confira o peso e o preço de ${v.name} em ${p.name}. A porção deve custar um valor positivo em centavos inteiros.`,
        );
      }
      const tierError = quantityTierError(p, v);
      assert(!tierError, `${p.name} · ${v.name}: ${tierError}`);
      if (v.nutrition) {
        for (const [k, n] of Object.entries(v.nutrition))
          assert(
            k === "confirmed" ? typeof n === "boolean" : [
              "serving",
              "energy",
              "carbs",
              "protein",
              "fat",
              "saturated",
              "fiber",
              "sodium",
            ].includes(k) && text(n, 100),
            "Informação nutricional inválida.",
          );
        if (v.nutrition.confirmed) {
          assert(hasNutritionValues(v.nutrition), "Informe a porção e os valores nutricionais conferidos.");
        }
      }
    }
    assert(
      Array.isArray(p.groups) &&
        p.groups.length <= 10 &&
        Array.isArray(p.components) &&
        p.components.length <= 30,
      "Composição inválida.",
    );
    const groups = new Set<string>();
    for (const g of p.groups) {
      assert(
        text(g.id, 80, true) && !groups.has(g.id) && text(g.name, 100, true),
        "Grupo de escolhas inválido.",
      );
      groups.add(g.id);
      assert(
        integer(g.min, 0, 50) &&
          integer(g.max, 1, 50) &&
          g.min <= g.max &&
          typeof g.repeat === "boolean",
        "Limites de escolha inválidos.",
      );
      assert(
        Array.isArray(g.options) &&
          g.options.length > 0 &&
          g.options.length <= 100 &&
          (g.repeat || g.min <= g.options.length),
        "Opções insuficientes no grupo.",
      );
      const opts = new Set<string>();
      for (const o of g.options) {
        assert(
          text(o.id, 80, true) &&
            !opts.has(o.id) &&
            text(o.name, 120, true) &&
            integer(o.price),
          "Adicional inválido.",
        );
        opts.add(o.id);
      }
    }
    assert(
      p.kind !== "fixed" || p.components.length > 0,
      "Informe a composição do combo fixo.",
    );
    assert(
      p.kind !== "builder" || p.groups.some((g) => g.min > 0),
      "Combo montável precisa de escolhas obrigatórias.",
    );
    assert(
      p.kind === "fixed" || !p.components.length,
      "Só combos fixos têm componentes fixos.",
    );
  }
  for (const p of c.products) {
    const components = [
      ...p.components,
      ...p.groups.flatMap((g) =>
        g.options.flatMap((o) =>
          o.component ? [{ ...o.component, quantity: 1 }] : [],
        ),
      ),
    ];
    for (const item of components) {
      const target = c.products.find((x) => x.id === item.productId);
      assert(
        target?.kind === "product" &&
          target.variants.some((v) => v.id === item.variantId) &&
          integer(item.quantity, 1, 50),
        `Componente inválido em ${p.name}. Use produtos avulsos e uma opção existente.`,
      );
    }
  }
}
export function componentAvailable(
  c: Catalog,
  component: Omit<Component, "quantity">,
) {
  return c.products.some(
    (p) =>
      p.id === component.productId &&
      p.available &&
      !p.archived &&
      p.kind === "product" &&
      p.variants.some((v) => v.id === component.variantId),
  );
}
export function available(c: Catalog, p: Product) {
  return (
    p.available &&
    !p.archived &&
    p.components.every((x) => componentAvailable(c, x)) &&
    p.groups.every((g) => {
      const n = g.options.filter(
        (o) => !o.component || componentAvailable(c, o.component),
      ).length;
      return g.min === 0 || (g.repeat ? n > 0 : n >= g.min);
    })
  );
}
export function startingOffer(c: Catalog, p: Product) {
  if (!p.variants.length || !available(c, p)) return null;
  const variant = p.variants.reduce((cheapest, candidate) =>
    (variantBasePrice(p, candidate) ?? Infinity) < (variantBasePrice(p, cheapest) ?? Infinity)
      ? candidate
      : cheapest,
  );
  const selections = p.groups
    .filter((group) => group.min > 0)
    .flatMap((group) => {
      const options = group.options
        .filter((option) => !option.component || componentAvailable(c, option.component))
        .sort((a, b) => a.price - b.price);
      return options.slice(0, group.repeat ? 1 : group.min).map((option) => ({
        groupId: group.id,
        optionId: option.id,
        quantity: group.repeat ? group.min : 1,
      }));
    });
  try {
    const { total: price } = quoteCart(c, [{
      key: "offer",
      productId: p.id,
      variantId: variant.id,
      quantity: 1,
      selections,
    }]);
    return { variant, price };
  } catch {
    return null;
  }
}
export function quoteCart(c: Catalog, cart: CartLine[]): Quote {
  assert(
    Array.isArray(cart) && cart.length > 0 && cart.length <= 50,
    "Selecione entre 1 e 50 itens diferentes.",
  );
  const quantities = new Map<string, number>();
  const tierKey = (line: CartLine) => JSON.stringify([line.productId, line.variantId]);
  for (const line of cart) {
    assert(integer(line.quantity, 1, 99), "Escolha uma opção e quantidade válidas.");
    const key = tierKey(line);
    quantities.set(key, (quantities.get(key) ?? 0) + line.quantity);
  }
  const keys = new Set<string>();
  const lines = cart.map((line) => {
    assert(
      typeof line.key === "string" &&
        line.key.length <= 80 &&
        !keys.has(line.key),
      "Item de carrinho inválido ou repetido.",
    );
    keys.add(line.key);
    const p = c.products.find((x) => x.id === line.productId);
    assert(
      p && available(c, p),
      `${p?.name ?? "Produto"} está indisponível. Revise o pedido.`,
    );
    const v = p.variants.find((x) => x.id === line.variantId);
    assert(
      v,
      "Escolha uma opção e quantidade válidas.",
    );
    assert(
      Array.isArray(line.selections) && line.selections.length <= 100,
      "Escolhas inválidas.",
    );
    const basePrice = variantBasePrice(p, v);
    assert(basePrice !== null, `O preço por peso de ${p.name} está indisponível.`);
    const tiers = v.quantityTiers ?? [];
    const tierError = quantityTierError(p, v);
    assert(!tierError, tierError ?? "");
    const groupedQuantity = quantities.get(tierKey(line)) ?? line.quantity;
    const tier = tiers.reduce<QuantityTier | undefined>(
      (active, candidate) => candidate.minQuantity <= groupedQuantity ? candidate : active,
      undefined,
    );
    let unitPrice = tier?.unitPrice ?? basePrice;
    const components = p.components.map((x) => ({
      ...x,
      name: c.products.find((y) => y.id === x.productId)!.name,
    }));
    const details: string[] = [];
    const seen = new Set<string>();
    for (const s of line.selections) {
      const group = p.groups.find((g) => g.id === s.groupId),
        option = group?.options.find((o) => o.id === s.optionId);
      const key = `${s.groupId}:${s.optionId}`;
      assert(
        group &&
          option &&
          !seen.has(key) &&
          integer(s.quantity, 1, group.repeat ? group.max : 1),
        "Escolha inválida ou repetida.",
      );
      seen.add(key);
      assert(
        !option.component || componentAvailable(c, option.component),
        `${option.name} está indisponível.`,
      );
      unitPrice += option.price * s.quantity;
      details.push(
        `${s.quantity}× ${option.name}${option.price ? ` (+${money(option.price)} cada)` : ""}`,
      );
      if (option.component)
        components.push({
          ...option.component,
          quantity: s.quantity,
          name: c.products.find((y) => y.id === option.component!.productId)!
            .name,
        });
    }
    for (const g of p.groups) {
      const n = line.selections
        .filter((s) => s.groupId === g.id)
        .reduce((sum, s) => sum + s.quantity, 0);
      assert(
        n >= g.min && n <= g.max,
        `${g.name}: selecione de ${g.min} a ${g.max}.`,
      );
    }
    for (const x of p.components)
      details.push(
        `${x.quantity}× ${c.products.find((y) => y.id === x.productId)!.name} · ${c.products.find((y) => y.id === x.productId)!.variants.find((y) => y.id === x.variantId)!.name}`,
      );
    return {
      key: line.key,
      productId: p.id,
      variantId: v.id,
      quantity: line.quantity,
      selections: line.selections.map((s) => ({
        groupId: s.groupId,
        optionId: s.optionId,
        quantity: s.quantity,
      })),
      name: p.name,
      variant: variantLabel(p, v),
      unitPrice,
      total: unitPrice * line.quantity,
      ...(tier ? { quantityDiscount: (basePrice - tier.unitPrice) * line.quantity } : {}),
      details,
      components,
    };
  });
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  assert(
    Number.isSafeInteger(total) && total <= 100_000_000,
    "Pedido excede o valor máximo.",
  );
  const signature = JSON.stringify(
    lines.map((l) => [
      l.productId,
      l.variantId,
      l.quantity,
      l.unitPrice,
      l.name,
      l.variant,
      l.details,
    ]),
  );
  return { lines, total, signature };
}
export function portionLabel(quantity: number) {
  return `${quantity} ${quantity === 1 ? "porção" : "porções"}`;
}
export function orderMessage(order: Order, compact = false) {
  const q = order.current;
  return [
    `Olá! Gostaria de solicitar um pedido na Laís Fit Já.`,
    `Referência: ${order.reference}`,
    "",
    ...q.lines.flatMap((l) => [
      `${l.name} · ${portionLabel(l.quantity)} · ${l.variant} — ${money(l.unitPrice)} por porção · ${money(l.total)}`,
      ...(compact ? [] : l.details.map((d) => `  ${d}`)),
    ]),
    "",
    `Total dos produtos: ${money(q.total + order.adjustment)}`,
    ...(order.notes ? [`Observações: ${order.notes}`] : []),
    "Entrega, retirada, prazo e pagamento a combinar. Aguardo confirmação de disponibilidade.",
  ].join("\n");
}
export function whatsappUrl(phone: string, order: Order) {
  assert(validPhone(phone), "O WhatsApp da loja ainda não foi configurado.");
  const message = orderMessage(order);
  return encodeURIComponent(message).length > 5500
    ? `https://wa.me/${phone}`
    : `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
export function saoPauloDay(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
export function orderReference() {
  return `FJ-${saoPauloDay(new Date()).replaceAll("-", "")}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}
export function validateOrderEdit(
  status: unknown,
  source: unknown,
  adjustment: unknown,
  reason: unknown,
) {
  assert(
    ["requested", "confirmed", "completed", "cancelled"].includes(
      String(status),
    ),
    "Status inválido.",
  );
  assert(
    ["site", "counter", "whatsapp"].includes(String(source)),
    "Origem inválida.",
  );
  assert(
    integer(adjustment, -1_000_000, 1_000_000) &&
      typeof reason === "string" &&
      reason.length <= 500 &&
      (adjustment === 0 || reason.trim()),
    "Informe o motivo do ajuste de valor.",
  );
}
