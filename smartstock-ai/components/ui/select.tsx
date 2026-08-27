import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, error, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        <select
          ref={ref}
          className={`w-full text-sm h-9 rounded-lg border bg-surface text-foreground px-3 pr-8 transition-shadow appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 disabled:bg-background ${
            error ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-border"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 pointer-events-none flex items-center justify-center text-secondary-text">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
