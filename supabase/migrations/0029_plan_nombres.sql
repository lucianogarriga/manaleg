-- Renombra los valores de profiles.plan: free / intermedio / pro -> free / pro / full
-- El orden importa: primero se libera 'pro' (pasa a 'full') y después 'intermedio' pasa a 'pro'.
UPDATE public.profiles SET plan = 'full' WHERE plan = 'pro';
UPDATE public.profiles SET plan = 'pro'  WHERE plan = 'intermedio';
