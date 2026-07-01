// Control de acceso al panel de administración.
// El admin es el email configurado en la variable de entorno ADMIN_EMAIL.
// Si no está seteada, NADIE es admin (acceso denegado por defecto).
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

export function esEmailAdmin(email?: string | null): boolean {
  if (!ADMIN_EMAIL) return false;
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
