"use client";

import type React from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqData = [
  {
    question: "¿Qué es Ciénaga y para quién está pensado?",
    answer:
      "Ciénaga es una aplicación que conecta tus películas favoritas de Letterboxd con la cartelera de cines en Buenos Aires. Está pensada para cinéfilos que quieren enterarse cuándo se proyectan en pantalla grande sus films preferidos.",
  },
  {
    question: "¿Cómo funciona la integración con Letterboxd?",
    answer:
      "Podés importar fácilmente tu cuenta de Letterboxd y sincronizar tu lista de películas favoritas. De esa forma, Ciénaga detecta coincidencias con la programación de cines en BA y te avisa cuando estén en cartelera.",
  },
  {
    question: "¿Necesito una cuenta para usar la app?",
    answer:
      "Sí, es necesario registrarse para que podamos guardar tus películas favoritas y enviarte notificaciones personalizadas. El registro es gratuito y toma menos de un minuto.",
  },
  {
    question: "¿La app es gratis?",
    answer:
      "Sí, podés registrarte y usar Ciénaga de manera gratuita. Estamos trabajando en planes premium con beneficios adicionales, como alertas prioritarias y recomendaciones exclusivas.",
  },
  {
    question: "¿Puedo usar Ciénaga sin tener Letterboxd?",
    answer:
      "¡Claro! Si no tenés cuenta en Letterboxd, podés seleccionar manualmente tus películas favoritas dentro de la app y recibir notificaciones de la misma manera.",
  },
  {
    question: "¿Qué tan actualizada está la información de la cartelera?",
    answer:
      "La cartelera se actualiza constantemente a partir de la información oficial de los cines de Buenos Aires, para que siempre tengas datos precisos sobre funciones, estrenos y reestrenos.",
  },
  {
    question: "¿Van a expandirse a otras ciudades además de BA?",
    answer:
      "Por el momento estamos enfocados en la Ciudad de Buenos Aires, pero planeamos ampliar Ciénaga a otras ciudades de Argentina y la región en próximas versiones.",
  },
  {
    question: "¿Van a enviarme spam o correos no deseados?",
    answer:
      "No. Solo recibirás notificaciones y correos relacionados con las películas que marcaste como favoritas o con avisos importantes sobre la app.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle();
  };
  return (
    <div
      className={`w-full bg-[rgba(231,236,235,0.08)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-[10px] outline-1 outline-border outline-offset-[-1px] transition-all duration-500 ease-out cursor-pointer`}
      onClick={handleClick}
    >
      <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
        <div className="flex-1 text-foreground text-base font-medium leading-6 break-words">
          {question}
        </div>
        <div className="flex justify-center items-center">
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground-dark transition-all duration-500 ease-out ${isOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`px-5 transition-all duration-500 ease-out ${isOpen ? "pb-[18px] pt-2 translate-y-0" : "pb-0 pt-0 -translate-y-2"}`}
        >
          <div className="text-foreground/80 text-sm font-normal leading-6 break-words">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };
  return (
    <section className="w-full pt-[66px] pb-20 md:pb-40 px-5 relative flex flex-col justify-center items-center">
      <div className="w-[300px] h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[100px] z-0" />
      <div className="self-stretch pt-8 pb-8 md:pt-14 md:pb-14 flex flex-col justify-center items-center gap-2 relative z-10">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="w-full max-w-[435px] text-center text-foreground text-4xl font-semibold leading-10 break-words">
            Preguntas frecuentes
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-[18.20px] break-words">
            Todo lo que necesitas saber sobre Ciénaga y cómo puede transformar
            toda tu vida
          </p>
        </div>
      </div>
      <div className="w-full max-w-[600px] pt-0.5 pb-10 flex flex-col justify-start items-start gap-4 relative z-10">
        {faqData.map((faq, index) => (
          <FAQItem
            key={index}
            {...faq}
            isOpen={openItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </section>
  );
}
