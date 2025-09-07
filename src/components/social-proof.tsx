import Image from "next/image";

const venues = [
  {
    name: "Bafici",
    logo: "/logos/bafici.png",
  },
  {
    name: "CC San Martín",
    logo: "/logos/cc-sanmartin.png",
  },
  {
    name: "Cosmos",
    logo: "/logos/cosmos.svg",
  },
  {
    name: "Cine York",
    logo: "/logos/lumiton.svg",
  },
  {
    name: "Palacio de la Libertad",
    logo: "/logos/palacio-libertad.svg",
  },
  {
    name: "Hoyts",
    logo: "/logos/hoyts.svg",
  },
  {
    name: "Sala Lugones",
    logo: "/logos/sala-lugones.gif",
  },
  {
    name: "Malba",
    logo: "/logos/malba.png",
  },
];

export function SocialProof() {
  return (
    <section className="py-16 flex flex-col justify-center items-center gap-6">
      <p className="text-center text-gray-300 text-sm font-medium leading-tight">
        Trabajando con venues consolidados
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center items-center">
        {venues.map((venue, i) => (
          <Image
            key={i}
            src={venue.logo}
            alt={`Logo ${venue.name}`}
            width={400}
            height={120}
            className="w-full max-w-[200px] h-auto object-contain grayscale opacity-70"
          />
        ))}
      </div>
    </section>
  );
}
