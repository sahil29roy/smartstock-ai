import { UserRole } from "@/types/auth/auth.types";
import {
  CustomerReportResult,
  DashboardSummaryResult,
  FinancialReportResult,
  InventoryReportResult,
  SalesReportResult,
  SalesTrendPoint,
  LowStockDetailItem
} from "@/types/reports/reports.types";
import {
  CustomerReportQueryInput,
  DashboardSummaryQueryInput,
  FinancialReportQueryInput,
  InventoryReportQueryInput,
  SalesReportQueryInput
} from "@/validators/reports/reports.validator";

import * as dashboardRepo from "./dashboard.repository";
import * as salesRepo from "./sales.repository";
import * as inventoryRepo from "./inventory.repository";
import * as paymentRepo from "./payment.repository";
import * as customerRepo from "./customer.repository";

export async function getDashboardSummary(
  query: DashboardSummaryQueryInput,
  role: UserRole
): Promise<DashboardSummaryResult> {
  // Parse date parameters
  let startDate = query.startDate ? new Date(query.startDate) : null;
  let endDate = query.endDate ? new Date(query.endDate) : null;

  // Default to last 30 days if no date range is provided
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }
  if (!endDate) {
    endDate = new Date();
  }

  // Calculate duration for previous period comparison
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - durationMs);
  const prevEndDate = startDate;

  // Fetch metrics based on role permissions
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isSales = role === "SALES";
  const isWarehouse = role === "WAREHOUSE";
  const isAccounts = role === "ACCOUNTS";

  // 1. KPI cards aggregation
  let totalSales = 0;
  let orderCount = 0;
  let salesGrowthPercentage = 0;
  let lowStockAlertsCount = 0;
  let activeAccountsBalance = 0;
  let receivablesAmount = 0;

  if (isAdmin || isManager || isSales || isAccounts) {
    const currentSalesStats = await dashboardRepo.getSalesTotalAndCount(startDate, endDate);
    totalSales = currentSalesStats.totalSales;
    orderCount = currentSalesStats.orderCount;

    // Calculate growth percentage
    const currentTotal = await dashboardRepo.getSalesTotalForPeriod(startDate, endDate);
    const prevTotal = await dashboardRepo.getSalesTotalForPeriod(prevStartDate, prevEndDate);
    if (prevTotal > 0) {
      salesGrowthPercentage = parseFloat((((currentTotal - prevTotal) / prevTotal) * 100).toFixed(2));
    } else if (currentTotal > 0) {
      salesGrowthPercentage = 100.00;
    } else {
      salesGrowthPercentage = 0.00;
    }
  }

  if (isAdmin || isManager || isWarehouse) {
    lowStockAlertsCount = await dashboardRepo.getLowStockCount();
  }

  if (isAdmin || isManager || isAccounts) {
    activeAccountsBalance = await dashboardRepo.getAccountsBalance();
    receivablesAmount = await dashboardRepo.getReceivablesAmount(startDate, endDate);
  }

  // 2. Sales Trend (not visible to warehouse)
  let salesTrend: SalesTrendPoint[] = [];
  if (isAdmin || isManager || isSales || isAccounts) {
    salesTrend = await dashboardRepo.getSalesTrend(startDate, endDate, "day");
  }

  // 3. Low stock alerts (visible to warehouse and admin/manager only)
  let lowStockAlerts: LowStockDetailItem[] = [];
  if (isAdmin || isManager || isWarehouse) {
    lowStockAlerts = await dashboardRepo.getLowStockAlerts();
  }

  // 4. Recent Activities (filtered by role)
  const allActivities = await dashboardRepo.getRecentActivity();
  let recentActivity = allActivities;

  if (isWarehouse) {
    recentActivity = allActivities.filter(a => a.type === "stock_movement");
  } else if (isSales) {
    recentActivity = allActivities.filter(a => a.type === "sale");
  } else if (isAccounts) {
    recentActivity = allActivities.filter(a => a.type === "sale" || a.type === "payment");
  }

  return {
    kpis: {
      totalSales: isAdmin || isManager || isSales || isAccounts ? totalSales : 0,
      salesGrowthPercentage: isAdmin || isManager || isSales || isAccounts ? salesGrowthPercentage : undefined,
      orderCount: isAdmin || isManager || isSales || isAccounts ? orderCount : 0,
      lowStockAlertsCount: isAdmin || isManager || isWarehouse ? lowStockAlertsCount : 0,
      activeAccountsBalance: isAdmin || isManager || isAccounts ? activeAccountsBalance : 0,
      receivablesAmount: isAdmin || isManager || isAccounts ? receivablesAmount : 0,
    },
    salesTrend,
    lowStockAlerts,
    recentActivity
  };
}

export async function getSalesReport(
  query: SalesReportQueryInput
): Promise<SalesReportResult> {
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;
  const categoryId = query.categoryId || null;
  const productId = query.productId || null;
  const groupBy = query.groupBy || "day";

  const summary = await salesRepo.getSalesSummary(startDate, endDate, categoryId, productId);
  const salesOverTime = await salesRepo.getSalesTrend(startDate, endDate, groupBy, categoryId, productId);
  const topProducts = await salesRepo.getTopProducts(startDate, endDate, categoryId, productId);
  const salesByCategory = await salesRepo.getSalesByCategory(startDate, endDate, categoryId, productId);

  return {
    ...summary,
    salesOverTime,
    topProducts,
    salesByCategory
  };
}

export async function getInventoryReport(
  query: InventoryReportQueryInput
): Promise<InventoryReportResult> {
  const categoryId = query.categoryId || null;

  const summary = await inventoryRepo.getInventorySummary(categoryId);
  const lowStockDetails = await inventoryRepo.getLowStockDetails(categoryId);
  const recentMovements = await inventoryRepo.getRecentMovements(categoryId);

  // Filter lowStockDetails according to status filter
  let filteredLowStockDetails = lowStockDetails;
  if (query.status === "out_of_stock") {
    filteredLowStockDetails = lowStockDetails.filter(item => item.currentStock === 0);
  }

  return {
    ...summary,
    lowStockDetails: filteredLowStockDetails,
    recentMovements
  };
}

export async function getFinancialReport(
  query: FinancialReportQueryInput
): Promise<FinancialReportResult> {
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;

  const totalRevenue = await paymentRepo.getTotalRevenue(startDate, endDate);
  const totalReceivables = await paymentRepo.getTotalReceivables(startDate, endDate);
  const accountBalances = await paymentRepo.getAccountBalances();
  const paymentsMethodSummary = await paymentRepo.getPaymentsMethodSummary(startDate, endDate);

  return {
    totalRevenue,
    totalReceivables,
    accountBalances,
    paymentsMethodSummary
  };
}

export async function getCustomerReport(
  query: CustomerReportQueryInput
): Promise<CustomerReportResult> {
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;
  const limit = query.limit || 10;

  return await customerRepo.getCustomerReport(startDate, endDate, limit);
}
