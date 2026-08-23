import * as repo from "./accounts.repository";
import { Account, CreateAccountInput, UpdateAccountInput } from "@/types/accounts/accounts.types";

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const existing = await repo.getAccountByName(input.name);
  if (existing) {
    throw new Error(`Account with name "${input.name}" already exists.`);
  }
  return repo.createAccount(input);
}

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
  const existing = await repo.getAccountById(id);
  if (!existing) {
    throw new Error("Account not found.");
  }
  if (input.name && input.name !== existing.name) {
    const duplicate = await repo.getAccountByName(input.name);
    if (duplicate) {
      throw new Error(`Account with name "${input.name}" already exists.`);
    }
  }
  return repo.updateAccount(id, input);
}

export async function getAccountById(id: string): Promise<Account | null> {
  return repo.getAccountById(id);
}

export async function listAccounts(): Promise<Account[]> {
  return repo.listAccounts();
}
