"use client";

import Link from "next/link";
import {
  IconCreditCard,
  IconDotsVertical,
  IconUserCircle,
} from "@tabler/icons-react";
import { LogOut } from "lucide-react";

import NavItem from "@/types/nav";
import { ROUTES } from "@/config/routes";
import { useClientUser } from "@/hooks/useClientUser";
import { useSignOut } from "@/hooks/usSignOut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import NavUserSkeleton from "./skeleton";

const items: NavItem[] = [
  {
    href: ROUTES.settings.path,
    title: "Perfil",
    icon: IconUserCircle,
  },
  {
    href: ROUTES.billing.path,
    title: "Facturación",
    icon: IconCreditCard,
  },
];

export function NavUser() {
  const { isMobile } = useSidebar();
  const { isPending, logout } = useSignOut();

  const { user, loading } = useClientUser();

  if (loading || !user) {
    return <NavUserSkeleton />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.user_metadata.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.user_metadata.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.user_metadata.avatar_url} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.user_metadata.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem key={item.title} asChild>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                onClick={() => logout()}
                disabled={isPending}
                className="flex w-full items-center"
              >
                <LogOut />
                <span>
                  {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
                </span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
