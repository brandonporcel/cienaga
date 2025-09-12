import { IconBrandGoogleFilled } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle } from "@/app/actions/auth";

function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden py-0">
        <CardContent className="grid p-0 ">
          <form className="p-6 md:p-8">
            <div className="grid gap-6">
              <div className="text-center">
                <h1 className="text-xl font-semibold">Bienvenido de nuevo</h1>
                <p className="text-sm text-muted-foreground">
                  Inicia sesión con tu cuenta de Google
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  formAction={signInWithGoogle}
                >
                  <IconBrandGoogleFilled />
                  Ingresá con Google
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Ingresar con mail
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <Input id="password" type="password" />
                </div>
                <Button type="submit" className="w-full" disabled>
                  Iniciar sesión
                </Button>
              </div>
              <div className="text-center text-sm">
                ¿No tenés una cuenta?{" "}
                <a href="#" className="underline underline-offset-4">
                  Regístrate
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Al loguearte, aceptas nuestros <a href="#">Términos de servicio</a> y{" "}
        <a href="#">Política de privacidad</a>.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <LoginForm />
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/images/login-banner.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
