export default function LegalView() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Aviso Legal y Términos de Uso</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Información del Titular</h2>
        <p>
          En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información, se informa que la aplicación web Fintracker (en adelante, la "Plataforma") está gestionada por Alejandro Royo López de Felipe, con domicilio a efectos de notificaciones en Rivas-Vaciamadrid (Madrid, España).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Condiciones de Uso</h2>
        <p>
          El acceso y uso de la Plataforma atribuye la condición de Usuario y exige la aceptación de estos Términos. El Usuario se compromete a usar la Plataforma de forma lícita y adecuada.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Exención de Responsabilidad</h2>
        <p>
          Fintracker es una herramienta tecnológica diseñada exclusivamente para el seguimiento personal de ingresos y gastos. <strong>En ningún caso la información mostrada constituye asesoramiento financiero, de inversión, fiscal o legal.</strong> El Titular no se hace responsable de las decisiones económicas que el Usuario tome basándose en los datos introducidos o en las gráficas generadas (incluyendo la funcionalidad ShareView).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Propiedad Intelectual</h2>
        <p>
          El código fuente, diseño, interfaz y elementos gráficos (incluyendo el avatar o mascota de la Plataforma) son propiedad del Titular.
        </p>
      </section>
    </div>
  );
}