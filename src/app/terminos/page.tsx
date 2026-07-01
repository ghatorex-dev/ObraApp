import type { Metadata } from "next";

import { LegalShell, LegalSeccion } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Términos y Condiciones — ObraApp",
  description: "Términos y Condiciones de uso de ObraApp.",
};

// Email de contacto (placeholder — reemplazar por el real).
const EMAIL_CONTACTO = "hola@obraapp.app";

export default function TerminosPage() {
  return (
    <LegalShell titulo="Términos y Condiciones" actualizado="1 de julio de 2026">
      <p>
        Estos Términos y Condiciones regulan el uso de ObraApp (el
        &quot;Servicio&quot;). Al crear una cuenta o usar el Servicio, aceptás
        estos términos.
      </p>

      <LegalSeccion titulo="1. Aceptación de los términos">
        <p>
          El uso de ObraApp implica la aceptación plena de estos términos. Si no
          estás de acuerdo, no debés usar el Servicio.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="2. Descripción del servicio">
        <p>
          ObraApp es una herramienta para que profesionales de la construcción
          y oficios (plomería, gas, albañilería y pintura) creen presupuestos,
          los envíen a sus clientes y reciban una firma digital de aceptación.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="3. Registro y cuenta">
        <p>
          Sos responsable de la veracidad de los datos de tu cuenta y de
          mantener segura tu contraseña. Sos responsable de la actividad que
          ocurra bajo tu cuenta.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="4. Planes y pagos">
        <p>
          El plan Free permite crear hasta 3 presupuestos por mes. El plan Pro
          ofrece presupuestos ilimitados por USD 4,99 por mes. Los precios
          pueden actualizarse con aviso previo.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="5. Uso permitido">
        <p>
          No está permitido usar el Servicio para fines ilícitos, ni intentar
          vulnerar su seguridad o la de otros usuarios.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="6. Propiedad intelectual">
        <p>
          El software, la marca y el diseño de ObraApp son de su titular. Los
          datos que cargás (presupuestos, clientes) son de tu propiedad.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="7. Limitación de responsabilidad">
        <p>
          El Servicio se ofrece &quot;tal cual&quot;. ObraApp no se responsabiliza
          por pérdidas económicas derivadas del uso o la imposibilidad de uso
          del Servicio. Sos responsable de verificar la información de tus
          presupuestos antes de enviarlos.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="8. Modificaciones">
        <p>
          Podemos actualizar estos términos. Los cambios relevantes se
          notificarán con anticipación razonable.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="9. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante
          cualquier controversia, las partes se someten a los tribunales
          ordinarios competentes de la Argentina.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="10. Contacto">
        <p>
          Por consultas sobre estos términos escribinos a{" "}
          <a
            href={`mailto:${EMAIL_CONTACTO}`}
            className="font-medium text-primary hover:underline"
          >
            {EMAIL_CONTACTO}
          </a>
          .
        </p>
      </LegalSeccion>
    </LegalShell>
  );
}
