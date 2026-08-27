import React from "react";
import { StatusBadge } from "@/components/common/status-badge";

interface ProfileHeaderProps {
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string | Date;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const ProfileHeader = ({ name, email, role, createdAt }: ProfileHeaderProps) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 select-none">
      <div className="h-16 w-16 rounded-full bg-primary-very-light dark:bg-primary-light/10 text-primary border border-primary-light/20 flex items-center justify-center font-bold text-2xl">
        {getInitials(name)}
      </div>
      <div className="text-center sm:text-left space-y-1">
        <h3 className="text-xl font-bold text-foreground">{name || "SmartStock User"}</h3>
        <p className="text-xs text-secondary-text">{email}</p>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
          <StatusBadge status={role || "USER"} />
          <span className="text-[10px] text-secondary-text">
            Member since {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};
