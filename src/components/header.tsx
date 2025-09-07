"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [
  { name: "Producto", href: "#features-section" },
  { name: "Precios", href: "#pricing-section" },
  { name: "Cartelera", href: "#testimonials-section" },
];

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

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
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                className="text-[#888888] hover:text-foreground px-4  transition-colors"
              >
                {item.name}
              </Link>
            ))}
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
