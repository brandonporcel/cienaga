"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { ROUTES } from "@/config/routes";

export default function ThemeInitializer() {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (pathname === ROUTES.home || pathname === ROUTES.login) {
      setTheme("light");
    }
  }, [pathname, setTheme]);

  return null;
}
