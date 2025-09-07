import { useMemo } from "react";
import Image from "next/image";

const phrases = [
  {
    name: "Alfred Hitchcock",
    title: "Director de cine",
    description:
      "El cine no es un trozo de vida, sino un pedazo de pastel con el que jugamos a imaginar mundos distintos.",
    image: "/images/hitchcock.png",
  },
  {
    name: "Federico Fellini",
    title: "Director italiano",
    description:
      "El cine es un sueño que jamás olvido; cada película es una vida que nunca dejará de existir en la pantalla.",
    image: "/images/fellini.png",
  },
  {
    name: "Jean-Luc Godard",
    title: "Director francés",
    description:
      "El cine es verdad veinticuatro veces por segundo, y en esa repetición nace su propia poesía.",
    image: "/images/godard.png",
  },
  {
    name: "Martin Scorsese",
    title: "Director estadounidense",
    description:
      "Cada película que hacemos es un intento de atrapar un momento en el tiempo y hacerlo eterno para todos.",
    image: "/images/scorsese.png",
  },
  {
    name: "Ingmar Bergman",
    title: "Director sueco",
    description:
      "El cine es como un espejo que nunca termina: refleja lo que somos y lo que tememos ser.",
    image: "/images/bergman.png",
  },
  {
    name: "Francis Ford Coppola",
    title: "Director estadounidense",
    description:
      "El cine, como la vida, está hecho de momentos imperfectos que se transforman en recuerdos inolvidables.",
    image: "/images/coppola.png",
  },
  {
    name: "Agnès Varda",
    title: "Directora francesa",
    description:
      "Filmar es una manera de ver, y al ver de otra forma, el cine nos enseña a vivir con nuevos ojos.",
    image: "/images/varda.png",
  },
];

export function LargeTestimonial() {
  const randomPhrase = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
  }, []);

  return (
    <section className="w-full px-5 overflow-hidden flex justify-center items-center">
      <div className="flex-1 flex flex-col justify-start items-start overflow-hidden">
        <div className="self-stretch px-4 py-12 md:px-6 md:py-16 lg:py-28 flex flex-col justify-start items-start gap-2">
          <div className="self-stretch flex justify-between items-center">
            <div className="flex-1 px-4 py-8 md:px-12 lg:px-20 md:py-8 lg:py-10 overflow-hidden rounded-lg flex flex-col justify-center items-center gap-6 md:gap-8 lg:gap-11">
              <div className="w-full max-w-[1024px] text-center text-foreground leading-7 md:leading-10 lg:leading-[64px] font-medium text-lg md:text-3xl lg:text-6xl">
                {randomPhrase.description}
              </div>
              <div className="flex justify-start items-center gap-5">
                <Image
                  src="/images/guillermo-rauch.png"
                  alt="Guillermo Rauch avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 relative rounded-full"
                  style={{ border: "1px solid rgba(0, 0, 0, 0.08)" }}
                />
                <div className="flex flex-col justify-start items-start">
                  <div className="text-foreground text-base font-medium leading-6">
                    {randomPhrase.name}
                  </div>
                  <div className="text-muted-foreground text-sm font-normal leading-6">
                    {randomPhrase.title}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
