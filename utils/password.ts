export const PASSWORD_MIN = 10;

// Mínimo 10 caracteres, con al menos una letra y un número. Devuelve el error, o null si es válida.
export function validarPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "La contraseña debe incluir letras y números.";
  return null;
}
