import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type DatePreset = "today" | "week" | "month" | "custom";

export interface DashboardHeaderProps {
  onDateChange: (startDate?: string, endDate?: string) => void;
}

export const DashboardHeader = ({ onDateChange }: DashboardHeaderProps) => {
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const calculateDates = useCallback((selectedPreset: DatePreset) => {
    if (selectedPreset === "custom") {
      return; // Handled by manual Apply
    }

    let start: Date | undefined;
    let end: Date | undefined;

    if (selectedPreset === "today") {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (selectedPreset === "week") {
      start = new Date();
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (selectedPreset === "month") {
      start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    if (start && end) {
      onDateChange(start.toISOString(), end.toISOString());
    } else {
      onDateChange(undefined, undefined);
    }
  }, [onDateChange]);

  // Trigger initial change on mount
  useEffect(() => {
    calculateDates(preset);
  }, [calculateDates, preset]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as DatePreset;
    setPreset(val);
    if (val !== "custom") {
      calculateDates(val);
    } else {
      // Initialize custom inputs to current month
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Format as YYYY-MM-DD
      const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      setCustomStart(formatDate(startOfCurrentMonth));
      setCustomEnd(formatDate(now));
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;

    // Build ISO dates.
    // customStart: start of day (00:00:00.000)
    // customEnd: end of day (23:59:59.999)
    const start = new Date(customStart + "T00:00:00.000Z");
    const end = new Date(customEnd + "T23:59:59.999Z");

    if (start > end) {
      alert("Start date must be less than or equal to end date");
      return;
    }

    onDateChange(start.toISOString(), end.toISOString());
  };

  const renderDateControls = () => {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-secondary-text shrink-0" />
          <Select
            value={preset}
            onChange={handlePresetChange}
            className="w-40 h-9"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </Select>
        </div>

        {preset === "custom" && (
          <form
            onSubmit={handleApplyCustomRange}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 sm:mt-0 animate-fade-in"
          >
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full sm:w-36 h-9"
                required
              />
              <span className="text-secondary-text text-xs">to</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full sm:w-36 h-9"
                required
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Apply
            </Button>
          </form>
        )}
      </div>
    );
  };

  return (
    <PageHeader
      title="Dashboard"
      description="Overview of your business operations and performance."
      actions={renderDateControls()}
    />
  );
};
