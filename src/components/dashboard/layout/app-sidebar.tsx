"use client";

import * as React from "react";
import {
  IconBell,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconMail,
  IconSeedling,
  IconSettings,
  IconSparkles,
  type Icon,
} from "@tabler/icons-react";

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
  href: string; // mejor que "url" → es lo que espera <a> y <Link>
  icon: Icon;
  items?: NavItem[];
  isExternal?: boolean; // si true → target="_blank" rel="noopener noreferrer"
  isLocal?: boolean; // si true → usar <Link> de Next.js
}

const navUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

const data: Record<string, NavItem[]> = {
  navMain: [
    {
      title: "Dashboard",
      href: "#",
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
      href: "/settings", // interno → usar Next Link
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
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
