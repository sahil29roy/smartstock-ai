import React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Separator = ({ className = "", orientation = "horizontal", ...props }: SeparatorProps) => {
  return (
    <div
      className={`bg-border shrink-0 ${
        orientation === "horizontal" ? "h-[1px] w-full" : "w-[1px] h-full"
      } ${className}`}
      {...props}
    />
  );
};
