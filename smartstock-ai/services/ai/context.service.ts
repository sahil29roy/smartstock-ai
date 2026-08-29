import * as reportsService from "../reports/reports.service";
import * as inventoryService from "../inventory/inventory.service";
import * as procurementService from "../procurement/procurement.service";
import { UserRole } from "@/types/auth/auth.types";
import { AIDomain } from "@/lib/ai/types";

/**
 * Generates context for the Business Summary page.
 * Only accessible by ADMIN and MANAGER.
 */
export async function getSummaryContext(role: UserRole) {
  // Enforce access control
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Unauthorized to access business summary context.");
  }

  // Get last 30 days dashboard summary
  const summary = await reportsService.getDashboardSummary({}, role);
  
  // Fetch open POs
  let openPurchaseOrdersCount = 0;
  try {
    const allPurchases = await procurementService.getPurchases();
    openPurchaseOrdersCount = allPurchases.filter(
      (p) => p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED"
    ).length;
  } catch (err) {
    console.error("Context service procurement load error:", err);
  }

  return {
    sales: {
      totalSales: summary.kpis.totalSales,
      salesGrowthPercentage: summary.kpis.salesGrowthPercentage,
      orderCount: summary.kpis.orderCount,
    },
    inventory: {
      lowStockAlertsCount: summary.kpis.lowStockAlertsCount,
    },
    procurement: {
      openPurchaseOrdersCount,
    },
    finance: {
      // Receivables are only loaded if role is permitted
      receivablesAmount: summary.kpis.receivablesAmount,
      activeAccountsBalance: summary.kpis.activeAccountsBalance,
    },
    recentActivities: summary.recentActivity.slice(0, 10).map((a) => ({
      type: a.type,
      description: a.description,
      amount: a.amount,
    })),
  };
}

/**
 * Generates context for the Inventory Intelligence page.
 * Accessible by ADMIN, MANAGER, WAREHOUSE.
 */
export async function getInventoryContext(role: UserRole) {
  if (role !== "ADMIN" && role !== "MANAGER" && role !== "WAREHOUSE") {
    throw new Error("Unauthorized to access inventory context.");
  }

  const invReport = await reportsService.getInventoryReport({});
  const allInv = await inventoryService.getAllInventory();

  return {
    totalItems: invReport.totalItems,
    totalValue: invReport.totalValue,
    uniqueProductsCount: invReport.uniqueProductsCount,
    lowStockItemsCount: invReport.lowStockItemsCount,
    outOfStockItemsCount: invReport.outOfStockItemsCount,
    lowStockDetails: invReport.lowStockDetails.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      location: item.location,
    })),
    recentMovements: invReport.recentMovements.slice(0, 10).map((m) => ({
      productName: m.productName,
      sku: m.sku,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
    })),
    allInventory: allInv.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      reservedQuantity: item.reserved_quantity,
      availableQuantity: item.quantity - item.reserved_quantity,
      minimumStock: item.minimum_stock,
    })),
  };
}

/**
 * Generates context for Sales Intelligence page.
 * Accessible by ADMIN, MANAGER, SALES.
 */
export async function getSalesContext(role: UserRole) {
  if (role !== "ADMIN" && role !== "MANAGER" && role !== "SALES") {
    throw new Error("Unauthorized to access sales context.");
  }

  const salesReport = await reportsService.getSalesReport({});

  return {
    totalSales: salesReport.totalSales,
    totalOrders: salesReport.totalOrders,
    averageOrderValue: salesReport.averageOrderValue,
    topProducts: salesReport.topProducts.slice(0, 10).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      sku: p.sku,
      quantitySold: p.quantitySold,
      revenue: p.revenue,
    })),
    salesByCategory: salesReport.salesByCategory.map((c) => ({
      categoryName: c.categoryName,
      revenue: c.revenue,
      quantitySold: c.quantitySold,
    })),
    salesTrend: salesReport.salesOverTime.slice(-10).map((t) => ({
      date: t.date,
      amount: t.amount,
      orderCount: t.orderCount,
    })),
  };
}

/**
 * Dynamically fetches restricted context for the Ask AI query based on user role and question domains.
 */
export async function getAskContext(role: UserRole, question: string) {
  const normalizedQuestion = question.toLowerCase();
  const detectedDomains: AIDomain[] = [];

  // 1. Detect question domains
  if (
    normalizedQuestion.includes("sale") ||
    normalizedQuestion.includes("revenue") ||
    normalizedQuestion.includes("order") ||
    normalizedQuestion.includes("sell") ||
    normalizedQuestion.includes("sold") ||
    normalizedQuestion.includes("performance")
  ) {
    detectedDomains.push("sales");
  }
  if (
    normalizedQuestion.includes("stock") ||
    normalizedQuestion.includes("inventory") ||
    normalizedQuestion.includes("qty") ||
    normalizedQuestion.includes("quantity") ||
    normalizedQuestion.includes("product") ||
    normalizedQuestion.includes("warehouse")
  ) {
    detectedDomains.push("inventory");
  }
  if (
    normalizedQuestion.includes("purchase") ||
    normalizedQuestion.includes("procurement") ||
    normalizedQuestion.includes("po") ||
    normalizedQuestion.includes("supplier") ||
    normalizedQuestion.includes("receipt") ||
    normalizedQuestion.includes("grn")
  ) {
    detectedDomains.push("procurement");
  }
  if (
    normalizedQuestion.includes("payment") ||
    normalizedQuestion.includes("receivable") ||
    normalizedQuestion.includes("account") ||
    normalizedQuestion.includes("balance") ||
    normalizedQuestion.includes("owe") ||
    normalizedQuestion.includes("money") ||
    normalizedQuestion.includes("financial")
  ) {
    detectedDomains.push("finance");
  }
  if (normalizedQuestion.includes("customer")) {
    detectedDomains.push("customers");
  }

  // If no domains are detected, fallback to permitted domains for the role
  const domainsToFetch = detectedDomains.length > 0 ? detectedDomains : (["sales", "inventory", "procurement", "finance", "customers"] as AIDomain[]);

  // 2. Filter domains by user role (enforce RBAC)
  const permittedDomains: AIDomain[] = [];
  const addIfPermitted = (d: AIDomain) => {
    if (domainsToFetch.includes(d)) permittedDomains.push(d);
  };

  if (role === "ADMIN") {
    permittedDomains.push(...domainsToFetch);
  } else if (role === "MANAGER") {
    addIfPermitted("sales");
    addIfPermitted("inventory");
    addIfPermitted("procurement");
    addIfPermitted("customers");
  } else if (role === "SALES") {
    addIfPermitted("sales");
    addIfPermitted("customers");
  } else if (role === "WAREHOUSE") {
    addIfPermitted("inventory");
    addIfPermitted("procurement");
  } else if (role === "ACCOUNTS") {
    addIfPermitted("finance");
  }
  // Standard 'USER' gets no domains (empty context)

  // 3. Assemble filtered context
  const context: Record<string, any> = {
    userRole: role,
    accessibleDomains: permittedDomains,
  };

  if (permittedDomains.includes("sales")) {
    try {
      const salesData = await reportsService.getSalesReport({});
      context.sales = {
        totalSales: salesData.totalSales,
        totalOrders: salesData.totalOrders,
        averageOrderValue: salesData.averageOrderValue,
        topProducts: salesData.topProducts.slice(0, 5),
        salesByCategory: salesData.salesByCategory,
      };
    } catch (e) {
      console.error("Ask context sales fetch failed:", e);
    }
  }

  if (permittedDomains.includes("inventory")) {
    try {
      const invData = await reportsService.getInventoryReport({});
      context.inventory = {
        totalItems: invData.totalItems,
        totalValue: invData.totalValue,
        lowStockItemsCount: invData.lowStockItemsCount,
        outOfStockItemsCount: invData.outOfStockItemsCount,
        lowStockDetails: invData.lowStockDetails.slice(0, 8),
      };
    } catch (e) {
      console.error("Ask context inventory fetch failed:", e);
    }
  }

  if (permittedDomains.includes("procurement")) {
    try {
      const allPurchases = await procurementService.getPurchases();
      const openPOs = allPurchases.filter(
        (p) => p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED"
      );
      context.procurement = {
        openPurchaseOrdersCount: openPOs.length,
        openPurchaseOrders: openPOs.slice(0, 5).map((po) => ({
          id: po.id,
          totalAmount: po.total_amount,
          status: po.status,
        })),
      };
    } catch (e) {
      console.error("Ask context procurement fetch failed:", e);
    }
  }

  if (permittedDomains.includes("finance")) {
    try {
      const finData = await reportsService.getFinancialReport({});
      context.finance = {
        totalRevenue: finData.totalRevenue,
        totalReceivables: finData.totalReceivables,
        accountBalances: finData.accountBalances,
      };
    } catch (e) {
      console.error("Ask context finance fetch failed:", e);
    }
  }

  if (permittedDomains.includes("customers")) {
    try {
      const custData = await reportsService.getCustomerReport({});
      context.customers = custData.slice(0, 5).map((c) => ({
        customerName: c.customerName,
        totalSales: c.totalSales,
        totalPaid: c.totalPaid,
        totalPending: c.totalPending,
      }));
    } catch (e) {
      console.error("Ask context customers fetch failed:", e);
    }
  }

  return context;
}
