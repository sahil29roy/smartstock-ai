import React from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", label, id, checked, onChange, ...props }, ref) => {
    const fallbackId = React.useId();
    const switchId = id || fallbackId;

    return (
      <label htmlFor={switchId} className={`flex items-center gap-3 cursor-pointer select-none ${className}`}>
        <div className="relative">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div className="w-9 h-5 bg-border rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 dark:bg-border/25 peer-checked:bg-primary transition-colors duration-200"></div>
          <div className="absolute left-[2px] top-[2px] bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-4"></div>
        </div>
        {label && (
          <span className="text-sm font-medium text-foreground">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
