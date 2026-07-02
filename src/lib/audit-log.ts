// Registro estructurado de eventos críticos de seguridad y negocio.
// Escribe una línea JSON a stdout (capturada por los logs del hosting).
// Nunca incluye secretos ni contraseñas: solo identificadores y metadatos.

export type EventoAuditoria =
  | "login"
  | "logout"
  | "registro"
  | "onboarding.completar"
  | "presupuesto.crear"
  | "presupuesto.eliminar"
  | "cliente.crear"
  | "cliente.actualizar"
  | "material.crear"
  | "material.actualizar"
  | "material.eliminar"
  | "material.ajustar"
  | "turno.crear"
  | "turno.actualizar"
  | "turno.estado"
  | "presupuesto.enviar"
  | "presupuesto.firmar"
  | "pdf.generar"
  | "config.actualizar"
  | "cuenta.eliminar.solicitud"
  | "plan.upgrade.iniciar"
  | "admin.accion"
  | "ratelimit.bloqueo";

type Meta = Record<string, string | number | boolean | null | undefined>;

// Registra un evento de auditoría. Nunca lanza: el logging no debe romper
// el request bajo ninguna circunstancia.
export function auditar(evento: EventoAuditoria, meta: Meta = {}): void {
  try {
    console.info(
      JSON.stringify({ t: new Date().toISOString(), auditoria: evento, ...meta }),
    );
  } catch {
    /* el logging nunca debe romper el flujo */
  }
}
