"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import type { Categoria } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esEmailAdmin } from "@/lib/admin";
import { bannerSchema, type BannerInput } from "@/lib/validations";
import { auditar } from "@/lib/audit-log";

export type BannerResultado =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Verifica que quien ejecuta la acción sea el admin, comprobando el email
// CONTRA LA BASE (no confiamos solo en la sesión). Devuelve el email o null.
async function verificarAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!esEmailAdmin(usuario?.email)) return null;
  return usuario!.email;
}

// Normaliza la categoría del formulario: "" o ausente => null (genérico).
function normalizarCategoria(valor?: string): Categoria | null {
  return valor ? (valor as Categoria) : null;
}

// Revalida las rutas donde se ven los banners.
function revalidarBanners() {
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

// Crea un banner de afiliado.
export async function crearBanner(
  input: BannerInput,
): Promise<BannerResultado> {
  const emailAdmin = await verificarAdmin();
  if (!emailAdmin) {
    return { ok: false, error: "No autorizado." };
  }

  const parseo = bannerSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const banner = await prisma.bannerAfiliado.create({
    data: {
      titulo: d.titulo,
      imagenUrl: d.imagenUrl,
      linkDestino: d.linkDestino,
      categoria: normalizarCategoria(d.categoria),
      orden: d.orden,
      activo: d.activo ?? true,
    },
    select: { id: true },
  });

  auditar("banner.crear", { bannerId: banner.id, admin: emailAdmin });
  revalidarBanners();
  return { ok: true, id: banner.id };
}

// Actualiza un banner existente.
export async function actualizarBanner(
  id: string,
  input: BannerInput,
): Promise<BannerResultado> {
  const emailAdmin = await verificarAdmin();
  if (!emailAdmin) {
    return { ok: false, error: "No autorizado." };
  }

  const parseo = bannerSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const resultado = await prisma.bannerAfiliado.updateMany({
    where: { id },
    data: {
      titulo: d.titulo,
      imagenUrl: d.imagenUrl,
      linkDestino: d.linkDestino,
      categoria: normalizarCategoria(d.categoria),
      orden: d.orden,
      ...(d.activo !== undefined ? { activo: d.activo } : {}),
    },
  });

  if (resultado.count === 0) {
    return { ok: false, error: "Banner no encontrado." };
  }

  auditar("banner.actualizar", { bannerId: id, admin: emailAdmin });
  revalidarBanners();
  return { ok: true, id };
}

// Activa o desactiva un banner (se audita como actualización).
export async function alternarActivoBanner(
  id: string,
): Promise<BannerResultado> {
  const emailAdmin = await verificarAdmin();
  if (!emailAdmin) {
    return { ok: false, error: "No autorizado." };
  }

  const banner = await prisma.bannerAfiliado.findUnique({
    where: { id },
    select: { activo: true },
  });
  if (!banner) {
    return { ok: false, error: "Banner no encontrado." };
  }

  await prisma.bannerAfiliado.update({
    where: { id },
    data: { activo: !banner.activo },
  });

  auditar("banner.actualizar", {
    bannerId: id,
    admin: emailAdmin,
    activo: !banner.activo,
  });
  revalidarBanners();
  return { ok: true, id };
}

// Elimina un banner.
export async function eliminarBanner(id: string): Promise<BannerResultado> {
  const emailAdmin = await verificarAdmin();
  if (!emailAdmin) {
    return { ok: false, error: "No autorizado." };
  }

  const resultado = await prisma.bannerAfiliado.deleteMany({ where: { id } });
  if (resultado.count === 0) {
    return { ok: false, error: "Banner no encontrado." };
  }

  auditar("banner.eliminar", { bannerId: id, admin: emailAdmin });
  revalidarBanners();
  return { ok: true, id };
}
