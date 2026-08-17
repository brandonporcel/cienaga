import {
  Bell,
  Calendar,
  Film,
  KeyRound,
  Mail,
  Pencil,
  SlidersHorizontal,
  User,
} from "lucide-react";

import { createClientForServer } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function Settings() {
  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <h2 className="text-lg font-semibold text-neutral-500 mb-6">
        Configuración
      </h2>

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
            <p className="text-lg font-medium">{data.user?.created_at}</p>
          </div>
        </div>

        {/* Seguridad */}
        <div className="rounded-lg border text-card-foreground shadow-sm relative overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-base font-semibold leading-none tracking-tight flex items-center gap-2">
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

      {/* Notificaciones y recomendaciones */}
      <h2 className="text-lg font-semibold text-neutral-500 mt-10 mb-6">
        Notificaciones y recomendaciones
      </h2>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Elegí cómo y cuándo Ciénaga te avisa de las funciones de tus
              directores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="range">Ventana de funciones</Label>
              <Select disabled defaultValue="7">
                <SelectTrigger id="range" className="w-full sm:w-64">
                  <SelectValue placeholder="Seleccioná una ventana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Próxima semana (7 días)</SelectItem>
                  <SelectItem value="14">Próximos 14 días</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Funciones que entran en el rango elegido a partir de hoy.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia de resumen</Label>
              <Select disabled defaultValue="new">
                <SelectTrigger id="frequency" className="w-full sm:w-64">
                  <SelectValue placeholder="Seleccioná una frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Solo funciones nuevas</SelectItem>
                  <SelectItem value="daily">Resumen diario</SelectItem>
                  <SelectItem value="weekly">Resumen semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button disabled>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SlidersHorizontal className="w-5 h-5" />
              Directores favoritos
            </CardTitle>
            <CardDescription>
              Cómo Ciénaga decide a qué directores seguís automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              Seguimos a un director cuando:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  Viste <strong>2 o más</strong> películas suyas y a la{" "}
                  <strong>mitad o más</strong> les diste <strong>3.5★ o más</strong>,
                  o
                </li>
                <li>
                  Le diste <strong>5★</strong> a al menos una de sus películas.
                </li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Podés seguir o silenciar cualquier director manualmente desde su
              detalle: eso tiene prioridad sobre los umbrales.
            </p>
            <div>
              <Button variant="outline" disabled>
                Ajustar umbrales (próximamente)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Film className="w-5 h-5" />
              Cines
            </CardTitle>
            <CardDescription>
              Cines que monitorea Ciénaga para las funciones de tus directores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Malba</Badge>
              <Badge variant="secondary">Lumiton</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Los cines se suman automáticamente a medida que Ciénaga los
              detecta.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
