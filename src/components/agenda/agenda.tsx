"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  List,
  Pencil,
  Phone,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { estiloEstadoTurno } from "@/lib/estados-turno";
import { TurnoEstado } from "@/components/agenda/turno-estado";

// Turno serializado que llega desde el server component (fechas en ISO).
export type TurnoSerializado = {
  id: string;
  titulo: string;
  estado: string;
  fecha: string;
  fechaFin: string | null;
  clienteNombre: string | null;
  clienteTel: string | null;
  presupuestoId: string | null;
  presupuestoNumero: number | null;
};

// Formateadores en el huso horario del navegador (el usuario ve sus turnos
// en su hora local, que es donde los cargó).
const formatoDia = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
});
const formatoHora = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});
const formatoMes = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});

// Clave AAAA-MM-DD de una fecha en hora local (para agrupar por día).
function claveDia(fecha: Date): string {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

// Tarjeta de un turno (compartida por la lista y el detalle del día).
function TurnoCard({ turno }: { turno: TurnoSerializado }) {
  const estado = estiloEstadoTurno(turno.estado);
  const inicio = new Date(turno.fecha);
  const fin = turno.fechaFin ? new Date(turno.fechaFin) : null;

  return (
    <Card className="bg-card text-card-foreground">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {turno.titulo}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}
              >
                {estado.etiqueta}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatoDia.format(inicio)} · {formatoHora.format(inicio)}
              {fin ? ` a ${formatoHora.format(fin)}` : ""}
            </span>
            {turno.clienteNombre && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3" aria-hidden />
                {turno.clienteNombre}
                {turno.clienteTel && (
                  <>
                    {" · "}
                    <Phone className="h-3 w-3" aria-hidden />
                    {turno.clienteTel}
                  </>
                )}
              </span>
            )}
            {turno.presupuestoId && (
              <Link
                href={`/dashboard/presupuestos/${turno.presupuestoId}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="h-3 w-3" aria-hidden />
                Presupuesto
                {turno.presupuestoNumero != null
                  ? ` #${turno.presupuestoNumero}`
                  : ""}
              </Link>
            )}
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-foreground"
          >
            <Link
              href={`/dashboard/agenda/${turno.id}/editar`}
              aria-label={`Editar ${turno.titulo}`}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex justify-end">
          <TurnoEstado turnoId={turno.id} estado={turno.estado} />
        </div>
      </CardContent>
    </Card>
  );
}

// Vista lista: próximos turnos ordenados por fecha.
function VistaLista({ turnos }: { turnos: TurnoSerializado[] }) {
  // "Próximos": desde el inicio del día de hoy (hora local del navegador).
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximos = turnos
    .filter((t) => new Date(t.fecha) >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (proximos.length === 0) {
    return (
      <Card className="bg-card text-card-foreground">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            No tenés turnos próximos. Los turnos pasados se ven en el
            calendario.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {proximos.map((t) => (
        <li key={t.id}>
          <TurnoCard turno={t} />
        </li>
      ))}
    </ul>
  );
}

// Vista calendario mensual: grid propio de días (lunes a domingo), con la
// cantidad de turnos por día; al tocar un día se listan sus turnos abajo.
function VistaCalendario({ turnos }: { turnos: TurnoSerializado[] }) {
  const ahora = new Date();
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth()); // 0-11
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(
    claveDia(ahora),
  );

  // Turnos agrupados por día (clave AAAA-MM-DD en hora local).
  const porDia = useMemo(() => {
    const mapa = new Map<string, TurnoSerializado[]>();
    for (const t of turnos) {
      const clave = claveDia(new Date(t.fecha));
      const lista = mapa.get(clave) ?? [];
      lista.push(t);
      mapa.set(clave, lista);
    }
    // Orden interno por hora.
    mapa.forEach((lista) => lista.sort((a, b) => a.fecha.localeCompare(b.fecha)));
    return mapa;
  }, [turnos]);

  // Celdas del mes: huecos iniciales (semana empieza lunes) + días.
  const celdas = useMemo(() => {
    const primerDia = new Date(anio, mes, 1);
    // getDay(): 0=domingo … 6=sábado → lo pasamos a 0=lunes … 6=domingo.
    const offset = (primerDia.getDay() + 6) % 7;
    const diasDelMes = new Date(anio, mes + 1, 0).getDate();

    const resultado: ({ dia: number; clave: string } | null)[] = [];
    for (let i = 0; i < offset; i++) resultado.push(null);
    for (let dia = 1; dia <= diasDelMes; dia++) {
      resultado.push({ dia, clave: claveDia(new Date(anio, mes, dia)) });
    }
    return resultado;
  }, [anio, mes]);

  function mesAnterior() {
    if (mes === 0) {
      setMes(11);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function mesSiguiente() {
    if (mes === 11) {
      setMes(0);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  }

  const claveHoy = claveDia(new Date());
  const turnosDelDia = diaSeleccionado
    ? (porDia.get(diaSeleccionado) ?? [])
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background text-foreground"
          aria-label="Mes anterior"
          onClick={mesAnterior}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold capitalize text-foreground">
          {formatoMes.format(new Date(anio, mes, 1))}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background text-foreground"
          aria-label="Mes siguiente"
          onClick={mesSiguiente}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid del mes */}
      <div className="rounded-lg border border-border bg-card p-2 text-card-foreground">
        <div className="grid grid-cols-7 gap-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
              aria-hidden
            >
              {d}
            </span>
          ))}
          {celdas.map((celda, i) =>
            celda === null ? (
              <span key={`vacio-${i}`} />
            ) : (
              <button
                key={celda.clave}
                type="button"
                onClick={() => setDiaSeleccionado(celda.clave)}
                aria-label={`Ver turnos del día ${celda.dia}`}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm transition-colors ${
                  diaSeleccionado === celda.clave
                    ? "bg-primary text-primary-foreground"
                    : celda.clave === claveHoy
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span>{celda.dia}</span>
                {(porDia.get(celda.clave)?.length ?? 0) > 0 && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      diaSeleccionado === celda.clave
                        ? "bg-primary-foreground"
                        : "bg-primary"
                    }`}
                    aria-hidden
                  />
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Turnos del día seleccionado */}
      {diaSeleccionado && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold capitalize text-foreground">
            {formatoDia.format(new Date(`${diaSeleccionado}T12:00:00`))}
          </h3>
          {turnosDelDia.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin turnos este día.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {turnosDelDia.map((t) => (
                <li key={t.id}>
                  <TurnoCard turno={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Agenda completa: toggle entre vista lista y vista calendario.
export function Agenda({ turnos }: { turnos: TurnoSerializado[] }) {
  const [vista, setVista] = useState<"lista" | "calendario">("lista");

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle de vista */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={vista === "lista" ? "default" : "outline"}
          size="sm"
          className={
            vista === "lista"
              ? "gap-1.5 bg-primary text-primary-foreground"
              : "gap-1.5 bg-background text-foreground"
          }
          onClick={() => setVista("lista")}
        >
          <List className="h-4 w-4" />
          Lista
        </Button>
        <Button
          type="button"
          variant={vista === "calendario" ? "default" : "outline"}
          size="sm"
          className={
            vista === "calendario"
              ? "gap-1.5 bg-primary text-primary-foreground"
              : "gap-1.5 bg-background text-foreground"
          }
          onClick={() => setVista("calendario")}
        >
          <CalendarDays className="h-4 w-4" />
          Calendario
        </Button>
      </div>

      {vista === "lista" ? (
        <VistaLista turnos={turnos} />
      ) : (
        <VistaCalendario turnos={turnos} />
      )}
    </div>
  );
}
