"use client";

import { useEffect, useState } from "react";

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${
        isScrolled ? "w-[54%] max-w-7xl" : "w-[50%] max-w-6xl"
      }`}
    >
      <div className="backdrop-blur-md rounded-2xl border px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-lime-400">CIENAGA</h1>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className=" hover:text-white transition-colors">
              Inicio
            </a>
            <a href="#" className=" hover:text-white transition-colors">
              Producto
            </a>
            <a href="#" className=" hover:text-white transition-colors">
              Planes
            </a>
            <a href="#" className=" hover:text-white transition-colors">
              FAQs
            </a>
            <a href="#" className=" hover:text-white transition-colors">
              Contacto
            </a>
          </nav>

          <button className="border-slate-600  hover:bg-slate-700 bg-transparent">
            Iniciar sesión
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
