export default function CookiesView() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Política de Cookies</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Uso de Cookies en Fintracker</h2>
        <p className="mb-3">
          Esta Plataforma utiliza únicamente <strong>cookies técnicas estrictamente necesarias</strong> para el funcionamiento básico del sitio y la gestión de sesiones seguras.
        </p>
        <p className="mb-3">
          Fintracker utiliza los servicios de autenticación de <strong>Clerk</strong>, que instala cookies para verificar que estás logueado, mantener tu sesión activa mientras usas la Plataforma y proteger tu cuenta contra accesos no autorizados.
        </p>
        <p>
          Al no utilizar cookies con fines publicitarios, de rastreo o de analítica de terceros (tracking cookies), no es necesaria la implementación de un banner de consentimiento previo para su instalación, según la normativa vigente.
        </p>
      </section>
    </div>
  );
}