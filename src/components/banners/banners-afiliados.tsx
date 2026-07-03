import type { Categoria } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Muestra los banners de afiliados activos relevantes al contexto: los del/los
// rubro(s) indicado(s) + los genéricos (categoria null), ordenados por `orden`.
//
// Si no hay ninguno, NO renderiza nada (ni título ni espacio vacío): la sección
// simplemente desaparece. Es un server component (consulta la base).
export async function BannersAfiliados({
  categorias,
}: {
  // Rubros del contexto. Si se omite, solo se muestran los genéricos.
  categorias?: Categoria[];
}) {
  const rubros = categorias ?? [];

  const banners = await prisma.bannerAfiliado.findMany({
    where: {
      activo: true,
      OR: [
        { categoria: null },
        ...(rubros.length > 0 ? [{ categoria: { in: rubros } }] : []),
      ],
    },
    orderBy: [{ orden: "asc" }, { creadoAt: "desc" }],
    select: { id: true, titulo: true, imagenUrl: true, linkDestino: true },
  });

  // Estado vacío silencioso: no mostramos nada.
  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Publicidad"
      className="flex flex-col gap-3"
    >
      {banners.map((banner) => (
        <a
          key={banner.id}
          href={banner.linkDestino}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border border-border bg-card"
        >
          {/* Imagen externa: usamos <img> para no configurar dominios remotos.
              El CSP ya permite img-src https. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imagenUrl}
            alt={banner.titulo}
            loading="lazy"
            className="h-auto w-full"
          />
        </a>
      ))}
    </section>
  );
}
