import CinemaBranding from "./instructions/cinema-branding";
import CinemaListings from "./instructions/cinema-listings";
import CTAFinal from "./instructions/cta-final";
import EmailNotifications from "./instructions/email-notifications";
import ExportLetterboxd from "./instructions/export-letterboxd";
import FavoriteDirectors from "./instructions/favorite-directors";

type InstructionCard = {
  title: string;
  description: string;
  Component: React.FC;
};

const cards = [
  {
    title: "Importá tu historial de Letterboxd.",
    description:
      "Subí tu archivo CSV y detectamos automáticamente tus directores favoritos.",
    image: "/instructions/export-letterboxd.png",
    Component: ExportLetterboxd,
  },
  {
    title: "Tus directores favoritos",
    description:
      "Ciénaga los guarda en tu perfil y los sigue de manera automática.",
    Component: FavoriteDirectors,
  },
  {
    title: "Cartelera porteña al día",
    description:
      "Scrapeamos Gaumont, Cosmos, Malba, Sala Lugones y más para actualizar las funciones.",
    Component: CinemaListings,
  },
  {
    title: "Notificaciones por mail",
    description:
      "Enterate enseguida cuándo un director de tu lista tiene una película en cartel.",
    Component: EmailNotifications,
  },
  {
    title: "Cine que te encuentra",
    description:
      "Uní tus gustos con la magia del cine porteño. Diseño simple, centrado en vos.",
    Component: CinemaBranding,
  },
  {
    title: "Descubrí tus próximos estrenos favoritos",
    description: "Subí tu CSV y empezá a recibir alertas hoy mismo.",
    Component: CTAFinal,
  },
];

const InstructionCard = ({
  title,
  description,
  Component,
}: InstructionCard) => (
  <div className="overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-start items-start relative">
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    />
    {/* Additional subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl" />

    <div
      className="absolute inset-0 rounded-2xl shadow-inner"
      style={{
        boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
      }}
    />

    <div className="self-stretch p-6 flex flex-col justify-start items-start gap-2 relative z-10">
      <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
        <p className="self-stretch text-foreground text-lg font-normal leading-7">
          {title} <br />
          <span className="text-muted-foreground">{description}</span>
        </p>
      </div>
    </div>
    <div className="self-stretch h-72 relative -mt-0.5 z-10 m-6 overflow-hidden">
      <Component />
    </div>
  </div>
);

export default function InstructionsSection() {
  return (
    <section className="w-full px-5 flex flex-col justify-center items-center  bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <h2 className="w-full max-w-[655px] text-center text-foreground text-4xl md:text-6xl font-semibold leading-tight md:leading-[66px]">
              Seguí conectado con la Cultura y el Cine
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
              No te pierdas más la experiencia de seguir relacionado con tus
              peliculas favoritas y la ciudad de Buenos Aires.
            </p>
          </div>
        </div>
        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
          {cards.map((card, i) => (
            <InstructionCard key={card.title + i} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
