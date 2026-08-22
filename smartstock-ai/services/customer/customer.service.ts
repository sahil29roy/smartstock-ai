import * as repo from "./customer.repository";
import { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/types/customer/customer.types";


export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  // Validate duplicate email
  const existingEmail = await repo.getCustomerByEmail(input.email);
  if (existingEmail) {
    throw new Error("An active customer with this email already exists.");
  }

  // Validate duplicate phone
  if (input.phone) {
    const existingPhone = await repo.getCustomerByPhone(input.phone);
    if (existingPhone) {
      throw new Error("An active customer with this phone number already exists.");
    }
  }

  // Validate duplicate GST
  if (input.gst_number) {
    const existingGst = await repo.getCustomerByGstNumber(input.gst_number);
    if (existingGst) {
      throw new Error("An active customer with this GST number already exists.");
    }
  }

  return repo.createCustomer(input);
}


// Update an existing customer's profile.

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const current = await repo.getCustomerById(id);
  if (!current) {
    throw new Error("Customer not found.");
  }

  // Validate duplicate email if changed
  if (input.email && input.email !== current.email) {
    const existingEmail = await repo.getCustomerByEmail(input.email);
    if (existingEmail) {
      throw new Error("An active customer with this email already exists.");
    }
  }

  // Validate duplicate phone if changed
  if (input.phone !== undefined && input.phone !== current.phone && input.phone !== null) {
    const existingPhone = await repo.getCustomerByPhone(input.phone);
    if (existingPhone) {
      throw new Error("An active customer with this phone number already exists.");
    }
  }

  // Validate duplicate GST if changed
  if (input.gst_number !== undefined && input.gst_number !== current.gst_number && input.gst_number !== null) {
    const existingGst = await repo.getCustomerByGstNumber(input.gst_number);
    if (existingGst) {
      throw new Error("An active customer with this GST number already exists.");
    }
  }

  const updated = await repo.updateCustomer(id, input);
  if (!updated) {
    throw new Error("Failed to update customer details.");
  }
  return updated;
}


export async function getCustomerById(id: string): Promise<Customer> {
  const customer = await repo.getCustomerById(id);
  if (!customer) {
    throw new Error("Customer not found.");
  }
  return customer;
}

export async function getCustomers(includeDeleted: boolean = false): Promise<Customer[]> {
  return repo.getCustomers(includeDeleted);
}


export async function deleteCustomer(id: string): Promise<boolean> {
  const exists = await repo.getCustomerById(id);
  if (!exists) {
    throw new Error("Customer not found.");
  }
  return repo.softDeleteCustomer(id);
}


export async function restoreCustomer(id: string): Promise<boolean> {
  const exists = await repo.getCustomerById(id, true);
  if (!exists) {
    throw new Error("Customer not found.");
  }
  if (exists.deleted_at === null) {
    throw new Error("Customer is not deleted.");
  }
  return repo.restoreCustomer(id);
}
