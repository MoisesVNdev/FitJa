import { describe, expect, it } from "vitest";
import { fallbackRandomUUID } from "../src/shared/polyfills";

describe("UUID em contexto não seguro", () => {
  it("gera UUID v4 no formato esperado", () => {
    expect(fallbackRandomUUID()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("gera identificadores diferentes a cada chamada", () => {
    const ids = new Set(Array.from({ length: 200 }, () => fallbackRandomUUID()));
    expect(ids.size).toBe(200);
  });
});
