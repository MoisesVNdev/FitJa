import { describe, expect, it } from "vitest";
import { initialCatalog } from "../src/data";
import {
  appearanceOf, applyAppearance, factoryAppearance, historyLimit, pushHistory, restoreFromHistory,
  type HistoryEntry,
} from "../src/features/admin/store/appearanceHistory";

const entry = (primary: string, n = 0): HistoryEntry => ({
  at: new Date(2026, 10, 22, 10, n).toISOString(),
  state: { ...appearanceOf(initialCatalog), theme: { ...initialCatalog.theme, primary } },
});

describe("histórico de aparência", () => {
  it("guarda no máximo 5 versões, a mais recente primeiro", () => {
    let history: HistoryEntry[] = [];
    for (let i = 0; i < 8; i++) history = pushHistory(history, entry(`#00000${i}`, i));
    expect(history).toHaveLength(historyLimit);
    expect(history[0].state.theme.primary).toBe("#000007");
  });

  it("não repete a mesma versão em sequência", () => {
    const first = pushHistory([], entry("#112233"));
    expect(pushHistory(first, entry("#112233", 5))).toHaveLength(1);
  });

  it("restaurar devolve a versão escolhida e guarda a que estava valendo", () => {
    const history = [entry("#111111", 1), entry("#222222", 2)];
    const current = { ...appearanceOf(initialCatalog), theme: { ...initialCatalog.theme, primary: "#333333" } };
    const result = restoreFromHistory(history, 1, current)!;
    expect(result.state.theme.primary).toBe("#222222");
    expect(result.history.map((h) => h.state.theme.primary)).toEqual(["#333333", "#111111"]);
  });

  it("padrão de fábrica volta à marca e mantém nomes e ordem das seções", () => {
    const custom = {
      ...initialCatalog,
      theme: { ...initialCatalog.theme, primary: "#0000FF" },
      categories: initialCatalog.categories.map((c, i) => i === 0 ? { ...c, name: "Meu nome", color: "#123456" } : c),
    };
    const restored = applyAppearance(custom, factoryAppearance());
    expect(restored.theme).toEqual(initialCatalog.theme);
    expect(restored.categories[0].name).toBe("Meu nome");
    expect(restored.categories[0].color).toBe(initialCatalog.categories[0].color);
  });

  it("ignora seções que não existem mais ao restaurar", () => {
    const state = { ...appearanceOf(initialCatalog), categories: [{ id: "removida", color: "#ffffff", textColor: "#000000" }] };
    expect(applyAppearance(initialCatalog, state).categories).toEqual(initialCatalog.categories);
  });
});
