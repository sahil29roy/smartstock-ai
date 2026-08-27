import React, { useState } from "react";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip = ({ content, children, position = "top", className = "" }: TooltipProps) => {
  const [show, setShow] = useState(false);

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute ${positionStyles[position]} bg-neutral-950 dark:bg-neutral-800 border border-border/20 text-white dark:text-foreground text-[10px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-50 pointer-events-none select-none animate-fade-in`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
