"use client";

import { useEffect } from "react";
import { createClient } from "@/services/supabase/client";

// Avisa al servidor que la cuenta está activa, para el contador "en línea" del panel admin.
// La función de la base solo escribe si pasaron más de 2 minutos desde la última vez,
// así que llamarla cada minuto no genera escrituras de más.
const INTERVALO_MS = 60_000;

export default function Heartbeat() {
  useEffect(() => {
    const supabase = createClient();

    const latir = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await supabase.rpc("registrar_actividad");
      } catch (err) {
        // La actividad es un dato secundario: si falla, la app sigue funcionando igual.
        console.error("[Heartbeat] no se pudo registrar la actividad", err);
      }
    };

    latir();
    const intervalo = setInterval(latir, INTERVALO_MS);
    document.addEventListener("visibilitychange", latir);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", latir);
    };
  }, []);

  return null;
}
