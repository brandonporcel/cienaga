import { Calendar, Mail, Pencil, User } from "lucide-react";

import { createClientForServer } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationToggle } from "@/components/notification-toggle";

export default async function Settings() {
  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getUser();

  // Fetch unsubscribed status from users table (RLS blocks anon key)
  const serviceSupabase = createServiceClient();
  const { data: userData } = await serviceSupabase
    .from("users")
    .select("unsubscribed")
    .eq("id", data.user?.id ?? "")
    .single();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Configuración</h1>
      </div>

      <div className="space-y-6">
        {/* Correo electrónico */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-white" />
              <h3 className="text-base font-semibold tracking-tight">
                Correo electrónico
              </h3>
            </div>

            <div className="text-sm text-muted-foreground">
              Tu correo electrónico es necesario para iniciar sesión y recibir
              notificaciones importantes.
            </div>
          </div>
          <div className="flex items-center gap-3 p-6 pt-0">
            <Avatar className="w-12 h-12 rounded-full border-2 border-green-500">
              <AvatarImage
                src={
                  data.user?.user_metadata.avatar_url ||
                  "https://i.pravatar.cc/60"
                }
                alt={"Avatar"}
              />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <span>{data.user?.email}</span>
          </div>
        </div>

        {/* Tu nombre */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-base font-semibold leading-none tracking-tight flex items-center gap-2">
              <User />
              Tu nombre
            </div>
            <div className="text-sm text-muted-foreground">
              Lo usaremos para saber como decirte!
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">
                {data.user?.user_metadata.name}
              </p>
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
            <div className="text-base font-semibold leading-none tracking-tight flex items-center gap-2">
              <Calendar />
              Fecha de registro
            </div>
            <div className="text-sm text-muted-foreground">
              Tu fecha de registro en Ciénaga
            </div>
          </div>
          <div className="p-6 pt-0">
            <p className="text-lg font-medium">
              {data.user?.created_at
                ? new Date(data.user.created_at).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-base font-semibold tracking-tight">
              Notificaciones
            </h3>
            <div className="text-sm text-muted-foreground">
              Configurá si querés recibir correos cuando haya películas de tus
              directores favoritos.
            </div>
          </div>
          <div className="p-6 pt-0">
            <NotificationToggle
              userId={data.user?.id ?? ""}
              initialSubscribed={!userData?.unsubscribed}
            />
          </div>
        </div>
      </div>
    </>
  );
}
