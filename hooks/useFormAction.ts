"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import type { FormState } from "@/types";

// Envuelve un Server Action para formularios en modal.
// - Submit manual: con <form action> React 19 vacía el form al terminar y,
//   si hubo un error de validación, se perdería todo lo cargado.
// - Ejecuta onSuccess cuando la acción devuelve un `message` (sin error).
export function useFormAction(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  onSuccess: (state: FormState) => void,
) {
  const [state, dispatch, pending] = useActionState(action, {} as FormState);
  const [, startTransition] = useTransition();

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state.message && !state.error) onSuccessRef.current(state);
  }, [state]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return { state, pending, onSubmit };
}
