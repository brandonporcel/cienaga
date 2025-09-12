"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ProfileUser from "./profile-user";

const navItems = [
  { name: "Acerca", href: "#about-section" },
  { name: "Cartelera", href: "#cinema-listings-section" },
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

  return (
    <header
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out 
        ${isScrolled ? "w-[94%] md:w-[80%] lg:w-[54%] max-w-7xl" : "w-[94%] md:w-[80%] lg:w-[50%] max-w-6xl"}`}
    >
      <div className="backdrop-blur-md rounded-2xl border px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-[#003720]">
            CIENAGA<span className="text-[#94f27f]">I</span>
          </h1>

          <nav className="flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[#888888] hover:text-foreground px-2 lg:px-4 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <ProfileUser
            buttonClassName={`${isScrolled ? "bg-[#94f27f]" : "bg-transparent"} hover:bg-[#94f27f95]`}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
