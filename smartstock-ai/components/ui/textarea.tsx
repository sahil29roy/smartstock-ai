import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full text-sm min-h-20 px-3 py-2 rounded-lg border bg-surface text-foreground transition-shadow placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 disabled:bg-background ${
          error ? "border-danger focus:ring-danger/40 focus:border-danger" : "border-border"
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
