export default function TermsPage() {
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
            Términos y Condiciones
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
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar SweetSpot ("el Servicio"), usted acepta
                estar sujeto a estos Términos y Condiciones. Si no está de
                acuerdo con alguna parte de estos términos, no podrá acceder al
                Servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Descripción del Servicio
              </h2>
              <p className="text-gray-700 mb-4">
                SweetSpot es una plataforma de gestión integral para espacios de
                coworking que permite:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Gestión de miembros y membresías</li>
                <li>Reserva de espacios y recursos</li>
                <li>Facturación y pagos automatizados</li>
                <li>Control de acceso y seguridad</li>
                <li>Análisis y reportes en tiempo real</li>
                <li>Comunicación con miembros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Registro de Cuenta
              </h2>
              <p className="text-gray-700 mb-4">
                Para utilizar nuestros servicios, debe:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  Proporcionar información precisa y completa durante el
                  registro
                </li>
                <li>Mantener la seguridad de su cuenta y contraseña</li>
                <li>
                  Notificarnos inmediatamente sobre cualquier uso no autorizado
                </li>
                <li>Ser responsable de todas las actividades bajo su cuenta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Uso Aceptable
              </h2>
              <p className="text-gray-700 mb-4">Usted se compromete a no:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Violar leyes o regulaciones aplicables</li>
                <li>Infringir derechos de propiedad intelectual</li>
                <li>Transmitir material malicioso o dañino</li>
                <li>Intentar acceder sin autorización a otros sistemas</li>
                <li>Interferir con el funcionamiento del Servicio</li>
                <li>Usar el Servicio para actividades fraudulentas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Propiedad Intelectual
              </h2>
              <p className="text-gray-700 mb-4">
                Todo el contenido, características y funcionalidad del Servicio
                son propiedad de SweetSpot y están protegidos por leyes de
                propiedad intelectual. Usted retiene todos los derechos sobre
                los datos que carga al Servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Privacidad y Protección de Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Su uso del Servicio está sujeto a nuestra{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Política de Privacidad
                </a>
                . Nos comprometemos a proteger su información personal y cumplir
                con todas las regulaciones de protección de datos aplicables,
                incluyendo el RGPD.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Tarifas y Pagos
              </h2>
              <p className="text-gray-700 mb-4">
                Algunos aspectos del Servicio pueden estar sujetos a tarifas:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Los precios se muestran en la moneda local</li>
                <li>Las tarifas son pagaderas por adelantado</li>
                <li>
                  Los pagos no son reembolsables, salvo lo establecido por ley
                </li>
                <li>
                  Nos reservamos el derecho de modificar las tarifas con previo
                  aviso
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Limitación de Responsabilidad
              </h2>
              <p className="text-gray-700 mb-4">
                En la máxima medida permitida por la ley, SweetSpot no será
                responsable por daños indirectos, incidentales, especiales o
                consecuentes que resulten del uso o la imposibilidad de usar el
                Servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Indemnización
              </h2>
              <p className="text-gray-700 mb-4">
                Usted acepta indemnizar y mantener indemne a SweetSpot de
                cualquier reclamo, daño, obligación, pérdida, responsabilidad,
                costo o deuda, y gastos que surjan de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Su uso del Servicio</li>
                <li>Su violación de estos Términos</li>
                <li>Su violación de derechos de terceros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Terminación
              </h2>
              <p className="text-gray-700 mb-4">
                Podemos terminar o suspender su cuenta inmediatamente, sin
                previo aviso, por cualquier motivo, incluyendo si viola estos
                Términos. Usted puede cancelar su cuenta en cualquier momento
                desde la configuración de su cuenta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Modificaciones
              </h2>
              <p className="text-gray-700 mb-4">
                Nos reservamos el derecho de modificar estos Términos en
                cualquier momento. Si realizamos cambios materiales, le
                notificaremos por correo electrónico o mediante un aviso en el
                Servicio antes de que los cambios entren en vigor.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Ley Aplicable
              </h2>
              <p className="text-gray-700 mb-4">
                Estos Términos se regirán e interpretarán de acuerdo con las
                leyes del país donde opera su espacio de coworking, sin tener en
                cuenta sus disposiciones sobre conflictos de leyes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre estos Términos y Condiciones,
                contáctenos en:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-gray-700">
                <p className="font-semibold">SweetSpot Cowork</p>
                <p>Email: legal@sweetspot.com</p>
                <p>Teléfono: +1 (555) 123-4567</p>
              </div>
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
