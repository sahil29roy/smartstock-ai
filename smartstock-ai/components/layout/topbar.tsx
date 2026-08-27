"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, User, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";
import { DropdownMenu } from "../ui/dropdown-menu";
import { SearchInput } from "../common/search-input";
import { useAuth } from "@/components/auth/auth-provider";

interface TopbarProps {
  onMenuClick: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const userMenuItems = [
    {
      label: "My Profile",
      icon: <User className="h-4 w-4 text-secondary-text" />,
      onClick: () => router.push("/profile"),
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4 text-secondary-text" />,
      onClick: () => router.push("/settings"),
    },
    {
      label: "Logout",
      icon: <LogOut className="h-4 w-4 text-danger" />,
      destructive: true,
      onClick: async () => {
        await logout();
      },
    },
  ];

  const initials = getInitials(user?.name);
  const displayName = user?.name || "SmartStock User";
  const displayRole = user?.role || "USER";

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
              <div className="h-7 w-7 rounded-full bg-primary-very-light dark:bg-primary-light/10 text-primary border border-primary-light/20 flex items-center justify-center font-bold text-xs select-none">
                {initials}
              </div>
              <div className="hidden lg:flex flex-col select-none">
                <span className="text-xs font-semibold text-foreground leading-none">{displayName}</span>
                <span className="text-[9px] font-medium text-secondary-text mt-0.5 uppercase tracking-wider">{displayRole}</span>
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
