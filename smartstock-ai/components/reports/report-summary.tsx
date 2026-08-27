import React from "react";
import { Card } from "@/components/ui/card";

interface SummaryCardItem {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

interface ReportSummaryProps {
  cards: SummaryCardItem[];
}

export const ReportSummary = ({ cards }: ReportSummaryProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 select-none">
      {cards.map((card, i) => (
        <Card key={i} className={`p-5 flex flex-col justify-between ${card.className || ""}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">{card.title}</span>
              <h4 className="text-2xl font-bold tracking-tight text-foreground mt-1.5 font-mono">{card.value}</h4>
            </div>
            {card.icon && (
              <div className="p-2 rounded-lg bg-background text-secondary-text flex items-center justify-center border border-border">
                {card.icon}
              </div>
            )}
          </div>
          {card.description && (
            <p className="text-xs text-secondary-text mt-4">{card.description}</p>
          )}
        </Card>
      ))}
    </div>
  );
};
