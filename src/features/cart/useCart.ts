import { useEffect, useState } from "react";
import type { CartLine } from "../../../shared/domain";
import { readCart, persistCart } from "../../shared/api/cart";

export function useCart(preview: boolean, report: (message: string) => void) {
  const [cart, setCart] = useState<CartLine[]>(preview ? [] : readCart);
  useEffect(() => {
    if (preview) return;
    try { persistCart(cart); }
    catch (error) { report((error as Error).message); }
  }, [cart, preview, report]);
  return { cart, setCart };
}
