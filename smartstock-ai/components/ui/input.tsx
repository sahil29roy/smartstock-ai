import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {icon && (
          <div className="absolute left-3 text-secondary-text pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={`w-full text-sm h-9 rounded-lg border bg-surface text-foreground transition-shadow placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 disabled:bg-background ${
            icon ? "pl-9 pr-3" : "px-3"
          } ${
            error ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-border"
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
