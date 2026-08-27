"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { DropdownMenu } from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const items = [
    {
      label: "Light",
      icon: <Sun className="h-4 w-4 text-amber-500" />,
      onClick: () => setTheme("light"),
    },
    {
      label: "Dark",
      icon: <Moon className="h-4 w-4 text-blue-400" />,
      onClick: () => setTheme("dark"),
    },
    {
      label: "System",
      icon: <Monitor className="h-4 w-4 text-secondary-text" />,
      onClick: () => setTheme("system"),
    },
  ];

  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative" title="Toggle theme">
          <Sun className="h-4 w-4 transition-all scale-100 rotate-0 dark:scale-0 dark:rotate-90 text-amber-500" />
          <Moon className="absolute h-4 w-4 transition-all scale-0 -rotate-90 dark:scale-100 dark:rotate-0 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      }
      items={items}
      align="right"
    />
  );
};
