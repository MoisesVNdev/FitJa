import { describe, expect, it } from "vitest";
import { initialCatalog } from "../src/data";
import { highlightsError, highlightVisible, maxHighlights, validateCatalog, type Highlight } from "../shared/domain";

const png = "data:image/png;base64,iVBORw0KGgo=";
const base = (over: Partial<Highlight> = {}): Highlight => ({ id: "a", title: "Feriado", text: "Fechado", active: true, ...over });

describe("avisos do carrossel", () => {
  it("aceita aviso com texto, com imagem e só com imagem", () => {
    expect(highlightsError([base(), base({ id: "b", image: png }), base({ id: "c", title: "", text: "", image: png })])).toBeNull();
  });
  it("recusa aviso vazio, limite excedido, imagem de formato inválido e datas invertidas", () => {
    expect(highlightsError([base({ title: "", text: "" })])).toMatch(/título ou.*imagem/);
    expect(highlightsError(Array.from({ length: maxHighlights + 1 }, (_, i) => base({ id: String(i) })))).toMatch(/até 8/);
    expect(highlightsError([base({ image: "data:image/gif;base64,AAAA" })])).toMatch(/Imagem do aviso/);
    expect(highlightsError([base({ image: "javascript:alert(1)" })])).toMatch(/Imagem do aviso/);
    expect(highlightsError([base({ from: "2026-12-10", until: "2026-12-01" })])).toMatch(/data final/);
    expect(highlightsError([base(), base()])).toMatch(/repetido/);
  });
  it("respeita ativo e período de exibição", () => {
    const item = base({ from: "2026-12-01", until: "2026-12-05" });
    expect(highlightVisible(item, "2026-11-30")).toBe(false);
    expect(highlightVisible(item, "2026-12-03")).toBe(true);
    expect(highlightVisible(item, "2026-12-06")).toBe(false);
    expect(highlightVisible({ ...item, active: false }, "2026-12-03")).toBe(false);
  });
  it("o catálogo válido continua válido com avisos, e os atuais sem avisos também", () => {
    expect(() => validateCatalog({ ...initialCatalog, highlights: [base()] })).not.toThrow();
    expect(() => validateCatalog(initialCatalog)).not.toThrow();
    expect(() => validateCatalog({ ...initialCatalog, highlights: [base({ image: "x" })] })).toThrow();
  });
});
