export const PASSWORD_MIN = 10;

// Mínimo 10 caracteres, con mayúscula, minúscula y número (igual que Supabase Auth).
// Devuelve el error, o null si la contraseña es válida.
export function validarPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    return "La contraseña debe tener mayúsculas, minúsculas y números.";
  return null;
}
