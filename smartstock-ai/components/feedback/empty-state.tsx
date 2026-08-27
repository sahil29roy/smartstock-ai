import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "../ui/button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface py-12 ${className}`}>
      <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-full mb-4 flex items-center justify-center">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-secondary-text mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
