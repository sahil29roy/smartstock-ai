import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, actions, className = "" }: PageHeaderProps) => {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mb-6 ${className}`}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-xs text-secondary-text mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
