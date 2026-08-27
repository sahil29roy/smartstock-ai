import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-dark hover:text-white dark:hover:bg-primary-dark",
      secondary: "bg-primary-very-light text-primary-dark border border-primary-light/30 hover:bg-primary-light/40 dark:bg-primary-light/10 dark:text-primary dark:hover:bg-primary-light/20",
      outline: "border border-border bg-surface text-foreground hover:bg-primary-very-light hover:text-primary-dark dark:hover:bg-primary-light/10",
      ghost: "text-foreground hover:bg-primary-very-light hover:text-primary-dark dark:hover:bg-primary-light/10",
      destructive: "bg-danger text-white hover:bg-red-600 dark:bg-danger dark:hover:bg-red-600",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-10 px-5 text-sm gap-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
