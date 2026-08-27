import React from "react";
import { Card } from "../ui/card";
import { Truck, CheckCircle2, AlertTriangle, XSquare } from "lucide-react";
import { Challan } from "@/types/sales/sales.types";

interface ChallanSummaryProps {
  challans: Challan[];
}

export const ChallanSummary = ({ challans }: ChallanSummaryProps) => {
  const total = challans.length;
  const pending = challans.filter((c) => c.status === "PENDING").length;
  const dispatched = challans.filter((c) => c.status === "DISPATCHED").length;
  const delivered = challans.filter((c) => c.status === "DELIVERED").length;
  const cancelled = challans.filter((c) => c.status === "CANCELLED").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Total Dispatches</span>
          <h3 className="text-xl font-bold text-foreground mt-1">{total}</h3>
          <p className="text-[10px] text-secondary-text mt-0.5">{cancelled} cancelled</p>
        </div>
        <div className="h-10 w-10 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg flex items-center justify-center shrink-0">
          <Truck className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Dispatched</span>
          <h3 className="text-xl font-bold text-success mt-1">{dispatched}</h3>
          <p className="text-[10px] text-secondary-text mt-0.5">En route to customer</p>
        </div>
        <div className="h-10 w-10 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
          <Truck className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Delivered</span>
          <h3 className="text-xl font-bold text-success mt-1">{delivered}</h3>
          <p className="text-[10px] text-secondary-text mt-0.5">Fulfillment complete</p>
        </div>
        <div className="h-10 w-10 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Pending / Draft</span>
          <h3 className="text-xl font-bold text-warning mt-1">{pending}</h3>
          <p className="text-[10px] text-secondary-text mt-0.5">Awaiting dispatch</p>
        </div>
        <div className="h-10 w-10 bg-warning/10 text-warning rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </Card>
    </div>
  );
};
