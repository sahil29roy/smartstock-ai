import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SalesTrendPoint } from "@/types/reports/reports.types";

interface SalesOverviewProps {
  salesTrend: SalesTrendPoint[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompact = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    compactDisplay: "short",
  }).format(val);
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

export const SalesOverview = ({ salesTrend }: SalesOverviewProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: SalesTrendPoint;
    x: number;
    y: number;
    index: number;
  } | null>(null);

  if (!salesTrend || salesTrend.length === 0) {
    return (
      <Card className="h-[350px] flex flex-col justify-between">
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>Sales trend and volume over the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 border-t border-border bg-surface/50">
          <p className="text-sm font-medium text-foreground">No sales data for this period.</p>
          <p className="text-xs text-secondary-text mt-1">Try adjusting your date range filter.</p>
        </CardContent>
      </Card>
    );
  }

  // Dimension settings for the viewBox coordinate space
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute boundaries
  const amounts = salesTrend.map((d) => d.amount);
  const maxAmount = Math.max(...amounts, 1000); // Prevent divide by zero / flatline

  // Calculate scaling functions
  const getX = (index: number) => {
    if (salesTrend.length <= 1) {
      return paddingLeft + chartWidth / 2;
    }
    return paddingLeft + (index / (salesTrend.length - 1)) * chartWidth;
  };

  const getY = (amount: number) => {
    return svgHeight - paddingBottom - (amount / maxAmount) * chartHeight;
  };

  // Generate SVG path for line and area fill
  let linePath = "";
  let areaPath = "";

  if (salesTrend.length > 0) {
    salesTrend.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.amount);

      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${svgHeight - paddingBottom} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });

    const lastX = getX(salesTrend.length - 1);
    areaPath += ` L ${lastX} ${svgHeight - paddingBottom} Z`;
  }

  // Decide which x-axis labels to show to prevent overlaps
  const labelInterval = Math.max(1, Math.ceil(salesTrend.length / 6));

  return (
    <Card className="h-auto flex flex-col justify-between relative group">
      <CardHeader className="pb-2">
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>Daily revenue performance and transaction volume</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-[220px] relative mt-2">
        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-neutral-900 text-white dark:bg-neutral-800 dark:text-foreground text-xs p-2 rounded shadow-lg border border-border pointer-events-none transition-all duration-75"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100 - 15}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="font-semibold">{formatDate(hoveredPoint.point.date)}</p>
            <p className="text-primary mt-0.5 font-bold">
              {formatCurrency(hoveredPoint.point.amount)}
            </p>
            <p className="text-secondary-text text-[10px] mt-0.5">
              {hoveredPoint.point.orderCount} {hoveredPoint.point.orderCount === 1 ? "order" : "orders"}
            </p>
          </div>
        )}

        <div className="w-full h-full relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full text-foreground select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y Gridlines and Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const amount = maxAmount * ratio;
              const y = getY(amount);
              return (
                <g key={ratio} className="opacity-40 dark:opacity-20">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-secondary-text font-semibold font-mono"
                  >
                    {formatCompact(amount)}
                  </text>
                </g>
              );
            })}

            {/* SVG Areas and Paths */}
            {salesTrend.length > 1 && (
              <>
                {/* Area Fill */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Line Path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              </>
            )}

            {/* X-axis Line */}
            <line
              x1={paddingLeft}
              y1={svgHeight - paddingBottom}
              x2={svgWidth - paddingRight}
              y2={svgHeight - paddingBottom}
              stroke="var(--border)"
              strokeWidth="1.5"
            />

            {/* X Labels */}
            {salesTrend.map((d, i) => {
              const x = getX(i);
              const y = svgHeight - paddingBottom + 16;

              if (i % labelInterval === 0 || i === salesTrend.length - 1) {
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="text-[10px] fill-secondary-text font-semibold"
                  >
                    {formatDate(d.date)}
                  </text>
                );
              }
              return null;
            })}

            {/* Hover Guides & Interactive Circles */}
            {salesTrend.map((d, i) => {
              const x = getX(i);
              const y = getY(d.amount);

              const isHovered = hoveredPoint?.index === i;

              return (
                <g key={i}>
                  {/* Vertical hover line helper */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={svgHeight - paddingBottom}
                      stroke="var(--primary)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="opacity-60"
                    />
                  )}

                  {/* Visual Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3.5}
                    className="fill-surface stroke-primary transition-all duration-100"
                    strokeWidth={isHovered ? 3.5 : 2}
                  />

                  {/* Large transparent interactive target */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        point: d,
                        x,
                        y,
                        index: i,
                      })
                    }
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};
