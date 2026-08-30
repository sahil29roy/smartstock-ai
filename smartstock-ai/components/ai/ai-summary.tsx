import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { SummarySkeleton } from "./ai-loading";
import { AIError } from "./ai-error";
import { aiClient } from "@/lib/api/ai.client";
import { BusinessSummary } from "@/lib/ai/types";

export const AiSummary = () => {
  const [data, setData] = useState<BusinessSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiClient.getBusinessSummary();
      if (res.success && res.summary) {
        setData(res.summary);
      } else {
        setError("Failed to generate AI Business Summary.");
      }
    } catch (err: any) {
      console.error("AI summary load error:", err);
      const msg = err?.message || "AI summary generation failed. Please verify your connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) return <SummarySkeleton />;
  if (error) return <AIError message={error} onRetry={fetchSummary} />;
  if (!data) return null;

  return (
    <Card className="border border-primary-light/20 bg-gradient-to-br from-primary-very-light/20 to-transparent hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Decorative background blur */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-primary/5 rounded-full filter blur-xl group-hover:scale-110 transition-transform duration-500" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary-light/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary-very-light dark:bg-primary-light/15 text-primary flex items-center justify-center border border-primary-light/10">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">SmartStock AI Business Summary</CardTitle>
            <CardDescription className="text-[10px]">Real-time AI operational insights and alerts</CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 border-primary-light/20 text-secondary-text hover:text-foreground"
          onClick={fetchSummary}
          title="Regenerate summary"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 text-xs">
        {/* Core summary text */}
        <p className="text-foreground font-medium leading-relaxed bg-surface/40 p-3 rounded-lg border border-primary-light/5">
          {data.summary}
        </p>

        {/* Insights & Recommendations Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Key Insights */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Key Insights</span>
            </div>
            {data.keyInsights.length === 0 ? (
              <p className="text-secondary-text italic text-[11px]">No specific insights identified.</p>
            ) : (
              <ul className="space-y-1.5 text-secondary-text">
                {data.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="leading-snug">{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Risks */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Potential Risks</span>
            </div>
            {data.risks.length === 0 ? (
              <p className="text-secondary-text italic text-[11px]">No operational risks detected.</p>
            ) : (
              <ul className="space-y-1.5 text-secondary-text">
                {data.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                    <span className="leading-snug">{risk}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Recommendations */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-success">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              <span>AI Recommendations</span>
            </div>
            {data.recommendations.length === 0 ? (
              <p className="text-secondary-text italic text-[11px]">No immediate action recommendations.</p>
            ) : (
              <ul className="space-y-1.5 text-secondary-text">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <span className="leading-snug">{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
