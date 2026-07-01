import type { Metadata } from "next";

import { LegalShell, LegalSeccion } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Política de Privacidad — ObraApp",
  description: "Política de Privacidad de ObraApp.",
};

// Email de contacto (placeholder — reemplazar por el real).
const EMAIL_CONTACTO = "hola@obraapp.app";

export default function PrivacidadPage() {
  return (
    <LegalShell
      titulo="Política de Privacidad"
      actualizado="1 de julio de 2026"
    >
      <p>
        En ObraApp cuidamos tus datos. Esta política explica qué datos
        recopilamos, para qué los usamos y cuáles son tus derechos.
      </p>

      <LegalSeccion titulo="1. Datos que recopilamos">
        <ul className="list-inside list-disc">
          <li>Nombre y email (al registrarte).</li>
          <li>País (en el onboarding).</li>
          <li>Presupuestos y datos de clientes que cargás en la app.</li>
          <li>Dirección IP del cliente al momento de firmar un presupuesto.</li>
          <li>Cookies de sesión necesarias para mantenerte identificado.</li>
        </ul>
      </LegalSeccion>

      <LegalSeccion titulo="2. Para qué usamos los datos">
        <ul className="list-inside list-disc">
          <li>Proveer y operar el Servicio.</li>
          <li>Generar tus presupuestos y su firma digital.</li>
          <li>Mejorar la app y brindar soporte.</li>
        </ul>
      </LegalSeccion>

      <LegalSeccion titulo="3. Con quién compartimos datos">
        <p>
          Compartimos datos únicamente con los proveedores necesarios para
          operar el Servicio (por ejemplo, alojamiento y base de datos). No
          vendemos tus datos a terceros bajo ninguna circunstancia.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="4. Tiempo de retención">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Podés solicitar
          la eliminación de tu cuenta y de tus datos en cualquier momento.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="5. Tus derechos">
        <p>
          De acuerdo con la Ley 25.326 de Protección de Datos Personales de la
          República Argentina, tenés derecho a acceder, rectificar, actualizar y
          suprimir tus datos personales.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="6. Cómo ejercer tus derechos">
        <p>
          Para ejercer cualquiera de tus derechos o solicitar la eliminación de
          tu cuenta, escribinos a{" "}
          <a
            href={`mailto:${EMAIL_CONTACTO}`}
            className="font-medium text-primary hover:underline"
          >
            {EMAIL_CONTACTO}
          </a>
          . También encontrás el botón &quot;Solicitar eliminación de cuenta&quot;
          en Configuración.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="7. Seguridad">
        <p>
          Protegemos tus datos con conexión cifrada (HTTPS), contraseñas
          hasheadas y acceso restringido. Ningún sistema es 100% infalible, pero
          trabajamos para mantener tus datos seguros.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="8. Cookies">
        <p>
          Usamos solo cookies de sesión necesarias para el funcionamiento de la
          app. No usamos cookies de publicidad ni de seguimiento de terceros.
        </p>
      </LegalSeccion>

      <LegalSeccion titulo="9. Contacto">
        <p>
          Por cualquier consulta sobre privacidad escribinos a{" "}
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
