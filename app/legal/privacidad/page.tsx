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
        <p className="mb-8 text-[13px] text-muted">Versión 1.1 — vigente desde el 18 de octubre de 2026</p>

        <div className="mb-6 rounded-[8px] border border-border bg-card px-4 py-3">
          <p className="text-[12.5px] text-sub leading-[1.6]">
            <strong className="text-text">Responsable del tratamiento:</strong> Luciano Garriga, CUIT 20-38329129-2 · San Jerónimo 280, EP Of. 9, Córdoba, Argentina · <strong>contacto@manaleg.com.ar</strong>
          </p>
        </div>

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
              <li>Preferencia de recepción de alertas por email (activada/desactivada por el usuario).</li>
              <li>Fecha y versión de aceptación de los Términos y Condiciones y esta Política, registradas automáticamente al momento del alta de la cuenta con fines de trazabilidad legal.</li>
            </ul>
            <p><strong>Datos de uso (ingresados por el usuario, tratados por MANALEG como encargado):</strong></p>
            <ul>
              <li>Causas, clientes, movimientos, eventos, vencimientos, honorarios, pagos y cualquier otro contenido que el usuario cargue voluntariamente en la plataforma.</li>
              <li>Estos datos son de titularidad del usuario y/o de las personas sobre las que se refieren. MANALEG no los utiliza para fines propios.</li>
            </ul>
            <p><strong>Presencia en causas compartidas:</strong></p>
            <ul>
              <li>Cuando una causa está compartida, los usuarios que tienen acceso a ella ven, en tiempo real, tu nombre y tus iniciales mientras estás dentro de la causa solo si activaste esta función. Viene <strong>desactivada por defecto</strong>.</li>
              <li>Podés activarla en cada causa con la opción <em>"Mostrar que estoy dentro de la causa"</em>. Lo que guardamos es solo esa preferencia (sí o no), por causa. No queda historial de presencia.</li>
              <li>Ni el panel de administración ni los usuarios sin acceso a la causa ven esta información.</li>
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
              <li>Mostrar a quienes comparten una causa que el usuario la tiene abierta, salvo que haya desactivado esa opción.</li>
              <li>Comunicar actualizaciones del servicio, cambios en Términos o en esta Política.</li>
              <li>Detectar y prevenir usos fraudulentos o contrarios a los Términos de Uso.</li>
              <li>Cumplir obligaciones legales aplicables.</li>
              <li>Realizar controles internos, mejorar la experiencia de uso y evaluar los planes del servicio, mediante estadísticas agregadas.</li>
            </ul>
            <p><strong>Panel de estadísticas internas.</strong> El panel de administración de MANALEG no procesa datos personales. Muestra únicamente conteos, promedios y distribuciones anónimas (por ejemplo, cantidad de usuarios por plan o de causas por estado). No incluye nombres, direcciones de correo electrónico, identificadores de usuario ni contenido de causas o de clientes. Los datos de cuenta descriptos en la sección 2 se usan para prestar el servicio y no forman parte de estas estadísticas.</p>
            <p>Solo el personal autorizado de MANALEG puede consultar el panel, con contraseña y segundo factor de autenticación, y cada consulta queda registrada.</p>
            <p><strong>Registros de conexión.</strong> La dirección IP se registra en los logs de acceso únicamente para seguridad y control del servicio, y se conserva según el plazo de la sección 6.</p>
            <p>No utilizamos los datos para fines publicitarios ni los compartimos con terceros con fines comerciales.</p>
          </Section>

          <Section title="4. Base legal">
            <p>El tratamiento de los datos de cuenta se fundamenta en:</p>
            <ul>
              <li>El <strong>consentimiento expreso</strong> otorgado por el usuario al registrarse, mediante la aceptación de esta Política y los Términos y Condiciones (art. 5 Ley 25.326). Dicho consentimiento incluye la transferencia internacional descrita en la sección 8 (art. 12 Ley 25.326).</li>
              <li>La <strong>ejecución del contrato de servicio</strong>, en la medida en que el tratamiento sea necesario para proveer las funcionalidades contratadas.</li>
              <li>El <strong>interés legítimo</strong> de MANALEG de mantener la seguridad e integridad de la plataforma, para el tratamiento de datos técnicos (IP, logs de sesión).</li>
            </ul>
          </Section>

          <Section title="5. Almacenamiento, seguridad y residencia de datos">
            <p>Los datos se almacenan en servidores ubicados en <strong>São Paulo, Brasil</strong>, con cifrado en tránsito (TLS/HTTPS) y en reposo. El acceso está restringido mediante políticas de Row Level Security (RLS), que garantizan que cada usuario solo puede acceder a su propia información o a la de las causas que le fueron compartidas.</p>
            <p>El alojamiento en Brasil implica una <strong>transferencia internacional de datos personales</strong> en los términos de la Ley N° 25.326. Dicha transferencia se realiza al amparo del <strong>consentimiento expreso</strong> que el usuario otorga al aceptar esta Política al momento del registro, de conformidad con el artículo 12 de la Ley 25.326. Los proveedores de infraestructura cuentan con acuerdos de procesamiento de datos y cláusulas contractuales que garantizan un nivel de protección equivalente, y cumplen estándares internacionales de seguridad.</p>
            <p>MANALEG implementa medidas técnicas y organizativas razonables para proteger los datos frente a accesos no autorizados, pérdida o destrucción. Sin embargo, ningún sistema es absolutamente infalible; en caso de incidente de seguridad que afecte datos personales, MANALEG notificará a los usuarios afectados dentro de los plazos establecidos por la normativa aplicable.</p>
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
            <p>Para ejercer estos derechos, escribí a <strong>contacto@manaleg.com.ar</strong> desde el email registrado en tu cuenta. El plazo para responder las solicitudes de acceso es de <strong>10 días corridos</strong> (art. 14 inc. 2 Ley 25.326). Para rectificación, supresión u oposición, el plazo es de <strong>5 días hábiles</strong> (art. 16 inc. 1 Ley 25.326).</p>
            <p>Respecto de los datos de causas y clientes ingresados por el usuario, el ejercicio de derechos ARCO corresponde ante el propio usuario, quien es el responsable de ese tratamiento.</p>
          </Section>

          <Section title="8. Cesión y transferencia de datos (art. 12 Ley 25.326)">
            <p>MANALEG no cede datos personales a terceros con fines propios o comerciales. Para prestar el servicio, los datos son procesados por proveedores de (i) infraestructura en la nube (base de datos, autenticación y alojamiento de la aplicación) y (ii) envío de notificaciones por correo electrónico. Estos proveedores actúan como subencargados bajo instrucciones de MANALEG y no pueden usar los datos para fines propios.</p>
            <p>Algunos de estos proveedores se encuentran en Brasil y en Estados Unidos. Todos cumplen estándares internacionales de seguridad y confidencialidad. Toda transferencia internacional se realiza con el consentimiento expreso del usuario al aceptar esta Política y con cláusulas contractuales que garantizan un nivel de protección equivalente al exigido por la normativa argentina.</p>
          </Section>

          <Section title="9. Notificaciones por email">
            <p>El servicio puede enviar alertas de vencimientos al email registrado. El usuario puede activar o desactivar estas notificaciones en cualquier momento desde su configuración de cuenta. No enviamos publicidad de terceros.</p>
          </Section>

          <Section title="10. Modificaciones">
            <p>Esta Política puede ser actualizada. Notificaremos los cambios con al menos 15 días de anticipación al email registrado. El uso continuado del servicio implica la aceptación de la política vigente.</p>
          </Section>

          <Section title="11. Cookies y tecnologías de rastreo">
            <p>MANALEG utiliza exclusivamente <strong>cookies de sesión estrictamente necesarias</strong> gestionadas por Supabase Auth para mantener la autenticación del usuario. Estas cookies no contienen información personal más allá de un identificador de sesión cifrado y se eliminan al cerrar sesión o al expirar el token.</p>
            <p>La plataforma <strong>no utiliza cookies de análisis, publicidad ni rastreo de terceros</strong>. No se integra ninguna herramienta de analítica que recopile datos de comportamiento del usuario (Google Analytics, Mixpanel u otras). La política de seguridad de contenido (CSP) de la aplicación bloquea técnicamente conexiones a dominios de terceros no autorizados.</p>
          </Section>

          <Section title="12. Contacto y reclamos">
            <p>Para consultas sobre esta Política o para ejercer tus derechos, contactanos en <strong>contacto@manaleg.com.ar</strong>. También podés presentar una denuncia ante la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, autoridad de control en materia de protección de datos personales en Argentina (<em>www.argentina.gob.ar/aaip</em>).</p>
          </Section>

          <Section title="Historial de versiones">
            <ul>
              <li><strong>Versión 1.1 — 18 de octubre de 2026:</strong> se incorpora la presencia en causas compartidas, con opción para desactivarla; se aclara el alcance del panel de estadísticas internas; se corrige el plazo de respuesta para acceso; se actualiza la descripción de proveedores y de residencia de datos.</li>
              <li><strong>Versión 1.0 — 1 de octubre de 2026:</strong> versión inicial.</li>
            </ul>
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
    <section className="prose-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
