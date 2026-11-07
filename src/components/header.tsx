"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import ProfileUser from "./profile-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";

const navItems = [
  { name: "Acerca", href: "#about-section" },
  { name: "Cartelera", href: "#cinema-listings-section" },
  { name: "Cines", href: ROUTES.cinemas.path },
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
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg md:text-xl font-bold text-[#003720]">
            CIENAGA<span className="text-[#94f27f]">I</span>
          </h1>

          <nav className="hidden sm:flex items-center space-x-4 md:space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[#888888] hover:text-foreground px-1 md:px-2 lg:px-4 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden h-9 w-9"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ProfileUser
              buttonClassName={`${isScrolled ? "bg-[#94f27f]" : "bg-transparent"} hover:bg-[#94f27f95]`}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
