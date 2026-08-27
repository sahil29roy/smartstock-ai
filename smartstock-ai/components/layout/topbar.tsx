"use client";

import React from "react";
import { Menu, Bell, Search, User, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";
import { DropdownMenu } from "../ui/dropdown-menu";
import { SearchInput } from "../common/search-input";

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const userMenuItems = [
    {
      label: "My Profile",
      icon: <User className="h-4 w-4 text-secondary-text" />,
      onClick: () => console.log("Profile clicked"),
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4 text-secondary-text" />,
      onClick: () => console.log("Settings clicked"),
    },
    {
      label: "Logout",
      icon: <LogOut className="h-4 w-4 text-danger" />,
      destructive: true,
      onClick: () => console.log("Logout clicked"),
    },
  ];

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 sticky top-0 z-10 w-full shrink-0">
      {/* Left section: mobile hamburger & search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="md:hidden text-secondary-text hover:text-foreground hover:bg-background p-1.5 rounded-md transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block w-full">
          <SearchInput className="max-w-xs" placeholder="Search transactions, products..." />
        </div>
      </div>

      {/* Right section: theme toggle, notification & profile dropdown */}
      <div className="flex items-center gap-3">
        {/* Search button on small screens */}
        <button className="sm:hidden text-secondary-text hover:text-foreground p-2 rounded-md hover:bg-background transition-colors">
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          className="text-secondary-text hover:text-foreground hover:bg-background p-2 rounded-md transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        <div className="h-6 w-[1px] bg-border mx-1" />

        {/* User Info & Avatar */}
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2 hover:bg-background/80 p-1.5 rounded-lg transition-colors cursor-pointer text-left focus:outline-none">
              <div className="h-7 w-7 rounded-full bg-primary-very-light dark:bg-primary-light/10 text-primary border border-primary-light/20 flex items-center justify-center font-bold text-xs">
                SR
              </div>
              <div className="hidden lg:flex flex-col select-none">
                <span className="text-xs font-semibold text-foreground leading-none">Sahil Roy</span>
                <span className="text-[9px] font-medium text-secondary-text mt-0.5 uppercase tracking-wider">Super Admin</span>
              </div>
            </button>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
};
