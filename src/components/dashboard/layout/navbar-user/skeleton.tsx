import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default"
        >
          {/* Avatar skeleton */}
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />

          {/* Text content skeleton */}
          <div className="grid flex-1 text-left text-sm leading-tight gap-1">
            {/* Nombre skeleton */}
            <div className="h-4 bg-muted rounded animate-pulse w-24" />
            {/* Email skeleton */}
            <div className="h-3 bg-muted rounded animate-pulse w-32" />
          </div>

          {/* Dots icon skeleton */}
          <div className="ml-auto h-4 w-4 bg-muted rounded animate-pulse" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
