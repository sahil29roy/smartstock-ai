import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ items, activeId, onChange, className = "" }: TabsProps) => {
  return (
    <div className={`border-b border-border flex gap-6 ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 py-2 px-1 text-sm font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer focus:outline-none ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-foreground hover:border-border"
            }`}
          >
            {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
