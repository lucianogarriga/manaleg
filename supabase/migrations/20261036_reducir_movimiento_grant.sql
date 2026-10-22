-- profiles tiene UPDATE revocado y concedido por columna: la columna nueva necesita su propio GRANT
-- para que el usuario pueda guardar la preferencia desde Ajustes.
GRANT UPDATE (reducir_movimiento) ON public.profiles TO authenticated;
