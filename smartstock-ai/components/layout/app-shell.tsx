"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileSidebar } from "./mobile-sidebar";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Right Column: Topbar + Page content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        
        {/* Scrollable page content area */}
        <div className="flex-1 overflow-y-auto bg-background scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
};
