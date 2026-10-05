import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Términos y Condiciones — MANALEG" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-[720px]">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-blue">
            <Scale size={16} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-[16px] font-bold tracking-[.4px] text-text">MANALEG</span>
        </div>

        <h1 className="mb-2 text-[26px] font-bold text-text">Términos y Condiciones</h1>
        <p className="mb-8 text-[13px] text-muted">Versión 1.0 — vigente desde el 1 de octubre de 2026</p>

        <div className="prose-legal">
          <Section title="1. Aceptación de los términos">
            <p>Estos Términos y Condiciones regulan el acceso y uso de MANALEG. Al crear una cuenta, el usuario declara haber leído, comprendido y aceptado íntegramente las condiciones aquí establecidas, así como la Política de Privacidad vigente.</p>
            <p>Si el usuario actúa en nombre de una firma o estudio jurídico, declara tener facultades suficientes para obligar a dicha organización. En caso de no estar de acuerdo con alguna de estas condiciones, deberá abstenerse de utilizar el servicio.</p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>MANALEG es una plataforma de gestión de causas judiciales y clientes orientada a profesionales del derecho. Permite registrar causas, movimientos, vencimientos, eventos, honorarios, pagos y configurar alertas automatizadas.</p>
            <p>El servicio se presta en modalidad SaaS (Software como Servicio) mediante suscripción. Las funcionalidades disponibles dependen del plan vigente. MANALEG puede incorporar nuevas funciones, modificar las existentes o discontinuar módulos específicos, con notificación previa al usuario.</p>
          </Section>

          <Section title="3. Condiciones de uso">
            <ul>
              <li>Solo pueden registrarse personas mayores de 18 años con plena capacidad legal.</li>
              <li>Cada usuario es el único responsable de mantener la confidencialidad de sus credenciales de acceso. Ante cualquier uso no autorizado de su cuenta, debe notificarlo de inmediato a MANALEG.</li>
              <li>Queda prohibido compartir el acceso con terceros no autorizados o utilizar la cuenta de forma simultánea desde múltiples dispositivos no propios.</li>
              <li>El usuario se compromete a utilizar la plataforma exclusivamente para fines lícitos y compatibles con el ejercicio profesional del derecho.</li>
              <li>No está permitido intentar acceder a cuentas, datos o sistemas de otros usuarios, ni realizar ingeniería inversa, scraping o cualquier acción que comprometa la integridad de la plataforma.</li>
            </ul>
          </Section>

          <Section title="4. Datos, contenido y responsabilidad del usuario">
            <p>El usuario es el único y exclusivo responsable de la exactitud, veracidad, legalidad y licitud de los datos, documentos e información que ingresa en la plataforma, incluyendo los datos personales de sus clientes, partes y terceros relacionados con sus causas.</p>
            <p>MANALEG actúa como encargado del tratamiento de dichos datos por cuenta del usuario (el profesional del derecho), quien reviste la condición de responsable del tratamiento en los términos de la Ley N° 25.326. En consecuencia, es obligación exclusiva del usuario:</p>
            <ul>
              <li>Contar con las habilitaciones legales correspondientes para el tratamiento de datos personales de sus clientes y terceros.</li>
              <li>Informar a los titulares de los datos sobre su recopilación y finalidad, conforme al art. 6 de la Ley 25.326.</li>
              <li>Garantizar que los datos ingresados en la plataforma no vulneren derechos de terceros ni disposiciones legales aplicables.</li>
              <li>Observar las normas de ética y confidencialidad propias de la profesión jurídica respecto de la información cargada.</li>
            </ul>
            <p>MANALEG no accede, revisa ni utiliza los datos de causas o clientes ingresados por el usuario, salvo lo estrictamente necesario para la prestación técnica del servicio o en cumplimiento de una orden judicial o requerimiento legal.</p>
            <p><strong>MANALEG no asume responsabilidad alguna</strong> por el contenido cargado por el usuario, por el uso que este haga de la información almacenada, por errores en la carga de vencimientos o plazos, ni por consecuencias derivadas de la información gestionada a través de la plataforma.</p>
          </Section>

          <Section title="5. Propiedad intelectual">
            <p>Todos los derechos de propiedad intelectual sobre la plataforma —incluyendo su diseño, código fuente, marca, logotipos y contenidos propios— pertenecen exclusivamente a MANALEG o a sus licenciantes. Queda prohibida su reproducción, distribución o modificación sin autorización expresa y escrita.</p>
            <p>Los datos ingresados por el usuario son de su titularidad. MANALEG no reclama derechos de propiedad sobre dicho contenido y solo los utiliza para prestar el servicio contratado.</p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>MANALEG procura mantener el servicio disponible de manera continua, pero no garantiza disponibilidad ininterrumpida ni libre de errores. Podrán producirse interrupciones por las siguientes causas, sin que ello genere derecho a indemnización:</p>
            <ul>
              <li><strong>Mantenimiento programado:</strong> tareas periódicas de actualización, mejora o mantenimiento preventivo de la plataforma. Se procurará notificar con anticipación razonable.</li>
              <li><strong>Incidentes técnicos:</strong> fallas en servidores, infraestructura de base de datos, proveedores de hosting o servicios de terceros que integran la plataforma (Supabase, Vercel, u otros).</li>
              <li><strong>Actualizaciones:</strong> despliegue de nuevas versiones del software que requieran tiempo de inactividad.</li>
              <li><strong>Fuerza mayor:</strong> eventos ajenos al control razonable de MANALEG, incluyendo desastres naturales, cortes de conectividad, ataques informáticos u otras circunstancias extraordinarias.</li>
            </ul>
            <p>MANALEG no será responsable por la pérdida de datos derivada de interrupciones del servicio no imputables a culpa grave o dolo de su parte. Se recomienda al usuario mantener respaldos propios de la información crítica.</p>
          </Section>

          <Section title="7. Limitación de responsabilidad">
            <p>En la máxima medida permitida por la ley aplicable, MANALEG no será responsable por:</p>
            <ul>
              <li>Pérdidas o daños derivados del uso o de la imposibilidad de uso del servicio.</li>
              <li>Pérdida de datos, lucro cesante o daño emergente de cualquier naturaleza.</li>
              <li>Errores, omisiones o inexactitudes en la información cargada por el usuario.</li>
              <li>Consecuencias jurídicas derivadas del vencimiento de plazos procesales, con independencia de las alertas configuradas en la plataforma.</li>
              <li>Actuaciones de terceros proveedores de infraestructura o servicios complementarios.</li>
            </ul>
            <p>La plataforma es una herramienta de organización y gestión. La responsabilidad profesional respecto de las causas gestionadas recae exclusivamente en el abogado o profesional del derecho usuario del servicio.</p>
          </Section>

          <Section title="8. Modificaciones">
            <p>MANALEG se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán notificados al email registrado con un mínimo de 15 días de anticipación. El uso continuado del servicio transcurrido ese plazo implica la aceptación de las nuevas condiciones.</p>
          </Section>

          <Section title="9. Ley aplicable y jurisdicción">
            <p>Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Para cualquier controversia derivada de su interpretación o ejecución, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad de Córdoba, renunciando expresamente a cualquier otro fuero que pudiera corresponder.</p>
          </Section>

          <Section title="10. Contacto">
            <p>Para consultas sobre estos Términos y Condiciones podés escribir a <strong>contacto@manaleg.com.ar</strong>. Responderemos en un plazo máximo de 10 días hábiles.</p>
          </Section>
        </div>

        <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
          <Link href="/legal/privacidad" className="text-[13px] font-semibold text-blue hover:underline">
            Política de Privacidad
          </Link>
          <span className="text-muted">·</span>
          <Link href="/login" className="text-[13px] text-sub hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>

      <style>{`
        .prose-legal { display: flex; flex-direction: column; gap: 12px; }
        .prose-section h2 { font-size: 14px; font-weight: 700; color: var(--color-text); margin-bottom: 3px; }
        .prose-section p { font-size: 13.5px; color: var(--color-sub); line-height: 1.6; margin-bottom: 2px; text-align: justify; }
        .prose-section ul { padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .prose-section ul li { font-size: 13.5px; color: var(--color-sub); line-height: 1.55; text-align: justify; }
        .prose-section ul li::before { content: "— "; color: var(--color-muted); }
        strong { color: var(--color-text); }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="prose-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
