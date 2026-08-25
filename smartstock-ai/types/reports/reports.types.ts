// Sales Report Data Models
export interface SalesTrendPoint {
  date: string; // ISO date or formatted group label
  amount: number;
  orderCount: number;
}

export interface TopProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
}

export interface CategorySalesPerformance {
  categoryId: string;
  categoryName: string;
  revenue: number;
  quantitySold: number;
}

export interface SalesReportResult {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesOverTime: SalesTrendPoint[];
  topProducts: TopProductPerformance[];
  salesByCategory: CategorySalesPerformance[];
}

// Inventory Report Data Models
export interface LowStockDetailItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  location?: string | null;
}

export interface RecentStockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string | null;
  createdAt: Date;
}

export interface InventoryReportResult {
  totalItems: number;
  totalValue: number; // Stock Valuation (quantity * cost_price or price)
  uniqueProductsCount: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  lowStockDetails: LowStockDetailItem[];
  recentMovements: RecentStockMovement[];
}

// Financial Report Data Models
export interface AccountBalanceDetail {
  accountId: string;
  accountName: string;
  type: string;
  balance: number;
}

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  totalAmount: number;
  count: number;
}

export interface FinancialReportResult {
  totalRevenue: number;
  totalReceivables: number; // Pending payments from sales
  accountBalances: AccountBalanceDetail[];
  paymentsMethodSummary: PaymentMethodBreakdown[];
}

// Dashboard Summary Data Models
export interface DashboardKPIs {
  totalSales: number;
  salesGrowthPercentage?: number; // MoM or WoW comparison
  orderCount: number;
  lowStockAlertsCount: number;
  activeAccountsBalance: number;
  receivablesAmount: number;
}

export interface RecentActivityFeedItem {
  id: string;
  type: 'sale' | 'payment' | 'stock_movement';
  description: string;
  amount?: number;
  date: Date;
}

export interface DashboardSummaryResult {
  kpis: DashboardKPIs;
  salesTrend: SalesTrendPoint[];
  lowStockAlerts: LowStockDetailItem[];
  recentActivity: RecentActivityFeedItem[];
}
