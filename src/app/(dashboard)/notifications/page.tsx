import { Bell } from "lucide-react";

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

export default function Notifications() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
      </div>

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
      </div>
    </>
  );
}
