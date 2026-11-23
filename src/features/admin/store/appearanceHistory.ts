import type { Catalog, Theme } from "../../../../shared/domain";
import { initialCatalog } from "../../../data";

// Aparência = tema (cores, fonte, tamanho) + cores de cada seção do cardápio.
export type AppearanceState = {
  theme: Theme;
  categories: { id: string; color: string; textColor: string }[];
};
export type HistoryEntry = { at: string; state: AppearanceState };

export const historyLimit = 5;
const storageKey = "fitja:appearance-history";

export const appearanceOf = (c: Pick<Catalog, "theme" | "categories">): AppearanceState => ({
  theme: { ...c.theme },
  categories: c.categories.map(({ id, color, textColor }) => ({ id, color, textColor })),
});

export const sameAppearance = (a: AppearanceState, b: AppearanceState) =>
  JSON.stringify(a) === JSON.stringify(b);

// Aplica o estado guardado sem mexer em nomes, ordem ou produtos. Seções que não existem mais são ignoradas.
export function applyAppearance(c: Catalog, state: AppearanceState): Catalog {
  return {
    ...c,
    theme: { ...state.theme },
    categories: c.categories.map((category) => {
      const saved = state.categories.find((item) => item.id === category.id);
      return saved ? { ...category, color: saved.color, textColor: saved.textColor } : category;
    }),
  };
}

export const factoryAppearance = (): AppearanceState => appearanceOf(initialCatalog);

// Mais recente primeiro; sem repetir o estado do topo; no máximo `historyLimit` versões.
export function pushHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  if (history[0] && sameAppearance(history[0].state, entry.state)) return history;
  return [entry, ...history].slice(0, historyLimit);
}

// Restaurar uma versão não apaga o que estava valendo: o estado atual entra no histórico.
export function restoreFromHistory(
  history: HistoryEntry[],
  index: number,
  current: AppearanceState,
  at = new Date().toISOString(),
): { history: HistoryEntry[]; state: AppearanceState } | null {
  const target = history[index];
  if (!target) return null;
  const rest = history.filter((_, i) => i !== index);
  return { state: target.state, history: pushHistory(rest, { at, state: current }) };
}

export function loadHistory(): HistoryEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value)
      ? value.filter((entry) => entry?.state?.theme && Array.isArray(entry.state.categories)).slice(0, historyLimit)
      : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(history.slice(0, historyLimit)));
  } catch {
    /* O histórico é uma conveniência: se o armazenamento estiver cheio, o painel continua funcionando. */
  }
}
