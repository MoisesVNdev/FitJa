import { describe, expect, it } from "vitest";
import { initialCatalog } from "../src/data";
import {
  available,
  contrast,
  quantityTierDrops,
  quoteCart,
  startingOffer,
  validateCatalog,
  validateOrderEdit,
  type Catalog,
  type CartLine,
  type Product,
} from "../shared/domain";

const catalog = () => structuredClone(initialCatalog);
const line = (
  productId = "tapioca",
  variantId = "v0",
  quantity = 1,
): CartLine => ({
  key: "test-line",
  productId,
  variantId,
  quantity,
  selections: [],
});

describe("preço por peso", () => {
  function weighedCatalog() {
    const c = catalog();
    const product = c.products.find((p) => p.id === "tapioca")!;
    product.pricePerKg = 5000;
    product.variants = [
      { id: "v0", name: "Pequena", weightGrams: 100, price: 0 },
      { id: "v1", name: "Grande", weightGrams: 200, price: 0 },
    ];
    return { c, product };
  }

  it("calcula as porções cadastradas e preserva o identificador da opção", () => {
    const { c, product } = weighedCatalog();
    validateCatalog(c);
    expect(startingOffer(c, product)?.price).toBe(500);
    expect(quoteCart(c, [line()]).lines[0]).toMatchObject({
      variantId: "v0",
      variant: "Pequena · 100 g",
      unitPrice: 500,
    });
    expect(quoteCart(c, [line("tapioca", "v1", 3)]).total).toBe(3000);
    expect(() => quoteCart(c, [line("tapioca", "peso-livre")])).toThrow("opção");
  });

  it("exige centavos inteiros na publicação e na cotação", () => {
    const { c, product } = weighedCatalog();
    product.pricePerKg = 5055;
    expect(() => validateCatalog(c)).toThrow("centavos inteiros");
    expect(() => quoteCart(c, [line()])).toThrow("indisponível");
    expect(startingOffer(c, product)?.price).toBe(1011);
  });
});

describe("faixas por quantidade", () => {
  it.each([
    ["brigadeiro", 9, 2700],
    ["brigadeiro", 10, 2500],
    ["brigadeiro", 11, 2750],
    ["coxinha", 1, 950],
    ["coxinha", 2, 1800],
    ["coxinha", 4, 3600],
    ["coxinha", 5, 4200],
    ["coxinha", 6, 5040],
  ])("cota %s com %i unidades", (productId, quantity, total) => {
    expect(quoteCart(catalog(), [line(productId, "v0", quantity)]).total).toBe(total);
  });

  it("agrupa avulsos iguais e perde a faixa ao reduzir uma linha", () => {
    const c = catalog();
    const first = line("brigadeiro", "v0", 7);
    const second = { ...line("brigadeiro", "v0", 3), key: "separada" };
    const discounted = quoteCart(c, [first, second]);
    expect(discounted.total).toBe(2500);
    expect(discounted.lines.map((entry) => entry.quantityDiscount)).toEqual([350, 150]);
    const updated = quoteCart(c, [first, { ...second, quantity: 2 }]);
    expect(updated.total).toBe(2700);
    expect(updated.lines.every((entry) => entry.quantityDiscount === undefined)).toBe(true);
    expect(updated.signature).not.toBe(discounted.signature);
  });

  it("separa sabores, tamanhos e componentes de um combo fixo", () => {
    const c = catalog();
    const brigadeiro = c.products.find((p) => p.id === "brigadeiro")!;
    const original = brigadeiro.variants[0];
    brigadeiro.variants.push(
      { ...original, id: "morango", name: "Morango · 20 g" },
      { ...original, id: "maior", name: "Tradicional · 40 g", price: 500 },
    );
    const { fixed } = combos(c);
    fixed.components = [{ productId: brigadeiro.id, variantId: original.id, quantity: 3 }];
    validateCatalog(c);
    const priced = quoteCart(c, [
      line(brigadeiro.id, original.id, 9),
      { ...line(brigadeiro.id, "morango", 1), key: "sabor" },
      { ...line(brigadeiro.id, "maior", 1), key: "tamanho" },
      { ...line(fixed.id, "base", 2), key: "combo" },
    ]);
    expect(priced.lines.map((entry) => entry.total)).toEqual([2700, 300, 500, 2800]);
    expect(priced.lines.every((entry) => entry.quantityDiscount === undefined)).toBe(true);
  });

  it("sinaliza total menor na transição e valida somente faixas elegíveis", () => {
    const c = catalog();
    const brigadeiro = c.products.find((p) => p.id === "brigadeiro")!;
    const variant = brigadeiro.variants[0];
    expect(quantityTierDrops(variant)).toEqual([
      { previousQuantity: 9, previousTotal: 2700, quantity: 10, total: 2500 },
    ]);
    variant.quantityTiers = [{ minQuantity: 10, unitPrice: 350 }];
    expect(() => validateCatalog(c)).toThrow("menor que");
    variant.quantityTiers = [{ minQuantity: 10, unitPrice: 250 }];
    brigadeiro.kind = "fixed";
    expect(() => validateCatalog(c)).toThrow("somente em avulsos");
  });

  it("preserva as porções antigas e os catálogos sem faixas", () => {
    const c = catalog();
    const coxinha = c.products.find((p) => p.id === "coxinha")!;
    expect(quoteCart(c, [line(coxinha.id, "v1", 2)]).total).toBe(3600);
    delete coxinha.variants[0].quantityTiers;
    validateCatalog(c);
    expect(quoteCart(c, [line(coxinha.id, "v0", 5)]).total).toBe(4750);
  });
});

function combos(c: Catalog) {
  const fixed: Product = {
    ...structuredClone(c.products.find((p) => p.id === "tapioca")!),
    id: "fixed",
    name: "Pausa completa",
    kind: "fixed",
    variants: [{ id: "base", name: "Individual", price: 1400 }],
    components: [
      { productId: "tapioca", variantId: "v0", quantity: 1 },
      { productId: "cafe", variantId: "v0", quantity: 1 },
    ],
    groups: [],
  };
  const builder: Product = {
    ...structuredClone(fixed),
    id: "builder",
    name: "Escolha cinco",
    kind: "builder",
    variants: [{ id: "base", name: "5 refeições", price: 9000 }],
    components: [],
    groups: [
      {
        id: "flavors",
        name: "Escolha os sabores",
        min: 5,
        max: 5,
        repeat: true,
        options: [
          {
            id: "chicken",
            name: "Frango",
            price: 0,
            component: { productId: "escondidinho", variantId: "v0" },
          },
          {
            id: "beef",
            name: "Carne",
            price: 200,
            component: { productId: "escondidinho", variantId: "v1" },
          },
        ],
      },
    ],
  };
  // Use an explicitly offered drink for the fixed-combo fixture.
  c.products.find((p) => p.id === "cafe")!.archived = false;
  c.products.push(fixed, builder);
  return { fixed, builder };
}
describe("catálogo e preço canônico", () => {
  it("valida o catálogo inicial sem inventar valores nutricionais", () => {
    const c = catalog();
    expect(() => validateCatalog(c)).not.toThrow();
    expect(c.products.every((p) => p.variants.every((v) => !v.nutrition))).toBe(
      true,
    );
    expect(c.products.filter((p) => p.archived).map((p) => p.id)).toEqual([
      "salada", "cafe", "cafe-leite", "cappuccino",
    ]);
  });
  it("mantém os IDs das marmitas existentes e cotação dos pesos de demonstração", () => {
    const c = catalog();
    for (const [id, prices] of [
      ["marmita-frango", [1600, 1800, 2000, 2200]],
      ["marmita-carne", [1800, 2000, 2200, 2200]],
    ] as const) {
      const variants = c.products.find((p) => p.id === id)!.variants;
      expect(variants.map((v) => [v.id, v.name.slice(0, 5)])).toEqual([
        ["v0", "300 g"], ["v3", "350 g"], ["v1", "400 g"], ["v2", "500 g"],
      ]);
      expect(variants.map((v) => quoteCart(c, [line(id, v.id)]).total)).toEqual(prices);
    }
  });
  it("calcula cinco itens diferentes em centavos", () => {
    const c = catalog(),
      cart = ["tapioca", "sanduiche", "escondidinho", "lasanha", "marmita-frango"].map(
        (id, i) => ({ ...line(id), key: `line-${i}` }),
      );
    const q = quoteCart(c, cart);
    expect(q.lines).toHaveLength(5);
    expect(q.total).toBe(7300);
  });
  it("ignora valores adulterados no carrinho", () => {
    const c = catalog(),
      q = quoteCart(c, [{ ...line(), unitPrice: 1, total: 1 } as CartLine]);
    expect(q.total).toBe(900);
  });
  it("rejeita quantidades inválidas, opção desconhecida e linhas repetidas", () => {
    const c = catalog();
    for (const qty of [0, -1, 1.5, 100, NaN])
      expect(() => quoteCart(c, [line("tapioca", "v0", qty)])).toThrow();
    expect(() => quoteCart(c, [line("tapioca", "fake")])).toThrow();
    expect(() => quoteCart(c, [line(), line()])).toThrow();
  });
  it("invalida a revisão quando preço ou composição muda", () => {
    const c = catalog(),
      first = quoteCart(c, [line()]);
    c.products.find((p) => p.id === "tapioca")!.variants[0].price = 1100;
    expect(quoteCart(c, [line()]).signature).not.toBe(first.signature);
  });
  it("bloqueia esgotados e arquivados mesmo com carrinho antigo", () => {
    const c = catalog();
    c.products.find((p) => p.id === "tapioca")!.available = false;
    expect(() => quoteCart(c, [line()])).toThrow(/indisponível/);
    expect(() => quoteCart(c, [line("cafe")])).toThrow(/indisponível/);
  });
});
describe("combos e adicionais", () => {
  it("anuncia o mínimo incluindo escolhas obrigatórias disponíveis", () => {
    const c = catalog();
    const { builder } = combos(c);
    const [chicken, beef] = builder.groups[0].options;
    chicken.price = 100;
    beef.price = 300;
    expect(startingOffer(c, builder)?.price).toBe(9500);

    const chickenProduct = c.products.find((p) => p.id === chicken.component!.productId)!;
    chickenProduct.available = false;
    const availableOption = line("tapioca");
    beef.component = { productId: availableOption.productId, variantId: availableOption.variantId };
    expect(startingOffer(c, builder)?.price).toBe(10500);

    builder.available = false;
    expect(startingOffer(c, builder)).toBeNull();
  });
  it("calcula preço do combo fixo sem somar seus componentes outra vez", () => {
    const c = catalog();
    combos(c);
    const q = quoteCart(c, [line("fixed", "base", 2)]);
    expect(q.total).toBe(2800);
    expect(q.lines[0].components).toHaveLength(2);
  });
  it("monta cinco unidades de sabores com repetição e acréscimo", () => {
    const c = catalog();
    combos(c);
    const q = quoteCart(c, [
      {
        ...line("builder", "base", 2),
        selections: [
          { groupId: "flavors", optionId: "chicken", quantity: 3 },
          { groupId: "flavors", optionId: "beef", quantity: 2 },
        ],
      },
    ]);
    expect(q.total).toBe(18800);
    expect(q.lines[0].components.map((c) => c.quantity)).toEqual([3, 2]);
  });
  it("rejeita escolhas incompletas, excesso, duplicadas e extras desconhecidos", () => {
    const c = catalog();
    combos(c);
    const s = { groupId: "flavors", optionId: "chicken", quantity: 5 };
    for (const selections of [
      [],
      [{ ...s, quantity: 6 }],
      [s, s],
      [{ ...s, optionId: "fake" }],
    ])
      expect(() =>
        quoteCart(c, [{ ...line("builder", "base"), selections }]),
      ).toThrow();
  });
  it("propaga indisponibilidade para o combo fixo e opções montáveis", () => {
    const c = catalog(),
      { fixed, builder } = combos(c);
    c.products.find((p) => p.id === "tapioca")!.available = false;
    expect(available(c, fixed)).toBe(false);
    expect(available(c, builder)).toBe(true);
    c.products.find((p) => p.id === "escondidinho")!.available = false;
    expect(available(c, builder)).toBe(false);
  });
  it("limita escolhas sem repetição", () => {
    const c = catalog(),
      { builder } = combos(c);
    builder.groups[0].repeat = false;
    builder.groups[0].min = 1;
    builder.groups[0].max = 2;
    expect(() =>
      quoteCart(c, [
        {
          ...line("builder", "base"),
          selections: [
            { groupId: "flavors", optionId: "chicken", quantity: 2 },
          ],
        },
      ]),
    ).toThrow();
  });
  it("rejeita componente circular ou opção removida", () => {
    const c = catalog(),
      { fixed } = combos(c);
    fixed.components[0].productId = "fixed";
    expect(() => validateCatalog(c)).toThrow(/Componente/);
  });
  it("preserva o snapshot de um pedido após editar o catálogo", () => {
    const c = catalog();
    const q = quoteCart(c, [line()]);
    c.products.find((p) => p.id === "tapioca")!.name = "Outro nome";
    c.products.find((p) => p.id === "tapioca")!.variants[0].price = 3000;
    expect(q.lines[0].name).toBe("Tapioca recheada");
    expect(q.total).toBe(900);
  });
});
describe("publicação e gestão", () => {
  it("bloqueia cores ilegíveis e preserva a paleta inicial", () => {
    expect(contrast("#EA5A1C", "#28150D")).toBeGreaterThan(4.5);
    const c = catalog();
    c.theme.text = c.theme.background;
    expect(() => validateCatalog(c)).toThrow(/Contraste/);
  });
  it("bloqueia scripts em URLs de imagem e limites inválidos", () => {
    const c = catalog();
    c.products[0].image = "javascript:alert(1)";
    expect(() => validateCatalog(c)).toThrow();
    c.products[0].image = "";
    c.products[0].variants[0].price = -1;
    expect(() => validateCatalog(c)).toThrow();
  });
  it("exige motivo para desconto ou acréscimo", () => {
    expect(() => validateOrderEdit("completed", "counter", -100, "")).toThrow();
    expect(() =>
      validateOrderEdit("completed", "counter", -100, "Desconto combinado"),
    ).not.toThrow();
    expect(() => validateOrderEdit("invalid", "site", 0, "")).toThrow();
  });
});
