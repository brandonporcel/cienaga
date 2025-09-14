"use client";

import * as React from "react";
import {
  IconBell,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconDashboard,
  IconMail,
  IconSeedling,
  IconSettings,
  IconSparkles,
  type Icon,
} from "@tabler/icons-react";

import { ROUTES } from "@/config/routes";
import { NavDocuments } from "@/components/dashboard/layout/nav-documents";
import { NavMain } from "@/components/dashboard/layout/nav-main";
import { NavSecondary } from "@/components/dashboard/layout/nav-secondary";
import { NavUser } from "@/components/dashboard/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  href: string;
  icon: Icon;
  items?: NavItem[];
  isExternal?: boolean;
}

const data: Record<string, NavItem[]> = {
  navMain: [
    {
      title: "Dashboard",
      href: ROUTES.dashboard,
      icon: IconDashboard,
    },
    {
      title: "Asistente",
      href: "#",
      icon: IconSparkles,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      href: ROUTES.settings,
      icon: IconSettings,
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
          isExternal: true, // se abre en nueva pestaña
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
