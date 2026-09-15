export default function PrivacyView() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Política de Privacidad</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Responsable del Tratamiento</h2>
        <p>Alejandro Royo López de Felipe (Rivas-Vaciamadrid, España).</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Datos que recopilamos y Finalidad</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Datos de registro:</strong> Correo electrónico, nombre de usuario e imagen de perfil, gestionados mediante el proveedor de identidad Clerk.</li>
          <li><strong>Datos financieros:</strong> Categorías, importes y fechas de las transacciones (gastos e ingresos) introducidas manualmente por el Usuario, con la única finalidad de prestar el servicio de seguimiento financiero ofrecido por la Plataforma.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Terceros y Proveedores de Servicios</h2>
        <p className="mb-3">
          Para que la Plataforma funcione, los datos se procesan utilizando infraestructuras de terceros que cumplen con los estándares de seguridad exigidos:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Clerk:</strong> Gestión de autenticación y sesiones seguras.</li>
          <li><strong>Neon (PostgreSQL):</strong> Almacenamiento cifrado de la base de datos en la nube.</li>
          <li><strong>Render & Vercel:</strong> Alojamiento de los servidores backend y frontend.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Tus Derechos (ARCO)</h2>
        <p>
          Puedes acceder, rectificar, limitar o eliminar tus datos en cualquier momento eliminando tu cuenta desde los ajustes de la Plataforma, o contactando directamente con el Responsable.
        </p>
      </section>

    </div>
  );
}