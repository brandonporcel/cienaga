"use client";

import type React from "react";
import Link from "next/link"; // Import Link for client-side navigation
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Header() {
  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "Pricing", href: "#pricing-section" },
    { name: "Testimonials", href: "#testimonials-section" }, // Changed from Docs to Testimonials
  ];

  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const targetId = href.substring(1); // Remove '#' from href
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="w-full py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-foreground text-xl font-semibold">
              Pointer
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                className="text-[#888888] hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://vercel.com/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block"
          >
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm">
              Try for Free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
