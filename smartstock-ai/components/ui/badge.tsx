import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
}

export const Badge = ({ className = "", variant = "neutral", children, ...props }: BadgeProps) => {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium select-none border";

  const variants = {
    primary: "bg-primary-very-light text-primary-dark border-primary-light/30 dark:bg-primary/10 dark:text-primary dark:border-primary/25",
    secondary: "bg-background text-secondary-text border-border",
    success: "bg-success/10 text-success border-success/20 dark:bg-success/10 dark:text-success dark:border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/10 dark:text-warning dark:border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20 dark:bg-danger/10 dark:text-danger dark:border-danger/20",
    neutral: "bg-surface text-secondary-text border-border",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
