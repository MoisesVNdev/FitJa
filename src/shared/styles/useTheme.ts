import { useEffect } from "react";
import { type Catalog } from "../../../shared/domain";

// Use a small explicit font set; no arbitrary remote font or script is accepted by the editor.
export function useTheme(c: Catalog | null) {
  useEffect(() => {
    if (!c) return;
    const t = c.theme,
      root = document.documentElement;
    root.style.setProperty("--primary", t.primary);
    root.style.setProperty("--primary-text", t.primaryText);
    root.style.setProperty("--page", t.background);
    root.style.setProperty("--surface", t.surface);
    root.style.setProperty("--ink", t.text);
    root.style.setProperty("--font", `"${t.font}", sans-serif`);
    root.style.fontSize = `${16 * t.scale}px`;
    if (t.font === "DM Sans") void import("@fontsource/dm-sans/400.css");
    if (t.font === "Manrope") void import("@fontsource/manrope/400.css");
  }, [c?.theme]);
}
