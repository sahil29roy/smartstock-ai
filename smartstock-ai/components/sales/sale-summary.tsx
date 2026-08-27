import React from "react";
import { Card } from "../ui/card";
import { Receipt, AlertTriangle, CheckCircle, ShoppingBag } from "lucide-react";
import { Sale } from "@/types/sales/sales.types";

interface SaleSummaryProps {
  sales: Sale[];
}

export const SaleSummary = ({ sales }: SaleSummaryProps) => {
  const activeSales = sales.filter((s) => s.status !== "CANCELLED");

  // Sum total sales value
  const totalSalesValue = activeSales.reduce((sum, s) => sum + s.total_amount, 0);

  // Sum paid value (rough estimation from status if payments are not side-loaded, or direct status mapping)
  const paidSalesValue = activeSales
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.total_amount, 0);

  // Outstanding / Unpaid (rough estimation from status)
  const pendingSalesValue = activeSales
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + s.total_amount, 0);
  
  const partiallyPaidSalesValue = activeSales
    .filter((s) => s.status === "PARTIALLY_PAID")
    .reduce((sum, s) => sum + s.total_amount * 0.5, 0); // half as approximation for summary

  const totalOutstanding = pendingSalesValue + partiallyPaidSalesValue;

  const totalOrders = activeSales.length;
  const completedOrders = activeSales.filter((s) => s.status === "PAID").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Total Sales Value</p>
          <h3 className="text-xl font-bold text-foreground mt-1">
            ${totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-secondary-text mt-1">{totalOrders} active orders</p>
        </div>
        <div className="h-10 w-10 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg flex items-center justify-center shrink-0">
          <ShoppingBag className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Paid Revenue</p>
          <h3 className="text-xl font-bold text-success mt-1">
            ${paidSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-secondary-text mt-1">{completedOrders} paid orders</p>
        </div>
        <div className="h-10 w-10 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
          <CheckCircle className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Est. Outstanding</p>
          <h3 className="text-xl font-bold text-warning mt-1">
            ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-secondary-text mt-1">Pending & partially paid</p>
        </div>
        <div className="h-10 w-10 bg-warning/10 text-warning rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Total Active Orders</p>
          <h3 className="text-xl font-bold text-foreground mt-1">
            {totalOrders}
          </h3>
          <p className="text-[10px] text-secondary-text mt-1">Excludes cancelled</p>
        </div>
        <div className="h-10 w-10 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg flex items-center justify-center shrink-0">
          <Receipt className="h-5 w-5" />
        </div>
      </Card>
    </div>
  );
};
