import React from "react";
import { Bell, HelpCircle, MoreVertical } from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
}
export default function Sidebar({ sidebarOpen }: SidebarProps) {
  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 bg-gray-900 text-white transition-all duration-300 ease-in-out overflow-hidden
        ${sidebarOpen ? "w-64" : "w-0"}
        md:relative md:translate-x-0
      `}
    >
      {sidebarOpen && (
        <div className="flex h-full flex-col w-64">
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-700">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-black">G</span>
            </div>
            <span className="text-lg font-semibold text-green-400">Gasti</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md cursor-pointer">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Ayuda</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Novedades</span>
              </div>
              <MoreVertical className="w-4 h-4" />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
