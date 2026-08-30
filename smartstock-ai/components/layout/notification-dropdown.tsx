"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, AlertTriangle, ShoppingCart, CreditCard, Info, Trash2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Low Stock Alert",
    description: "iPhone 15 Pro stock level is critically low (4 remaining).",
    time: "5m ago",
    type: "warning",
    read: false,
  },
  {
    id: "2",
    title: "New Sales Order",
    description: "Sales Order #SO-2026-049 created for Admin User.",
    time: "25m ago",
    type: "success",
    read: false,
  },
  {
    id: "3",
    title: "Payment Received",
    description: "Payment of ₹85,000 received from Sahil Roy via Bank Transfer.",
    time: "2h ago",
    type: "success",
    read: true,
  },
  {
    id: "4",
    title: "System Update Completed",
    description: "SmartStock AI backend has been upgraded to Gemini 3.6 Flash.",
    time: "1d ago",
    type: "info",
    read: true,
  },
];

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return (
          <div className="p-2 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      case "success":
        return (
          <div className="p-2 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4 w-4" />
          </div>
        );
      case "error":
        return (
          <div className="p-2 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-secondary-text hover:text-foreground hover:bg-background p-2 rounded-md transition-colors relative cursor-pointer focus:outline-none"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface animate-pulse" />
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-surface border border-border shadow-xl ring-1 ring-black/5 z-50 overflow-hidden animate-fade-in flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-danger/10 text-danger rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <Check className="h-3 w-3" /> Mark read
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-semibold text-secondary-text hover:text-danger flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 scrollbar-thin max-h-[360px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-3 rounded-full bg-border/20 text-secondary-text mb-2">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">All caught up!</p>
                <p className="text-[11px] text-secondary-text mt-1">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  className={`flex items-start gap-3 p-3.5 hover:bg-background/60 transition-colors cursor-pointer relative ${
                    !item.read ? "bg-primary-very-light/10 dark:bg-primary-light/5" : ""
                  }`}
                >
                  {getIcon(item.type)}
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold leading-none ${!item.read ? "text-foreground" : "text-secondary-text"}`}>
                        {item.title}
                      </span>
                      <span className="text-[9px] text-secondary-text font-mono shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <span className="text-[11px] text-secondary-text mt-1 leading-normal break-words">
                      {item.description}
                    </span>
                  </div>

                  {!item.read && (
                    <span className="absolute top-4 right-3 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
