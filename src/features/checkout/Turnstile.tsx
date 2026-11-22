import { readCart, persistCart } from "../../shared/api/cart";
import { useEffect, useRef } from "react";
import { Notice } from "../../shared/ui";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const container = useRef<HTMLDivElement>(null),
    callback = useRef(onToken);
  callback.current = onToken;
  useEffect(() => {
    let id: string | undefined,
      disposed = false;
    const render = () => {
      if (disposed || !container.current || !window.turnstile) return;
      id = window.turnstile.render(container.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
        callback: (t: string) => callback.current(t),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
    };
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile]",
    );
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement("script");
        script.dataset.turnstile = "true";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        document.head.append(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      disposed = true;
      script?.removeEventListener("load", render);
      if (id) window.turnstile?.remove(id);
      callback.current("");
    };
  }, []);
  if (!import.meta.env.VITE_TURNSTILE_SITE_KEY)
    return (
      <Notice error>
        A verificação de segurança ainda não foi configurada pela loja.
      </Notice>
    );
  return <div ref={container} className="turnstile" />;
}
