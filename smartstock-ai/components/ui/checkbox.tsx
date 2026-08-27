import React from "react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, id, ...props }, ref) => {
    const fallbackId = React.useId();
    const checkboxId = id || fallbackId;

    return (
      <div className="flex items-center gap-2 select-none cursor-pointer">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={`h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary focus:ring-offset-background bg-surface border transition-colors checked:bg-primary checked:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
