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
        <p className="mb-8 text-[13px] text-muted">Versión 1.1 — vigente desde el 18 de octubre de 2026</p>


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
              <li>Queda prohibido ceder o compartir las credenciales de acceso con terceros no autorizados. La plataforma ofrece funcionalidad nativa de compartir causas con otros usuarios registrados; dicha funcionalidad es el canal habilitado para la colaboración y no constituye una infracción a esta cláusula.</li>
              <li>El usuario se compromete a utilizar la plataforma exclusivamente para fines lícitos y compatibles con el ejercicio profesional del derecho.</li>
              <li>No está permitido intentar acceder a cuentas, datos o sistemas de otros usuarios, ni realizar ingeniería inversa, scraping o cualquier acción que comprometa la integridad de la plataforma.</li>
            </ul>
          </Section>

          <Section title="4. Datos, contenido y encargo del tratamiento (art. 25 Ley 25.326)">
            <p>El usuario es el único y exclusivo responsable de la exactitud, veracidad, legalidad y licitud de los datos que ingresa en la plataforma, incluyendo los datos personales de sus clientes, partes y terceros vinculados a sus causas.</p>
            <p>Conforme al artículo 25 de la Ley N° 25.326, la prestación del servicio implica un contrato de encargo de tratamiento entre el usuario (responsable del tratamiento) y MANALEG (encargado del tratamiento). Los términos de dicho encargo son los siguientes:</p>
            <ul>
              <li>Datos objeto del encargo: todos los datos personales que el usuario ingrese en la plataforma en relación a sus clientes, partes y terceros vinculados a sus causas.</li>
              <li>Finalidad: exclusivamente la prestación del servicio de gestión de causas contratado. MANALEG no tratará estos datos para fines propios.</li>
              <li>Categorías de titulares: clientes del usuario, partes actoras y demandadas, terceros vinculados a expedientes judiciales o extrajudiciales.</li>
              <li>Subencargados autorizados: Supabase Inc. (almacenamiento), Vercel Inc. (hosting), Resend Inc. (notificaciones por email), según lo detallado en la Política de Privacidad. El usuario presta consentimiento para su intervención al aceptar estos términos.</li>
              <li>Medidas de seguridad: cifrado TLS en tránsito, cifrado en reposo, Row Level Security (RLS) a nivel de base de datos, autenticación segura.</li>
              <li>Devolución y supresión: al darse de baja el usuario, MANALEG procederá a la eliminación de los datos en un plazo de 30 días conforme a lo previsto en la sección 9.</li>
              <li>Confidencialidad: MANALEG y su personal mantienen deber de secreto sobre los datos tratados, incluso con posterioridad a la finalización del contrato.</li>
            </ul>
            <p>Es obligación del usuario contar con las habilitaciones legales para tratar datos personales de sus clientes y terceros, informarles sobre su recopilación y finalidad (art. 6 Ley 25.326), y observar las normas de ética y confidencialidad de la profesión jurídica.</p>
            <p>MANALEG no accede, revisa ni utiliza los datos de causas o clientes del usuario, salvo lo estrictamente necesario para la prestación técnica del servicio o en cumplimiento de una orden judicial o requerimiento legal.</p>
          </Section>

          <Section title="5. Propiedad intelectual">
            <p>Todos los derechos de propiedad intelectual sobre la plataforma —incluyendo su diseño, código fuente, marca, logotipos y contenidos propios— pertenecen exclusivamente a MANALEG o a sus licenciantes. Queda prohibida su reproducción, distribución o modificación sin autorización expresa y escrita.</p>
            <p>Los datos ingresados por el usuario son de su titularidad. MANALEG no reclama derechos de propiedad sobre dicho contenido y solo los utiliza para prestar el servicio contratado.</p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>MANALEG procura mantener el servicio disponible de manera continua, pero no garantiza disponibilidad ininterrumpida ni libre de errores. Podrán producirse interrupciones por las siguientes causas, sin que ello genere derecho a indemnización:</p>
            <ul>
              <li>Mantenimiento programado: tareas periódicas de actualización, mejora o mantenimiento preventivo de la plataforma. Se procurará notificar con anticipación razonable.</li>
              <li>Incidentes técnicos: fallas en servidores, infraestructura de base de datos, proveedores de hosting o servicios de terceros que integran la plataforma (Supabase, Vercel, u otros).</li>
              <li>Actualizaciones: despliegue de nuevas versiones del software que requieran tiempo de inactividad.</li>
              <li>Fuerza mayor: eventos ajenos al control razonable de MANALEG, incluyendo desastres naturales, cortes de conectividad, ataques informáticos u otras circunstancias extraordinarias.</li>
            </ul>
            <p>MANALEG no será responsable por la pérdida de datos derivada de interrupciones del servicio no imputables a culpa grave o dolo de su parte. Se recomienda al usuario mantener respaldos propios de la información crítica.</p>
          </Section>

          <Section title="7. Limitación de responsabilidad">
            <p>MANALEG no será responsable por los siguientes supuestos, en tanto no medie culpa grave ni dolo de su parte:</p>
            <ul>
              <li>Pérdidas o daños indirectos, especiales o consecuentes derivados del uso o de la imposibilidad de uso del servicio.</li>
              <li>Pérdida de datos por interrupciones del servicio no imputables a MANALEG, conforme lo previsto en la sección 6.</li>
              <li>Errores, omisiones o inexactitudes en la información cargada por el usuario.</li>
              <li>Consecuencias jurídicas derivadas del vencimiento de plazos procesales, con independencia de las alertas configuradas en la plataforma. MANALEG es una herramienta de apoyo; la responsabilidad profesional recae exclusivamente en el abogado o profesional del derecho usuario del servicio.</li>
              <li>Actuaciones de terceros proveedores de infraestructura o servicios complementarios.</li>
            </ul>
            <p>En ningún caso la responsabilidad total acumulada de MANALEG frente a un usuario, por cualquier concepto, podrá exceder el monto abonado por el usuario durante los tres (3) meses anteriores al hecho generador del daño. Esta limitación no aplica en los casos en que la ley la prohíba expresamente, incluyendo los derechos irrenunciables reconocidos a los usuarios en su carácter de consumidores por la Ley N° 24.240.</p>
          </Section>

          <Section title="8. Baja de la cuenta y portabilidad de datos">
            <p>El usuario puede solicitar la baja de su cuenta en cualquier momento escribiendo a contacto@manaleg.com.ar. Dentro de los 30 días de recibida la solicitud, MANALEG procederá a la eliminación de los datos personales de cuenta conforme a lo previsto en la Política de Privacidad.</p>
            <p>Antes de solicitar la baja, el usuario puede exportar la información de sus causas desde la plataforma. MANALEG no ofrece garantía de conservación de datos una vez confirmada la baja.</p>
            <p>En caso de incumplimiento de pago, MANALEG podrá suspender el servicio tras notificación previa, sin eliminar los datos durante un período de gracia de 30 días para facilitar la exportación.</p>
          </Section>

          <Section title="10. Modificaciones">
            <p>Podemos actualizar estos Términos y Condiciones y la Política de Privacidad. Los cambios no sustanciales entran en vigor al publicarse, con su fecha de vigencia y el historial de versiones en esta página. Si un cambio agrega finalidades, tipos de datos o transferencias, te lo comunicaremos dentro de la aplicación y te pediremos que lo aceptes para seguir usando el servicio. Hasta que lo aceptes, no usaremos tus datos para esas nuevas finalidades ni los transferiremos a nuevos destinatarios. Si no querés aceptarlo, podés dar de baja tu cuenta en cualquier momento.</p>
          </Section>

          <Section title="11. Ley aplicable y jurisdicción">
            <p>Estos Términos y Condiciones se rigen exclusivamente por las leyes de la República Argentina. Para cualquier controversia derivada de su interpretación, ejecución o incumplimiento, las partes acuerdan someterse a la jurisdicción de los Tribunales Ordinarios de la Ciudad de Córdoba, con expresa renuncia a cualquier otro fuero o jurisdicción que pudiera corresponder. Al aceptar estos Términos, el usuario presta su consentimiento expreso a esta prórroga de jurisdicción.</p>
          </Section>

          <Section title="12. Contacto">
            <p>Para consultas sobre estos Términos y Condiciones podés escribir a contacto@manaleg.com.ar. Responderemos en un plazo máximo de 10 días hábiles.</p>
          </Section>
          <section className="prose-section">
            <p>Prestador del servicio: Luciano Garriga, CUIT 20-38329129-2 · San Jerónimo 280, EP Of. 9, Córdoba, Argentina · contacto@manaleg.com.ar</p>
          </section>
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
