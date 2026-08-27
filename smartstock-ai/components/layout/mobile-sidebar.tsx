"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Warehouse } from "lucide-react";
import { getFilteredNavItems } from "./sidebar";
import { useAuth } from "@/components/auth/auth-provider";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = getFilteredNavItems(user?.role);

  return (
    <div className="fixed inset-0 z-40 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/75 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface border-r border-border h-full z-10 animate-fade-in">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 select-none" onClick={onClose}>
            <div className="p-1.5 rounded-md bg-primary-very-light dark:bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
              <Warehouse className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight whitespace-nowrap">
              SmartStock <span className="text-primary">AI</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-foreground hover:bg-background p-1.5 rounded-md transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all group relative ${
                  isActive
                    ? "bg-primary-very-light text-primary dark:bg-primary-light/10"
                    : "text-secondary-text hover:text-foreground hover:bg-background"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
                )}
                <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-secondary-text group-hover:text-foreground"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
