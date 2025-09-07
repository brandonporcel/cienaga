"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "./ui/button";

const navItems = [
  { name: "Acerca", href: "#about-section" },
  { name: "Cartelera", href: "#cinema-listings-section" },
];

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

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
          <h1 className="text-xl font-bold text-[#003720]">
            CIENAGA<span className="text-[#94f27f]">I</span>
          </h1>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="text-[#888888] hover:text-foreground px-4  transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <Button
            className={`cursor-pointer text-black shadow-none ${isScrolled ? "bg-[#94f27f]" : "bg-transparent"}`}
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
