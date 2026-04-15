import { FiShield, FiFileText, FiLock } from "react-icons/fi";

export default function AvisoPrivacidad() {
  return (
    <main style={{ backgroundColor: "var(--neutral-50, #F7FAFC)", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#FFFFFF", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", fontFamily: "var(--font-inter, sans-serif)", color: "var(--neutral-900, #333)" }}>
        
        {/* ENCABEZADO */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "2px solid #0F4C81", paddingBottom: "16px", marginBottom: "32px" }}>
          <FiShield size={32} color="#0F4C81" />
          <h1 style={{ color: "#0F4C81", margin: 0, fontSize: "24px" }}>Documentos Legales y de Seguridad</h1>
        </div>

        {/* SECCIÓN 1: AVISO DE PRIVACIDAD */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ color: "#2A9D8F", display: "flex", alignItems: "center", gap: "8px", fontSize: "20px" }}>
            <FiFileText /> 1. AVISO DE PRIVACIDAD Y CONFIDENCIALIDAD
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "16px" }}>
            <strong>Jorima Tech</strong>, con domicilio en la Universidad Tecnológica del Estado de Querétaro, es el responsable del uso y protección de sus datos personales, y al respecto le informamos lo siguiente:
          </p>
          <p style={{ lineHeight: "1.6", marginBottom: "16px" }}>
            De conformidad con lo dispuesto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y los Lineamientos del Aviso de Privacidad, se emite el presente documento para garantizar la privacidad, integridad y derecho a la autodeterminación informativa de los usuarios.
          </p>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>I. Datos Personales Recabados</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li><strong>Datos de Identificación:</strong> Nombre completo, matrícula o número de empleado.</li>
            <li><strong>Datos de contacto:</strong> Correo electrónico institucional.</li>
            <li><strong>Datos Laborales:</strong> Puesto, departamento o área de adscripción.</li>
            <li><strong>Datos Sensibles (Psicosociales):</strong> Información recabada a través de encuestas, chatbot AI sobre percepción del clima laboral, niveles de estrés y factores de riesgo psicosocial. Estos datos serán disociados (anonimizados) para efectos de reporte.</li>
          </ul>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>II. Finalidades del Tratamiento</h3>
          <ol style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li>Gestionar el acceso y autenticación a la plataforma "Bienestar y Clima Institucional".</li>
            <li>Generar reportes estadísticos agregados sobre el clima organizacional.</li>
            <li>Identificar áreas de oportunidad para mejorar el entorno laboral.</li>
          </ol>
          <p style={{ lineHeight: "1.6", color: "#4A5568", marginTop: "8px" }}>
            <strong>Negativa para finalidades secundarias:</strong> Sus datos no serán utilizados para fines mercadológicos, publicitarios o de prospección comercial.
          </p>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>III. Transferencia de Datos</h3>
          <p style={{ lineHeight: "1.6", color: "#4A5568" }}>
            Le informamos que sus datos personales <strong>NO serán transferidos</strong> a terceros ajenos a la institución educativa o empresa contratante, salvo las excepciones previstas en el artículo 37 de la LFPDPPP (como requerimientos legales de autoridades competentes).
          </p>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>IV. Medidas de Seguridad</h3>
          <p style={{ lineHeight: "1.6", color: "#4A5568" }}>
            Para garantizar la confidencialidad, Jorima Tech ha implementado medidas de seguridad administrativas, físicas y técnicas (cifrado de base de datos, protocolos HTTPS y control de acceso RBAC) para evitar la pérdida, uso indebido o acceso no autorizado a sus datos.
          </p>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>V. Derechos ARCO</h3>
          <p style={{ lineHeight: "1.6", color: "#4A5568" }}>
            Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal (Rectificación); que la eliminemos de nuestros registros (Cancelación); así como oponerse al uso de sus datos (Oposición).
            <br /><br />
            Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva a través del correo electrónico: <strong>privacidadjorimatech@gmail.com</strong>.
          </p>
        </section>

        {/* SECCIÓN 2: DESLINDE LEGAL */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ color: "#2A9D8F", display: "flex", alignItems: "center", gap: "8px", fontSize: "20px", borderTop: "1px solid #E2E8F0", paddingTop: "24px" }}>
            <FiShield /> 2. DESLINDE DE RESPONSABILIDAD LEGAL
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "16px" }}>
            El presente documento establece los términos y condiciones bajo los cuales Jorima Tech pone a disposición el software "Bienestar y Clima Institucional". Su uso implica la aceptación total de las siguientes cláusulas, fundamentadas en la Ley Federal del Derecho de Autor y el Código Penal Federal.
          </p>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>I. Naturaleza de la Herramienta (No Clínico)</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li><strong>No sustituye asesoría profesional:</strong> La plataforma NO emite diagnósticos clínicos, psicológicos ni psiquiátricos.</li>
            <li><strong>Toma de decisiones:</strong> Jorima Tech no se hace responsable por decisiones laborales, despidos o sanciones administrativas que la institución usuaria tome basándose en los reportes generados. La interpretación de los datos es responsabilidad exclusiva del usuario administrativo.</li>
          </ul>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>II. Propiedad Intelectual y Derechos de Autor</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li>Todo el código fuente, interfaces gráficas, algoritmos, flujos de automatización (n8n) y documentación del sistema son propiedad exclusiva de los desarrolladores de Jorima Tech.</li>
            <li>Queda estrictamente prohibida la reproducción, distribución, ingeniería inversa, descompilación o modificación del software sin la autorización expresa y por escrito de los titulares de los derechos.</li>
          </ul>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>III. Responsabilidad del Usuario y Delitos Informáticos</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li><strong>Acceso Ilícito (Art. 211 bis 1):</strong> Quien acceda sin autorización a los sistemas o modifique la información contenida en ellos será acreedor a las sanciones penales correspondientes (prisión y multa).</li>
            <li><strong>Uso de la información:</strong> Está prohibido usar la plataforma para extraer datos personales con fines de lucro, extorsión o daño moral.</li>
          </ul>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>IV. Limitación de Garantías</h3>
          <p style={{ lineHeight: "1.6", color: "#4A5568" }}>
            El software se entrega "tal cual" (as-is). Jorima Tech no garantiza que el servicio sea ininterrumpido o libre de errores derivados de fallas en el servicio de internet, ataques cibernéticos de fuerza mayor o actualizaciones de sistemas operativos de terceros.
          </p>
        </section>

        {/* SECCIÓN 3: LINEAMIENTOS DE SEGURIDAD */}
        <section>
          <h2 style={{ color: "#2A9D8F", display: "flex", alignItems: "center", gap: "8px", fontSize: "20px", borderTop: "1px solid #E2E8F0", paddingTop: "24px" }}>
            <FiLock /> 3. LINEAMIENTOS DE SEGURIDAD DE LA INFORMACIÓN
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "16px" }}>
            Con el objetivo de garantizar la tríada de la seguridad (Confidencialidad, Integridad y Disponibilidad) en la infraestructura de Jorima Tech, se establecen los siguientes lineamientos obligatorios:
          </p>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>A. Seguridad Lógica (Técnica)</h3>
          <ol style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li><strong>Control de Acceso (RBAC):</strong> Los usuarios solo visualizarán sus propias encuestas, mientras que los administradores sólo tendrán acceso a datos estadísticos agregados, nunca a respuestas identificables individualmente.</li>
            <li><strong>Cifrado de Datos:</strong> Información en tránsito vía HTTPS (TLS 1.2 o superior). Contraseñas con hash robusto (bcrypt).</li>
            <li><strong>Gestión de Sesiones:</strong> Cierre automático tras 30 minutos de inactividad.</li>
          </ol>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>B. Seguridad Física</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li>Seguridad en Dispositivos Finales con bloqueo automático.</li>
            <li>Proveedores de Alojamiento Confiables con certificaciones ISO 27001.</li>
            <li>Restricción de puertos físicos (USB) en equipos de desarrollo.</li>
          </ul>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>C. Seguridad Administrativa</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li>Acuerdo de Confidencialidad (NDA) para el equipo de desarrollo.</li>
            <li>Capacitación Continua contra ingeniería social (phishing).</li>
            <li>Plan de Respuesta a Incidentes (notificación en menos de 72 horas).</li>
          </ul>

          <h3 style={{ color: "#0F4C81", fontSize: "16px", marginTop: "24px" }}>D. Desarrollo de Software (DevSecOps)</h3>
          <ul style={{ lineHeight: "1.6", paddingLeft: "20px", color: "#4A5568" }}>
            <li>Validación estricta de entradas para prevenir Inyección SQL y XSS.</li>
            <li>Separación de Ambientes (Desarrollo, QA, Producción).</li>
            <li>Control de Versiones y gestión de secretos sin hardcoding.</li>
            <li>Auditoría de Dependencias (CVEs).</li>
          </ul>
        </section>
      </div>
    </main>
  );
}