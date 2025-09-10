import React from "react";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DashboardHeader({
  sidebarOpen,
  setSidebarOpen,
}: HeaderProps) {
  return (
    <header className="bg-red-500 text-white p-4 flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="text-white hover:bg-red-600"
      >
        <PanelLeft className="w-5 h-5" />
      </Button>
      <h1 className="text-lg font-semibold">Dashboard</h1>
    </header>
  );
}
