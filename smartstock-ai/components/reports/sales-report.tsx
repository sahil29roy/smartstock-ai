import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import { ReportSummary } from "./report-summary";
import { SalesReportResult, SalesTrendPoint } from "@/types/reports/reports.types";
import { TrendingUp, ShoppingBag, CreditCard, Tag, Sparkles, RefreshCw, AlertTriangle, Lightbulb } from "lucide-react";
import { aiClient } from "@/lib/api/ai.client";
import { SalesAnalysisSkeleton } from "../ai/ai-loading";
import { AIError } from "../ai/ai-error";
import { Button } from "../ui/button";

interface SalesReportProps {
  data: SalesReportResult;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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

export const SalesReport = ({ data }: SalesReportProps) => {
  const [aiInsights, setAiInsights] = useState<{
    summary: string;
    observations: string[];
    trends: string[];
    recommendations: string[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(true);
  const [errorAi, setErrorAi] = useState<string | null>(null);

  const fetchAiInsights = async () => {
    setLoadingAi(true);
    setErrorAi(null);
    try {
      const res = await aiClient.getSalesInsights();
      if (res.success && res.insights) {
        setAiInsights(res.insights);
      } else {
        setErrorAi("Failed to load Sales AI insights.");
      }
    } catch (err: any) {
      console.error("AI sales report load error:", err);
      setErrorAi(err?.message || "AI sales assistant is offline.");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiInsights();
  }, []);

  const [hoveredPoint, setHoveredPoint] = useState<{
    point: SalesTrendPoint;
    x: number;
    y: number;
    index: number;
  } | null>(null);

  const summaryCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalSales),
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
      description: "Aggregated gross sales value",
    },
    {
      title: "Total Orders",
      value: data.totalOrders,
      icon: <ShoppingBag className="h-4 w-4 text-warning" />,
      description: "Count of all sales orders",
    },
    {
      title: "Average Order Value",
      value: formatCurrency(data.averageOrderValue),
      icon: <CreditCard className="h-4 w-4 text-success" />,
      description: "Average spent per order transaction",
    },
    {
      title: "Active Categories",
      value: data.salesByCategory.length,
      icon: <Tag className="h-4 w-4 text-info" />,
      description: "Categories with recorded sales",
    },
  ];

  // SVG Chart settings
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const amounts = data.salesOverTime.map((d) => d.amount);
  const maxAmount = Math.max(...amounts, 1000);

  const getX = (index: number) => {
    if (data.salesOverTime.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.salesOverTime.length - 1)) * chartWidth;
  };

  const getY = (amount: number) => {
    return svgHeight - paddingBottom - (amount / maxAmount) * chartHeight;
  };

  let linePath = "";
  let areaPath = "";

  if (data.salesOverTime.length > 0) {
    data.salesOverTime.forEach((d, i) => {
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

    const lastX = getX(data.salesOverTime.length - 1);
    areaPath += ` L ${lastX} ${svgHeight - paddingBottom} Z`;
  }

  const labelInterval = Math.max(1, Math.ceil(data.salesOverTime.length / 6));

  return (
    <div className="space-y-6">
      {/* Metrics Summary cards */}
      <ReportSummary cards={summaryCards} />

      {/* SVG Trend Line Chart */}
      <Card className="h-auto flex flex-col justify-between relative group">
        <CardHeader className="pb-2">
          <CardTitle>Sales Revenue Trend</CardTitle>
          <CardDescription>Visual sales performance over time</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 min-h-[220px] relative mt-2">
          {hoveredPoint && (
            <div
              className="absolute z-10 bg-neutral-950 text-white dark:bg-neutral-800 dark:text-foreground text-xs p-2 rounded shadow-lg border border-border pointer-events-none transition-all duration-75"
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

          {data.salesOverTime.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-secondary-text text-sm">
              No trend data available for this period.
            </div>
          ) : (
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
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const val = maxAmount * ratio;
                  const y = svgHeight - paddingBottom - ratio * chartHeight;
                  return (
                    <g key={i} className="opacity-40 dark:opacity-20">
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[9px] fill-secondary-text font-mono font-bold"
                      >
                        {new Intl.NumberFormat("en-IN", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(val)}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {data.salesOverTime.map((d, i) => {
                  if (i % labelInterval !== 0) return null;
                  const x = getX(i);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={svgHeight - paddingBottom + 16}
                      textAnchor="middle"
                      className="text-[9px] fill-secondary-text font-semibold font-mono"
                    >
                      {formatDate(d.date)}
                    </text>
                  );
                })}

                {/* Chart paths */}
                {data.salesOverTime.length > 0 && (
                  <>
                    <path
                      d={areaPath}
                      fill="url(#chartGradient)"
                    />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2.5"
                    />

                    {/* interactive data points */}
                    {data.salesOverTime.map((d, i) => {
                      const x = getX(i);
                      const y = getY(d.amount);
                      const isHovered = hoveredPoint?.index === i;

                      return (
                        <g key={i}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 5 : 2.5}
                            className="fill-primary stroke-surface"
                            strokeWidth={isHovered ? 2 : 1}
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={10}
                            className="fill-transparent cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ point: d, x, y, index: i })}
                          />
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products & Categories performance list */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 select-none">
        {/* Top Products */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Top Performing Products</CardTitle>
            <CardDescription>Products ranked by gross revenue contribution</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <div className="text-center p-6 text-xs text-secondary-text">
                No products sold in this period.
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Product</TableHeaderCell>
                      <TableHeaderCell className="text-right">Qty Sold</TableHeaderCell>
                      <TableHeaderCell className="text-right">Revenue</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topProducts.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-semibold">
                          <div>
                            <div className="text-foreground">{p.productName}</div>
                            <div className="text-[10px] text-secondary-text font-mono">SKU: {p.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">{p.quantitySold}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-success">
                          {formatCurrency(p.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Sales by Category</CardTitle>
            <CardDescription>Revenue contribution by product category</CardDescription>
          </CardHeader>
          <CardContent>
            {data.salesByCategory.length === 0 ? (
              <div className="text-center p-6 text-xs text-secondary-text">
                No categories sold in this period.
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Category</TableHeaderCell>
                      <TableHeaderCell className="text-right">Qty Sold</TableHeaderCell>
                      <TableHeaderCell className="text-right">Revenue</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.salesByCategory.map((c) => (
                      <TableRow key={c.categoryId}>
                        <TableCell className="font-semibold text-foreground">{c.categoryName}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{c.quantitySold}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-success">
                          {formatCurrency(c.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        {/* Sales AI Analysis block */}
        <div className="col-span-full mt-2">
          {loadingAi ? (
            <SalesAnalysisSkeleton />
          ) : errorAi ? (
            <AIError message={errorAi} onRetry={fetchAiInsights} />
          ) : aiInsights ? (
            <Card className="border border-primary-light/20 bg-gradient-to-br from-primary-very-light/20 to-transparent relative overflow-hidden group">
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-primary/5 rounded-full filter blur-xl group-hover:scale-110 transition-transform duration-500" />
              
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary-light/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary-very-light dark:bg-primary-light/15 text-primary flex items-center justify-center border border-primary-light/10">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">AI Sales Analytics & Trends</CardTitle>
                    <CardDescription className="text-[10px]">AI-generated performance synthesis and recommendations</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-primary-light/20 text-secondary-text hover:text-foreground bg-transparent"
                  onClick={fetchAiInsights}
                  title="Recalculate insights"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs">
                <p className="text-foreground font-medium leading-relaxed bg-surface/40 p-3 rounded-lg border border-primary-light/5">
                  {aiInsights.summary}
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>Sales Observations</span>
                    </div>
                    <ul className="space-y-1.5 text-secondary-text">
                      {aiInsights.observations.map((obs, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="leading-snug">{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-warning-dark dark:text-warning/80">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Identified Trends</span>
                    </div>
                    <ul className="space-y-1.5 text-secondary-text">
                      {aiInsights.trends.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                          <span className="leading-snug">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-success">
                      <Lightbulb className="h-3.5 w-3.5 text-success" />
                      <span>AI Recommendations</span>
                    </div>
                    <ul className="space-y-1.5 text-secondary-text">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                          <span className="leading-snug">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};
