import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = ({ className = "", hoverable = false, children, ...props }: CardProps) => {
  return (
    <div
      className={`bg-surface border border-border rounded-lg text-foreground shadow-sm transition-shadow ${
        hoverable ? "hover:shadow-md cursor-pointer animate-fade-in" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 pb-3 flex flex-col gap-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-base font-semibold tracking-tight text-foreground ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-xs text-secondary-text ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-5 pt-0 flex items-center border-t border-border mt-5 ${className}`} {...props}>
    {children}
  </div>
);

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const KpiCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  className = "",
}: KpiCardProps) => {
  const changeColor = {
    increase: "text-success bg-success/10 dark:bg-success/5 border-success/10",
    decrease: "text-danger bg-danger/10 dark:bg-danger/5 border-danger/10",
    neutral: "text-secondary-text bg-background border-border",
  };

  return (
    <Card className={`p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider">{title}</span>
          <h4 className="text-2xl font-bold tracking-tight text-foreground mt-1.5">{value}</h4>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-background text-secondary-text flex items-center justify-center border border-border">
            {icon}
          </div>
        )}
      </div>
      {(change || description) && (
        <div className="flex items-center gap-2 mt-4 text-xs">
          {change && (
            <span className={`px-1.5 py-0.5 rounded font-semibold border ${changeColor[changeType]}`}>
              {change}
            </span>
          )}
          {description && <span className="text-secondary-text">{description}</span>}
        </div>
      )}
    </Card>
  );
};
