import * as repo from "./payment.repository";
import * as salesRepo from "../sales/sales.repository";
import * as accountsRepo from "../accounts/accounts.repository";
import { Payment, CreatePaymentInput } from "@/types/sales/sales.types";

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  if (!input.sale_id) {
    throw new Error("sale_id is required for sales payment.");
  }
  return repo.withTransaction(async (client) => {
    // 1. Lock and retrieve sale
    const sale = await salesRepo.getSaleByIdForUpdate(input.sale_id!, client);
    if (!sale) {
      throw new Error("Sale not found.");
    }

    if (sale.status === "CANCELLED") {
      throw new Error("Cannot record payment for a cancelled sale.");
    }

    // 2. Fetch completed payments to calculate outstanding balance
    const payments = await repo.getPaymentsBySaleId(input.sale_id!, client);
    const totalPaid = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const outstanding = Math.max(0, sale.total_amount - totalPaid);

    // 3. Verify payment amount does not exceed outstanding balance
    if (input.amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    if (input.amount > outstanding) {
      throw new Error(`Payment amount (${input.amount}) exceeds outstanding balance (${outstanding}).`);
    }

    // 4. Resolve account_id if not provided
    let accountId = input.account_id;
    if (!accountId) {
      if (input.payment_method === "CASH") {
        accountId = "c1111111-1111-1111-1111-111111111111"; // Cash Account
      } else {
        accountId = "c2222222-2222-2222-2222-222222222222"; // Bank Account
      }
    }

    // Lock and verify account exists
    const account = await accountsRepo.getAccountByIdForUpdate(accountId, client);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found.`);
    }

    // 5. Create payment record
    const payment = await repo.createPayment(
      {
        ...input,
        account_id: accountId
      },
      client
    );

    if (payment.status === "COMPLETED") {
      // Update account balance
      await accountsRepo.updateAccountBalance(accountId, payment.amount, client);

      // Recalculate new total paid and update sale status
      const newTotalPaid = totalPaid + payment.amount;
      let newStatus = sale.status;

      if (newTotalPaid >= sale.total_amount) {
        newStatus = "PAID";
      } else if (newTotalPaid > 0) {
        newStatus = "PARTIALLY_PAID";
      }

      if (sale.status !== newStatus) {
        await salesRepo.updateSale(sale.id, { status: newStatus }, client);
      }
    }

    return payment;
  });
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  return repo.getPaymentById(id);
}

export async function getPayments(filters?: { saleId?: string; purchaseId?: string; status?: string }): Promise<Payment[]> {
  return repo.getPayments(filters);
}
