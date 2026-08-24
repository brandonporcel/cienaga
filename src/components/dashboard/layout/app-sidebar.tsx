"use client";

import * as React from "react";
import {
  IconBell,
  IconBrandGithub,
  IconBrandLinkedin,
  IconChairDirector,
  IconDashboard,
  IconMail,
  IconSeedling,
  IconSettings,
} from "@tabler/icons-react";

import NavItem from "@/types/nav";
import { ROUTES } from "@/config/routes";
import { useClientUser } from "@/hooks/useClientUser";
import { NavMain } from "@/components/dashboard/layout/nav-main";
import { NavSecondary } from "@/components/dashboard/layout/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavUser } from "./navbar-user";

const data: Record<string, NavItem[]> = {
  navMain: [
    {
      title: "Cartelera",
      href: ROUTES.dashboard.path,
      icon: IconDashboard,
    },
    {
      title: "Directores",
      href: ROUTES.directors.path,
      icon: IconChairDirector,
    },
    {
      title: "Configuración",
      href: ROUTES.settings.path,
      icon: IconSettings,
    },
    {
      title: "Notificaciones",
      href: ROUTES.notifications.path,
      icon: IconBell,
    },
  ],
  navSecondary: [
    {
      title: "Contacto",
      href: "mailto:brandon7.7porcel@gmail.com",
      icon: IconMail,
      items: [
        {
          icon: IconBrandLinkedin,
          title: "LinkedIn",
          href: "https://www.linkedin.com/in/brandonporcel",
          isExternal: true,
        },
        {
          icon: IconBrandGithub,
          title: "GitHub",
          href: "https://github.com/brandonporcel",
          isExternal: true,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useClientUser();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href={user ? ROUTES.dashboard.path : ROUTES.home.path}>
                <IconSeedling className="!size-5" />
                <span className="text-base font-semibold">Cienaga</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
