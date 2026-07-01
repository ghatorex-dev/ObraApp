import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import PDFDocument from "pdfkit";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { etiquetaCategoria } from "@/lib/categorias";

// PDFKit necesita el runtime de Node (no Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/presupuestos/[id]/pdf — genera el PDF del presupuesto.
// Solo el dueño del presupuesto puede descargarlo.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Buscamos el presupuesto asegurando que pertenezca al usuario.
  const presupuesto = await prisma.presupuesto.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });

  if (!presupuesto) {
    return NextResponse.json(
      { error: "Presupuesto no encontrado." },
      { status: 404 },
    );
  }

  // Generamos el PDF en memoria.
  const pdf = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Encabezado.
    doc.fontSize(20).fillColor("#0f172a").text("ObraApp", { continued: false });
    doc
      .fontSize(14)
      .fillColor("#334155")
      .text(`Presupuesto #${presupuesto.numero}`);
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

    // Título.
    doc.fontSize(12).fillColor("#0f172a").text(`Trabajo: ${presupuesto.titulo}`);
    doc.moveDown();

    // Detalle de ítems.
    doc.fontSize(12).fillColor("#0f172a").text("Detalle");
    doc.moveDown(0.3);
    for (const item of presupuesto.items) {
      doc
        .fontSize(10)
        .fillColor("#334155")
        .text(
          `• ${item.descripcion} (${etiquetaCategoria(item.categoria)})`,
        );
      doc
        .fontSize(9)
        .fillColor("#64748b")
        .text(
          `   ${item.cantidad} x ${formatearPesos(item.precioUnitario)} = ${formatearPesos(item.subtotal)}`,
        );
    }
    doc.moveDown();

    // Total.
    doc
      .fontSize(14)
      .fillColor("#0f172a")
      .text(`Total: ${formatearPesos(presupuesto.total)}`, { align: "right" });

    doc.end();
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${presupuesto.numero}.pdf"`,
    },
  });
}
