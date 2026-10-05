import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Política de Privacidad — MANALEG" };

export default function PrivacidadPage() {
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

        <h1 className="mb-2 text-[26px] font-bold text-text">Política de Privacidad</h1>
        <p className="mb-8 text-[13px] text-muted">Versión 1.0 — vigente desde el 1 de octubre de 2026</p>

        <div className="prose-legal">
          <Section title="1. Responsable del tratamiento">
            <p>Esta Política distingue dos categorías de datos con regímenes de responsabilidad diferenciados:</p>
            <ul>
              <li><strong>Datos de cuenta:</strong> MANALEG es el responsable del tratamiento de los datos personales que recopila directamente al momento del registro y durante el uso de la plataforma (nombre, email, datos técnicos de sesión), en los términos de la Ley N° 25.326 de Protección de los Datos Personales.</li>
              <li><strong>Datos de causas y clientes:</strong> Los datos que el usuario ingresa sobre sus propios clientes, partes y terceros relacionados con sus expedientes son tratados por MANALEG en calidad de <strong>encargado del tratamiento</strong>, actuando por cuenta e instrucción del usuario, quien reviste la condición de <strong>responsable del tratamiento</strong> respecto de dichos datos. MANALEG no accede a ese contenido con fines propios ni lo cede a terceros, salvo requerimiento legal.</li>
            </ul>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p><strong>Datos de cuenta (recopilados directamente por MANALEG):</strong></p>
            <ul>
              <li>Nombre completo y dirección de email, provistos al registrarse.</li>
              <li>Contraseña, procesada mediante hash bcrypt por Supabase Auth; nunca se almacena ni transmite en texto plano.</li>
              <li>Preferencias de notificación y fecha de aceptación de Términos y Condiciones.</li>
            </ul>
            <p><strong>Datos de uso (ingresados por el usuario, tratados por MANALEG como encargado):</strong></p>
            <ul>
              <li>Causas, clientes, movimientos, eventos, vencimientos, honorarios, pagos y cualquier otro contenido que el usuario cargue voluntariamente en la plataforma.</li>
              <li>Estos datos son de titularidad del usuario y/o de las personas sobre las que se refieren. MANALEG no los utiliza para fines propios.</li>
            </ul>
            <p><strong>Datos técnicos:</strong></p>
            <ul>
              <li>Dirección IP registrada en logs de acceso para fines de seguridad.</li>
              <li>Timestamps de creación y modificación de registros.</li>
              <li>Datos de sesión necesarios para la autenticación.</li>
            </ul>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <p>Los datos de cuenta son tratados exclusivamente para:</p>
            <ul>
              <li>Proveer, mantener y mejorar el servicio contratado.</li>
              <li>Enviar alertas y notificaciones de vencimientos configuradas por el usuario (si esta opción está activa).</li>
              <li>Comunicar actualizaciones del servicio, cambios en Términos o en esta Política.</li>
              <li>Detectar y prevenir usos fraudulentos o contrarios a los Términos de Uso.</li>
              <li>Cumplir obligaciones legales aplicables.</li>
            </ul>
            <p>No utilizamos los datos para fines publicitarios ni los compartimos con terceros con fines comerciales.</p>
          </Section>

          <Section title="4. Base legal">
            <p>El tratamiento de los datos de cuenta se fundamenta en el consentimiento expreso otorgado por el usuario al momento del registro (art. 5 Ley 25.326) y en la ejecución del contrato de servicio. El tratamiento de datos técnicos responde al interés legítimo de mantener la seguridad de la plataforma.</p>
          </Section>

          <Section title="5. Almacenamiento y seguridad">
            <p>Los datos se almacenan en servidores de Supabase (infraestructura PostgreSQL gestionada), con cifrado en tránsito (TLS/HTTPS) y en reposo. El acceso está restringido mediante políticas de Row Level Security (RLS), que garantizan que cada usuario solo puede acceder a su propia información.</p>
            <p>MANALEG implementa medidas técnicas y organizativas razonables para proteger los datos frente a accesos no autorizados, pérdida o destrucción. Sin embargo, ningún sistema es absolutamente infalible; en caso de incidente de seguridad que afecte datos personales, MANALEG notificará a los usuarios afectados en los plazos que establezca la normativa aplicable.</p>
          </Section>

          <Section title="6. Plazo de conservación">
            <p>Los datos de cuenta se conservan mientras la cuenta esté activa. Ante la solicitud de eliminación o baja de la cuenta, los datos personales son suprimidos de los servidores en un plazo máximo de 30 días. Los logs técnicos se conservan por 90 días con fines de seguridad, transcurridos los cuales son eliminados automáticamente.</p>
          </Section>

          <Section title="7. Derechos del titular (ARCO)">
            <p>De conformidad con la Ley 25.326, el usuario —en su calidad de titular de los datos de cuenta— tiene derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> solicitar información sobre los datos personales de cuenta que MANALEG conserva sobre su persona.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos, incompletos o desactualizados.</li>
              <li><strong>Cancelación (supresión):</strong> solicitar la eliminación de sus datos personales de cuenta, lo que implica la baja del servicio.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos en determinadas circunstancias previstas por la ley.</li>
            </ul>
            <p>Para ejercer estos derechos, escribí a <strong>contacto@manaleg.com.ar</strong> desde el email registrado en tu cuenta. Responderemos en un plazo máximo de 10 días hábiles.</p>
            <p>Respecto de los datos de causas y clientes ingresados por el usuario, el ejercicio de derechos ARCO corresponde ante el propio usuario, quien es el responsable de ese tratamiento.</p>
          </Section>

          <Section title="8. Transferencia de datos">
            <p>Los datos pueden ser procesados por proveedores de infraestructura (Supabase, Vercel, Resend) bajo acuerdos de confidencialidad y protección de datos compatibles con la normativa argentina. Estos proveedores actúan como subencargados del tratamiento y no están autorizados a utilizar los datos para fines propios. No se realizan transferencias internacionales con fines distintos a la prestación del servicio.</p>
          </Section>

          <Section title="9. Notificaciones por email">
            <p>El servicio puede enviar alertas de vencimientos al email registrado. El usuario puede activar o desactivar estas notificaciones en cualquier momento desde su configuración de cuenta. No enviamos publicidad de terceros.</p>
          </Section>

          <Section title="10. Modificaciones">
            <p>Esta Política puede ser actualizada. Notificaremos los cambios con al menos 15 días de anticipación al email registrado. El uso continuado del servicio implica la aceptación de la política vigente.</p>
          </Section>

          <Section title="11. Contacto y reclamos">
            <p>Para consultas sobre esta Política o para ejercer tus derechos, contactanos en <strong>contacto@manaleg.com.ar</strong>. También podés presentar una denuncia ante la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, autoridad de control en materia de protección de datos personales en Argentina (<em>www.argentina.gob.ar/aaip</em>).</p>
          </Section>
        </div>

        <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
          <Link href="/legal/terminos" className="text-[13px] font-semibold text-blue hover:underline">
            Términos y Condiciones
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
