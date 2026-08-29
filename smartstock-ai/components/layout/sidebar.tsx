"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  Receipt,
  FileText,
  Users,
  ShoppingCart,
  Truck,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  Warehouse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Sales", href: "/sales", icon: Receipt },
  { label: "Challans", href: "/challans", icon: FileText },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Procurement", href: "/procurement", icon: ShoppingCart },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function getFilteredNavItems(role: string | undefined): NavItem[] {
  if (!role) return [];
  
  switch (role) {
    case "ADMIN":
      return navItems;
    case "SALES":
      return navItems.filter(item => 
        ["Dashboard", "Customers", "Sales", "Challans", "Payments", "Inventory", "Reports", "Settings"].includes(item.label)
      );
    case "WAREHOUSE":
      return navItems.filter(item => 
        ["Dashboard", "Products", "Categories", "Inventory", "Challans", "Procurement", "Reports", "Settings"].includes(item.label)
      );
    case "MANAGER":
      return navItems.filter(item => 
        ["Dashboard", "Products", "Categories", "Inventory", "Sales", "Procurement", "Accounts", "Reports", "Settings"].includes(item.label)
      );
    case "ACCOUNTS":
      return navItems.filter(item => 
        ["Dashboard", "Inventory", "Payments", "Accounts", "Reports", "Settings"].includes(item.label)
      );
    default:
      // USER or any undefined role gets fallback dashboard only
      return navItems.filter(item => ["Dashboard", "Settings"].includes(item.label));
  }
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const filteredItems = getFilteredNavItems(user?.role);

  return (
    <aside
      className={`hidden md:flex flex-col bg-surface border-r border-border h-screen sticky top-0 transition-all duration-300 z-20 shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand logo header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 overflow-hidden select-none">
          <div className="p-1.5 rounded-md bg-primary-very-light dark:bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
            <Warehouse className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm text-foreground tracking-tight whitespace-nowrap">
              SmartStock <span className="text-primary">AI</span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-secondary-text hover:text-foreground hover:bg-background p-1 rounded-md transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all group relative ${
                isActive
                  ? "bg-primary-very-light text-primary dark:bg-primary-light/10"
                  : "text-secondary-text hover:text-foreground hover:bg-background"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
              )}
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-secondary-text group-hover:text-foreground"}`} />
              {!collapsed && <span className="whitespace-nowrap transition-opacity">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-16 bg-neutral-950 dark:bg-neutral-800 text-white dark:text-foreground text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggler for collapsed state */}
      {collapsed && (
        <div className="p-3 border-t border-border flex justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="text-secondary-text hover:text-foreground hover:bg-background p-1.5 rounded-md transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
