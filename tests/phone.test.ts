import { describe, expect, it } from "vitest";
import { formatNational, nationalDigits, storedFromInput } from "../src/shared/phone";
import { validPhone } from "../shared/domain";

describe("telefone do WhatsApp", () => {
  it("guarda com 55 na frente a partir de DDD + número", () => {
    expect(storedFromInput("(81) 99999-9999")).toBe("5581999999999");
    expect(validPhone(storedFromInput("(81) 99999-9999"))).toBe(true);
    expect(storedFromInput("")).toBe("");
  });
  it("aceita número colado com 55 e não duplica", () => {
    expect(storedFromInput("5581999999999")).toBe("5581999999999");
    expect(storedFromInput("+55 (81) 99999-9999")).toBe("5581999999999");
  });
  it("DDD 55 digitado não é confundido com o código do país", () => {
    expect(storedFromInput("55")).toBe("5555");
    expect(storedFromInput("55999998888")).toBe("5555999998888");
  });
  it("mostra só DDD + número, formatado enquanto digita", () => {
    expect(nationalDigits("5581999999999")).toBe("81999999999");
    expect(formatNational("8")).toBe("(8");
    expect(formatNational("81")).toBe("(81");
    expect(formatNational("819999")).toBe("(81) 9999");
    expect(formatNational("8199999999")).toBe("(81) 9999-9999");
    expect(formatNational("81999999999")).toBe("(81) 99999-9999");
  });
});
