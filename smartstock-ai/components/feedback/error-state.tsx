import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
}: ErrorStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-danger/20 rounded-lg bg-danger/5 py-12 ${className}`}>
      <div className="p-3 bg-danger/10 text-danger rounded-full mb-4 flex items-center justify-center">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-secondary-text mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 border-danger/30 text-danger hover:bg-danger/10 dark:hover:bg-danger/10" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};
