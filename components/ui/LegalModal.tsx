"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface LegalModalProps {
  type: "terminos" | "privacidad";
  onClose: () => void;
}

const TERMINOS = (
  <>
    <Section title="1. Aceptación de los términos">
      <p>Estos Términos y Condiciones regulan el acceso y uso de MANALEG. Al crear una cuenta, el usuario declara haber leído, comprendido y aceptado íntegramente las condiciones aquí establecidas, así como la Política de Privacidad vigente. Si el usuario actúa en nombre de una firma o estudio jurídico, declara tener facultades suficientes para obligar a dicha organización.</p>
    </Section>
    <Section title="2. Descripción del servicio">
      <p>MANALEG es una plataforma SaaS de gestión de causas judiciales y clientes orientada a profesionales del derecho. Permite registrar causas, movimientos, vencimientos, eventos, honorarios, pagos y configurar alertas automatizadas. Las funcionalidades disponibles dependen del plan vigente. MANALEG puede incorporar nuevas funciones o modificar las existentes, con notificación previa.</p>
    </Section>
    <Section title="3. Condiciones de uso">
      <ul>
        <li>Solo pueden registrarse personas mayores de 18 años con plena capacidad legal.</li>
        <li>Cada usuario es responsable de mantener la confidencialidad de sus credenciales. Ante cualquier uso no autorizado, debe notificarlo de inmediato.</li>
        <li>Queda prohibido compartir el acceso con terceros no autorizados.</li>
        <li>El usuario se compromete a usar la plataforma exclusivamente para fines lícitos y compatibles con el ejercicio profesional del derecho.</li>
        <li>No está permitido acceder a datos de otros usuarios, ni realizar ingeniería inversa o scraping.</li>
      </ul>
    </Section>
    <Section title="4. Datos, contenido y responsabilidad del usuario">
      <p>El usuario es el único responsable de la exactitud, veracidad y legalidad de los datos que ingresa, incluyendo los datos personales de sus clientes y terceros. MANALEG actúa como encargado del tratamiento por cuenta del usuario, quien reviste la condición de responsable conforme a la Ley N° 25.326. <strong>MANALEG no asume responsabilidad alguna</strong> por el contenido cargado, por errores en la carga de vencimientos o plazos, ni por consecuencias derivadas de la información gestionada.</p>
    </Section>
    <Section title="5. Propiedad intelectual">
      <p>Todos los derechos de propiedad intelectual sobre la plataforma pertenecen exclusivamente a MANALEG o a sus licenciantes. Queda prohibida su reproducción o modificación sin autorización escrita. Los datos ingresados por el usuario son de su titularidad; MANALEG no reclama derechos sobre dicho contenido.</p>
    </Section>
    <Section title="6. Disponibilidad del servicio">
      <p>MANALEG procura mantener el servicio disponible de manera continua, pero no garantiza disponibilidad ininterrumpida. Podrán producirse interrupciones por mantenimiento programado, incidentes técnicos, actualizaciones o fuerza mayor, sin que ello genere derecho a indemnización.</p>
    </Section>
    <Section title="7. Limitación de responsabilidad">
      <p>En la máxima medida permitida por la ley, MANALEG no será responsable por pérdidas derivadas del uso o imposibilidad de uso del servicio, pérdida de datos, lucro cesante, errores en datos cargados por el usuario, ni por consecuencias jurídicas derivadas del vencimiento de plazos procesales. La plataforma es una herramienta de organización; la responsabilidad profesional recae exclusivamente en el abogado usuario.</p>
    </Section>
    <Section title="8. Modificaciones">
      <p>MANALEG puede modificar estos Términos con notificación al email registrado con un mínimo de 15 días de anticipación. El uso continuado implica la aceptación de las nuevas condiciones.</p>
    </Section>
    <Section title="9. Ley aplicable y jurisdicción">
      <p>Estos Términos se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a los Tribunales Ordinarios de la Ciudad de Córdoba.</p>
    </Section>
    <Section title="10. Contacto">
      <p>Consultas: <strong>contacto@manaleg.com.ar</strong>. Respondemos en un plazo máximo de 10 días hábiles.</p>
    </Section>
  </>
);

const PRIVACIDAD = (
  <>
    <Section title="1. Responsable del tratamiento">
      <p>Esta Política distingue dos categorías de datos con regímenes diferenciados:</p>
      <ul>
        <li><strong>Datos de cuenta:</strong> MANALEG es responsable del tratamiento de los datos que recopila directamente al registrarse (nombre, email, datos técnicos de sesión), conforme a la Ley N° 25.326.</li>
        <li><strong>Datos de causas y clientes:</strong> Los datos que el usuario ingresa sobre sus propios clientes y expedientes son tratados por MANALEG como <strong>encargado del tratamiento</strong>, actuando por cuenta e instrucción del usuario —quien es el responsable del tratamiento. MANALEG no accede a ese contenido con fines propios ni lo cede a terceros, salvo requerimiento legal.</li>
      </ul>
    </Section>
    <Section title="2. Datos que recopilamos">
      <p><strong>Datos de cuenta:</strong> nombre completo, email, contraseña (hash bcrypt; nunca en texto plano), preferencias de notificación y fecha de aceptación de T&C.</p>
      <p><strong>Datos de uso (ingresados por el usuario):</strong> causas, clientes, movimientos, vencimientos, honorarios y cualquier contenido cargado voluntariamente. MANALEG no los utiliza para fines propios.</p>
      <p><strong>Datos técnicos:</strong> IP en logs de acceso (seguridad), timestamps de registros y datos de sesión para autenticación.</p>
    </Section>
    <Section title="3. Finalidad del tratamiento">
      <p>Los datos de cuenta se tratan exclusivamente para: prestar y mejorar el servicio; enviar alertas de vencimientos configuradas por el usuario; comunicar actualizaciones; detectar usos fraudulentos; y cumplir obligaciones legales. No usamos datos con fines publicitarios ni los compartimos con terceros con fines comerciales.</p>
    </Section>
    <Section title="4. Base legal">
      <p>El tratamiento de datos de cuenta se fundamenta en el consentimiento expreso otorgado al registrarse (art. 5 Ley 25.326) y en la ejecución del contrato de servicio. Los datos técnicos se tratan por interés legítimo de seguridad.</p>
    </Section>
    <Section title="5. Almacenamiento y seguridad">
      <p>Los datos se almacenan en servidores de Supabase (PostgreSQL), con cifrado en tránsito (TLS/HTTPS) y en reposo. El acceso está restringido mediante políticas de Row Level Security (RLS). MANALEG implementa medidas técnicas razonables para proteger los datos; ante un incidente de seguridad, notificará a los afectados en los plazos que establezca la normativa.</p>
    </Section>
    <Section title="6. Plazo de conservación">
      <p>Los datos de cuenta se conservan mientras la cuenta esté activa. Ante solicitud de baja, los datos son suprimidos en un plazo máximo de 30 días. Los logs técnicos se conservan 90 días y luego se eliminan automáticamente.</p>
    </Section>
    <Section title="7. Derechos del titular (ARCO)">
      <p>Conforme a la Ley 25.326, el usuario tiene derecho a: <strong>Acceso</strong> (información sobre sus datos de cuenta), <strong>Rectificación</strong> (corrección de datos inexactos), <strong>Cancelación</strong> (supresión de datos, lo que implica la baja del servicio) y <strong>Oposición</strong> (en las circunstancias previstas por la ley). Para ejercer estos derechos, escribí a <strong>contacto@manaleg.com.ar</strong> desde el email registrado. Respondemos en 10 días hábiles.</p>
    </Section>
    <Section title="8. Transferencia de datos">
      <p>Los datos pueden ser procesados por proveedores de infraestructura (Supabase, Vercel, Resend) bajo acuerdos de confidencialidad compatibles con la normativa argentina. Actúan como subencargados y no están autorizados a usar los datos con fines propios.</p>
    </Section>
    <Section title="9. Notificaciones por email">
      <p>El servicio puede enviar alertas de vencimientos al email registrado. El usuario puede activarlas o desactivarlas en cualquier momento desde su configuración de cuenta.</p>
    </Section>
    <Section title="10. Modificaciones">
      <p>Esta Política puede actualizarse con al menos 15 días de anticipación al email registrado. El uso continuado implica la aceptación de la política vigente.</p>
    </Section>
    <Section title="11. Contacto y reclamos">
      <p>Consultas sobre esta Política o ejercicio de derechos: <strong>contacto@manaleg.com.ar</strong>. También podés presentar una denuncia ante la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> (<em>www.argentina.gob.ar/aaip</em>).</p>
    </Section>
  </>
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legal-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-[16px] sm:rounded-[14px] sm:max-w-[680px]"
        style={{
          background: "var(--color-card)",
          maxHeight: "90dvh",
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-bold text-text">
            {type === "terminos" ? "Términos y Condiciones" : "Política de Privacidad"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex cursor-pointer rounded-[6px] p-1 text-muted hover:bg-border hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scroll body */}
        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-4 text-[11.5px] text-muted">Versión 1.0 — vigente desde el 1 de octubre de 2026</p>
          <div className="legal-prose">
            {type === "terminos" ? TERMINOS : PRIVACIDAD}
          </div>
        </div>
      </div>

      <style>{`
        .legal-prose { display: flex; flex-direction: column; gap: 10px; }
        .legal-section h3 { font-size: 13px; font-weight: 700; color: var(--color-text); margin-bottom: 3px; }
        .legal-section p { font-size: 13px; color: var(--color-sub); line-height: 1.6; margin-bottom: 2px; text-align: justify; }
        .legal-section ul { padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .legal-section ul li { font-size: 13px; color: var(--color-sub); line-height: 1.55; text-align: justify; }
        .legal-section ul li::before { content: "— "; color: var(--color-muted); }
        .legal-section strong { color: var(--color-text); }
      `}</style>
    </div>
  );
}
