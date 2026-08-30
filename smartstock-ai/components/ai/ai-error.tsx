import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export interface AIErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const AIError = ({
  title = "AI Assistant Offline",
  message,
  onRetry,
}: AIErrorProps) => {
  return (
    <Card className="border border-warning-light/20 bg-warning-very-light/5 dark:bg-warning-light/5">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="p-3 bg-warning-very-light dark:bg-warning-light/15 text-warning rounded-full mb-3 border border-warning-light/15">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="text-xs text-secondary-text mt-1 max-w-sm">
            {message}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-border text-foreground hover:bg-background h-8 text-xs font-semibold px-4"
              onClick={onRetry}
            >
              Try Reconnecting
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
