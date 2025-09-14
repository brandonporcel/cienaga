"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";

import { useClientUser } from "@/hooks/useClientUser";
import { useSignOut } from "@/hooks/usSignOut";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileUserProps {
  buttonClassName?: string;
}

export default function ProfileUser({ buttonClassName }: ProfileUserProps) {
  const { user, loading } = useClientUser();

  if (loading)
    return (
      <Button
        className={`cursor-pointer text-sm md:text-base text-black shadow-none ${buttonClassName}`}
      >
        ‎
      </Button>
    );

  if (!user)
    return (
      <Button
        className={`cursor-pointer text-sm md:text-base text-black shadow-none ${buttonClassName}`}
      >
        <Link href={"/login"}>Iniciar sesión</Link>
      </Button>
    );

  return (
    <UserDropdown>
      <a className="inline-flex transition duration-200 ease-out shadow ring-1 ring-gray-200 hover:bg-gray-200 dark:ring-gray-600 dark:hover:bg-gray-800 h-9 sm:h-8 sm:text-sm rounded-lg font-medium input-focus-ring select-none p-1 sm:p-1">
        <Image
          width={84}
          height={84}
          className="aspect-square h-full w-full"
          alt="User profile Picture"
          src={user.user_metadata.avatar_url}
        />
      </a>
    </UserDropdown>
  );
}

function UserDropdown({ children }: { children: React.ReactNode }) {
  const { isPending, logout } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={"/settings"}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={"/dashboard"}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            onClick={() => logout()}
            disabled={isPending}
            className="flex w-full items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isPending ? "Cerrando sesión..." : "Cerrar sesión"}</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
