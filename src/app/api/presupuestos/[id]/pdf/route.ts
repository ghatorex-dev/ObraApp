import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import PDFDocument from "pdfkit";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { agruparPorCategoria } from "@/lib/categorias";
import { auditar } from "@/lib/audit-log";

// PDFKit necesita el runtime de Node (no Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/presupuestos/[id]/pdf — genera el PDF del presupuesto.
// Solo el dueño puede descargarlo. El presupuesto de ejemplo no es descargable.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Buscamos el presupuesto asegurando que pertenezca al usuario.
  const presupuesto = await prisma.presupuesto.findFirst({
    where: { id: params.id, userId },
    include: { items: true, user: { select: { name: true } } },
  });

  if (!presupuesto) {
    return NextResponse.json(
      { error: "Presupuesto no encontrado." },
      { status: 404 },
    );
  }

  // El presupuesto de ejemplo no se puede descargar.
  if (presupuesto.esEjemplo) {
    return NextResponse.json(
      { error: "El presupuesto de ejemplo no se puede descargar." },
      { status: 403 },
    );
  }

  const { grupos, unRubro } = agruparPorCategoria(presupuesto.items);
  const nombreUsuario = presupuesto.user.name ?? "";

  let pdf: Buffer;
  try {
    pdf = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Encabezado: marca, número y nombre del usuario.
      doc.fontSize(20).fillColor("#0f172a").text("ObraApp");
      doc
        .fontSize(14)
        .fillColor("#334155")
        .text(`Presupuesto #${presupuesto.numero}`);
      if (nombreUsuario) {
        doc.fontSize(10).fillColor("#64748b").text(`De: ${nombreUsuario}`);
      }
      doc
        .fontSize(10)
        .fillColor("#64748b")
        .text(
          `Fecha: ${new Intl.DateTimeFormat("es-AR").format(presupuesto.creadoAt)}`,
        );
      doc.moveDown();

      // Datos del cliente.
      doc.fontSize(12).fillColor("#0f172a").text("Cliente");
      doc.fontSize(10).fillColor("#334155").text(presupuesto.clienteNombre);
      if (presupuesto.clienteEmail) doc.text(presupuesto.clienteEmail);
      if (presupuesto.clienteTel) doc.text(presupuesto.clienteTel);
      doc.moveDown();

      // Título del trabajo.
      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .text(`Trabajo: ${presupuesto.titulo}`);
      doc.moveDown();

      // Detalle: agrupado por rubro con subtotales. Si hay un solo rubro,
      // no mostramos subtítulos de categoría.
      doc.fontSize(12).fillColor("#0f172a").text("Detalle");
      doc.moveDown(0.3);

      for (const grupo of grupos) {
        if (!unRubro) {
          doc
            .fontSize(11)
            .fillColor("#0f172a")
            .text(grupo.etiqueta);
        }
        for (const item of grupo.items) {
          doc
            .fontSize(10)
            .fillColor("#334155")
            .text(`• ${item.descripcion}`);
          doc
            .fontSize(9)
            .fillColor("#64748b")
            .text(
              `   ${item.cantidad} x ${formatearPesos(item.precioUnitario)} = ${formatearPesos(item.subtotal)}`,
            );
        }
        // Subtotal por rubro solo cuando hay más de un rubro.
        if (!unRubro) {
          doc
            .fontSize(10)
            .fillColor("#334155")
            .text(`Subtotal ${grupo.etiqueta}: ${formatearPesos(grupo.subtotal)}`, {
              align: "right",
            });
        }
        doc.moveDown(0.5);
      }
      doc.moveDown(0.3);

      // Total general.
      doc
        .fontSize(14)
        .fillColor("#0f172a")
        .text(`Total: ${formatearPesos(presupuesto.total)}`, {
          align: "right",
        });

      doc.end();
    });
  } catch (error) {
    // Manejo de excepciones de PDFKit: nunca exponemos el detalle.
    console.error("Error generando el PDF:", error);
    return NextResponse.json(
      { error: "No se pudo generar el PDF. Probá de nuevo." },
      { status: 500 },
    );
  }

  auditar("pdf.generar", { presupuestoId: presupuesto.id, userId });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${presupuesto.numero}.pdf"`,
    },
  });
}
