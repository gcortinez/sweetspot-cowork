export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-2 group">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                SweetSpot
              </span>
            </a>
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Volver al inicio
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Política de Privacidad
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Última actualización:{" "}
              {new Date().toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introducción
              </h2>
              <p className="text-gray-700 mb-4">
                En SweetSpot, nos tomamos muy en serio la privacidad de nuestros
                usuarios. Esta Política de Privacidad explica cómo recopilamos,
                usamos, divulgamos y protegemos su información cuando utiliza
                nuestro servicio de gestión de espacios de coworking.
              </p>
              <p className="text-gray-700 mb-4">
                Al utilizar SweetSpot, usted acepta la recopilación y el uso de
                información de acuerdo con esta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Información que Recopilamos
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.1 Información Personal
              </h3>
              <p className="text-gray-700 mb-4">
                Podemos recopilar información personal identificable, incluyendo
                pero no limitada a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección física</li>
                <li>Información de facturación y pago</li>
                <li>Información de la empresa</li>
                <li>Fotografía de perfil</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.2 Información de Uso
              </h3>
              <p className="text-gray-700 mb-4">
                Recopilamos automáticamente cierta información cuando utiliza
                nuestro servicio:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Dirección IP</li>
                <li>Tipo de navegador y versión</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Fecha y hora de acceso</li>
                <li>Sistema operativo</li>
                <li>Información del dispositivo</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                2.3 Cookies y Tecnologías Similares
              </h3>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su
                experiencia, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Cookies de sesión para mantenerlo conectado</li>
                <li>
                  Cookies de preferencias para recordar sus configuraciones
                </li>
                <li>Cookies analíticas para entender el uso del servicio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Cómo Usamos su Información
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Proporcionar y mantener nuestro servicio</li>
                <li>Procesar transacciones y pagos</li>
                <li>Gestionar su cuenta y membresía</li>
                <li>Enviar notificaciones importantes sobre el servicio</li>
                <li>Responder a sus consultas y solicitudes de soporte</li>
                <li>
                  Mejorar nuestros servicios y desarrollar nuevas
                  características
                </li>
                <li>Cumplir con obligaciones legales</li>
                <li>Prevenir fraudes y actividades maliciosas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Compartir Información
              </h2>
              <p className="text-gray-700 mb-4">
                No vendemos ni alquilamos su información personal. Podemos
                compartir su información en las siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <strong>Con su consentimiento:</strong> Cuando usted nos
                  autoriza expresamente
                </li>
                <li>
                  <strong>Proveedores de servicios:</strong> Con terceros que
                  nos ayudan a operar nuestro negocio
                </li>
                <li>
                  <strong>Cumplimiento legal:</strong> Cuando sea requerido por
                  ley o proceso legal
                </li>
                <li>
                  <strong>Protección de derechos:</strong> Para proteger
                  nuestros derechos, propiedad o seguridad
                </li>
                <li>
                  <strong>Transferencias comerciales:</strong> En caso de
                  fusión, adquisición o venta de activos
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Seguridad de los Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para
                proteger su información, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Actualizaciones periódicas de seguridad</li>
                <li>Capacitación del personal en protección de datos</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Sin embargo, ningún método de transmisión por Internet es 100%
                seguro, y no podemos garantizar la seguridad absoluta de su
                información.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Sus Derechos
              </h2>
              <p className="text-gray-700 mb-4">
                Usted tiene los siguientes derechos respecto a su información
                personal:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <strong>Acceso:</strong> Solicitar una copia de su información
                  personal
                </li>
                <li>
                  <strong>Rectificación:</strong> Corregir información inexacta
                  o incompleta
                </li>
                <li>
                  <strong>Eliminación:</strong> Solicitar la eliminación de su
                  información
                </li>
                <li>
                  <strong>Portabilidad:</strong> Recibir su información en
                  formato estructurado
                </li>
                <li>
                  <strong>Oposición:</strong> Oponerse al procesamiento de su
                  información
                </li>
                <li>
                  <strong>Restricción:</strong> Limitar el procesamiento de su
                  información
                </li>
              </ul>
              <p className="text-gray-700 mb-4">
                Para ejercer estos derechos, contáctenos a través de los medios
                indicados al final de esta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Retención de Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Conservamos su información personal solo durante el tiempo
                necesario para cumplir con los propósitos descritos en esta
                política, incluyendo:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Mientras mantenga una cuenta activa</li>
                <li>Para cumplir con obligaciones legales</li>
                <li>Para resolver disputas</li>
                <li>Para hacer cumplir nuestros acuerdos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Transferencias Internacionales
              </h2>
              <p className="text-gray-700 mb-4">
                Su información puede ser transferida y mantenida en servidores
                ubicados fuera de su país de residencia. Al usar nuestro
                servicio, usted consiente estas transferencias. Tomamos medidas
                para garantizar que su información reciba un nivel adecuado de
                protección.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Privacidad de Menores
              </h2>
              <p className="text-gray-700 mb-4">
                Nuestro servicio no está dirigido a personas menores de 18 años.
                No recopilamos conscientemente información personal de menores.
                Si descubrimos que hemos recopilado información de un menor, la
                eliminaremos inmediatamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Enlaces a Terceros
              </h2>
              <p className="text-gray-700 mb-4">
                Nuestro servicio puede contener enlaces a sitios web de
                terceros. No somos responsables de las prácticas de privacidad
                de estos sitios. Le recomendamos revisar las políticas de
                privacidad de cada sitio que visite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Cambios a esta Política
              </h2>
              <p className="text-gray-700 mb-4">
                Podemos actualizar esta Política de Privacidad periódicamente.
                Le notificaremos sobre cambios significativos publicando la
                nueva política en esta página y actualizando la fecha de "Última
                actualización". Se recomienda revisar esta política
                regularmente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre esta Política de Privacidad o sobre
                nuestras prácticas de privacidad, contáctenos:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-gray-700">
                <p className="font-semibold">SweetSpot Cowork</p>
                <p>Email: privacy@sweetspot.com</p>
                <p>Teléfono: +1 (555) 123-4567</p>
                <p>Dirección: 123 Innovation Street, Tech City, TC 12345</p>
              </div>
              <p className="text-gray-700 mt-4">
                También puede contactar a nuestro Delegado de Protección de
                Datos en: dpo@sweetspot.com
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} SweetSpot. Todos los derechos
              reservados.
            </p>
            <div className="mt-4 space-x-6">
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Política de Privacidad
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Términos y Condiciones
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
