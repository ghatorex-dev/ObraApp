// Formatea un monto como pesos argentinos (ARS).
export function formatearPesos(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(monto) ? monto : 0);
}
