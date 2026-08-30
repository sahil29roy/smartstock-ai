import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

export const SummarySkeleton = () => {
  return (
    <Card className="border border-primary-light/20 bg-gradient-to-br from-primary-very-light/20 to-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-md bg-primary-light/35" />
          <Skeleton className="h-5 w-40 bg-primary-light/35" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SalesAnalysisSkeleton = () => {
  return (
    <Card className="border border-border">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 pt-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ChatLoadingBubble = () => {
  return (
    <div className="flex gap-3 items-start select-none animate-fade-in">
      <div className="h-8 w-8 rounded-lg bg-primary-very-light dark:bg-primary-light/10 text-primary flex items-center justify-center shrink-0 border border-primary-light/10">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
      <div className="bg-surface border border-border p-3.5 rounded-lg max-w-[85%] space-y-2.5 shadow-sm">
        <Skeleton className="h-3.5 w-64" />
        <Skeleton className="h-3.5 w-48" />
      </div>
    </div>
  );
};
