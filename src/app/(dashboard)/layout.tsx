import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const isLoggedIn = !!user;

  return (
    <SidebarProvider
      style={
        {
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" isLoggedIn={isLoggedIn} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-col p-4 md:py-6 lg:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
