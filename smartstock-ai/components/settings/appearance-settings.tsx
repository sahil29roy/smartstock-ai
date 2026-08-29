import React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      id: "light" as const,
      name: "Light Mode",
      description: "Clean, classic white layout for bright environments",
      icon: <Sun className="h-5 w-5 text-warning" />,
    },
    {
      id: "dark" as const,
      name: "Dark Mode",
      description: "Sleek dark layout to reduce eye strain in low light",
      icon: <Moon className="h-5 w-5 text-primary" />,
    },
    {
      id: "system" as const,
      name: "System Default",
      description: "Automatically matches your operating system theme",
      icon: <Laptop className="h-5 w-5 text-info" />,
    },
  ];

  return (
    <Card className="bg-surface border-border select-none">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Appearance Preferences</CardTitle>
        <CardDescription>Customize the application theme and visual appearance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {options.map((opt) => {
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`text-left p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between h-32 relative ${
                  isActive
                    ? "border-primary bg-primary-very-light/10 dark:bg-primary-light/5 shadow-sm"
                    : "border-border hover:border-secondary-text hover:bg-background/40"
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="p-1.5 rounded bg-background border border-border">
                    {opt.icon}
                  </div>
                  {isActive && (
                    <span className="p-0.5 bg-primary rounded-full text-white">
                      <Check className="h-3 w-3 stroke-[3px]" />
                    </span>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">{opt.name}</h5>
                  <p className="text-[10px] text-secondary-text mt-0.5 leading-normal">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
