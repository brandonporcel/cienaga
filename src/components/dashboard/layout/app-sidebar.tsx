"use client";

import * as React from "react";
import {
  IconBell,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconChairDirector,
  IconDashboard,
  IconHelpCircle,
  IconMail,
  IconSeedling,
  IconSparkles,
} from "@tabler/icons-react";

import NavItem from "@/types/nav";
import { ROUTES } from "@/config/routes";
import { NavDocuments } from "@/components/dashboard/layout/nav-documents";
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
      title: "Asistente",
      href: "#",
      icon: IconSparkles,
    },
  ],
  navSecondary: [
    {
      title: "Ayuda",
      href: ROUTES.help.path,
      icon: IconHelpCircle,
    },
    {
      title: "Novedades",
      href: "#",
      icon: IconBell,
      items: [
        {
          icon: IconBrandLinkedin,
          title: "Seguinos en LinkedIn",
          href: "https://www.linkedin.com/in/brandonporcel",
          isExternal: true,
        },
        {
          icon: IconBrandGithub,
          title: "Seguinos en GitHub",
          href: "https://github.com/brandonporcel",
          isExternal: true,
        },
      ],
    },
  ],
  tools: [
    {
      title: "WhatsApp",
      href: "#",
      icon: IconBrandWhatsapp,
    },
    {
      title: "Emails",
      href: "#",
      icon: IconMail,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconSeedling className="!size-5" />
                <span className="text-base font-semibold">Cienaga</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.tools} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
