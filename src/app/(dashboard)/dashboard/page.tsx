import { Calendar, KeyRound, Mail, Pencil, User } from "lucide-react";

export default function Page() {
  return (
    <>
      <h2 className="text-lg font-semibold text-neutral-500 mb-6">
        Información del perfil
      </h2>

      {/* Correo electrónico */}
      <div className="space-y-6">
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-white" />
              <h3 className="text-2xl font-semibold tracking-tight">
                Correo electrónico
              </h3>
            </div>

            <div className="text-sm text-muted-foreground">
              Tu correo electrónico es necesario para iniciar sesión y recibir
              notificaciones importantes.
            </div>
          </div>
          <div className="flex items-center gap-3 p-6 pt-0">
            <img
              src="https://i.pravatar.cc/60"
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-green-500"
            />
            <span className="text-white">brandon7.7porcel@gmail.com</span>
          </div>
        </div>

        {/* Tu nombre */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
              <User />
              Tu nombre
            </div>
            <div className="text-sm text-muted-foreground">
              Lo usaremos para saber como decirte!
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">Brandon Porcel</p>
              <button className="justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs flex items-center gap-1">
                <Pencil size={16} />
                Editar
              </button>
            </div>
          </div>
        </div>

        {/* Fecha de registro */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
              <Calendar />
              Fecha de registro
            </div>
            <div className="text-sm text-muted-foreground">
              Tu fecha de registro en Gasti
            </div>
          </div>
          <div className="p-6 pt-0">
            <p className="text-lg font-medium">3 de septiembre de 2025</p>
          </div>
        </div>

        {/* Seguridad */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
              <KeyRound />
              Seguridad
            </div>
            <div className="text-sm text-muted-foreground">
              Cambia tu contraseña para proteger tus datos
            </div>
          </div>
          <div className="p-6 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Puedes cambiar tu contraseña en cualquier momento. Te enviaremos
              un email con las instrucciones.
            </p>
          </div>
          <div className="flex items-center p-6 pt-0">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full sm:w-auto">
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
