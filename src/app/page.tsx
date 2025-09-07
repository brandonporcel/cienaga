import Header from "@/components/header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="text-center max-w-4xl">
          <p>Potenciado por IA</p>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Tus pelis favoritas en{" "}
            <span className="italic text-lime-400">cines</span> de Bs. As.
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-4 max-w-3xl mx-auto text-pretty">
            Importa tu historial de Letterboxd, sigue a tus directores favoritos
            y recibe notificaciones cuando sus películas se proyecten en los
            cines de Buenos Aires.
          </p>

          <Button className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-semibold px-8 py-6 text-lg rounded-xl">
            Chatear con Gasti en WhatsApp
          </Button>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-4 pb-16">
        {new Array(40).fill(null).map((_, i) => (
          <p key={i}>{i}</p>
        ))}
      </section>
    </div>
  );
}
