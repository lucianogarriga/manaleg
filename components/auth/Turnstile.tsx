"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// CAPTCHA de Cloudflare Turnstile. Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no muestra nada.
// El token viaja en el campo oculto "captcha_token" del formulario que lo contiene.
export default function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const contenedor = useRef<HTMLDivElement>(null);
  const tokenInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!siteKey || !contenedor.current) return;
    let widgetId: string | undefined;

    // Si el CAPTCHA falla, el formulario sigue funcionando (sin token). Nunca debe tirar la página.
    const renderizar = () => {
      if (!window.turnstile || !contenedor.current) return;
      try {
        widgetId = window.turnstile.render(contenedor.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (tokenInput.current) tokenInput.current.value = token;
          },
          "expired-callback": () => {
            if (tokenInput.current) tokenInput.current.value = "";
          },
          "error-callback": () => {
            if (tokenInput.current) tokenInput.current.value = "";
          },
        });
      } catch (err) {
        console.error("[Turnstile] no se pudo renderizar", err);
      }
    };

    if (window.turnstile) {
      renderizar();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderizar);
      return () => script?.removeEventListener("load", renderizar);
    }

    // Al cambiar de página el widget se quita; un error acá no debe romper la navegación
    return () => {
      try {
        if (widgetId && window.turnstile) {
          if (window.turnstile.remove) window.turnstile.remove(widgetId);
          else window.turnstile.reset(widgetId);
        }
      } catch (err) {
        console.error("[Turnstile] error al limpiar el widget", err);
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <input ref={tokenInput} type="hidden" name="captcha_token" defaultValue="" />
      <div ref={contenedor} className="flex justify-center" />
    </>
  );
}
