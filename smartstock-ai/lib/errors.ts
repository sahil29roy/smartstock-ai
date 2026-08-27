import { NextResponse } from "next/server";

export function handleRouteError(error: any, contextStr: string): NextResponse {
  console.error(`${contextStr} error:`, error);

  // Check for Zod validation error
  if (error.name === "ZodError" || error.constructor?.name === "ZodError") {
    return NextResponse.json(
      { error: "Validation failed", details: error.format() },
      { status: 400 }
    );
  }

  const message = error.message || "";

  // Check for unique key constraint violations (conflict)
  if (
    message.includes("already exists") || 
    message.includes("unique constraint") ||
    error.code === "23505" // Postgres unique_violation
  ) {
    let cleanMessage = "A resource with this identifier already exists.";
    if (message.includes("users_email_key")) {
      cleanMessage = "User with this email already exists.";
    } else if (message.includes("products_sku_key")) {
      cleanMessage = "Product with this SKU already exists.";
    } else if (message.includes("categories_name_key") || message.includes("category with this name already exists")) {
      cleanMessage = "A category with this name already exists.";
    } else if (message.includes("accounts_name_key") || message.includes("Account with name")) {
      cleanMessage = "An account with this name already exists.";
    } else if (message.includes("suppliers_name_key") || message.includes("Supplier with name")) {
      cleanMessage = "A supplier with this name already exists.";
    } else if (message.includes("challan_number") || message.includes("Challan number")) {
      cleanMessage = "A delivery challan with this number already exists.";
    } else if (error.message && !error.message.includes("unique constraint") && !error.message.includes("violates")) {
      cleanMessage = error.message;
    }
    return NextResponse.json({ error: cleanMessage }, { status: 409 });
  }

  // Check for foreign key violations (bad request or not found)
  if (error.code === "23503") {
    return NextResponse.json(
      { error: "Referenced resource does not exist or cannot be modified due to dependencies." },
      { status: 400 }
    );
  }

  // Check for specific known application errors
  if (
    message.includes("not found") || 
    message.includes("not exist")
  ) {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  if (
    message.includes("Insufficient") ||
    message.includes("Cannot receive") ||
    message.includes("Cannot pay") ||
    message.includes("Cannot cancel") ||
    message.includes("exceeds outstanding") ||
    message.includes("must be greater than") ||
    message.includes("validation failed") ||
    message.includes("exceeding") ||
    message.includes("status") ||
    message.includes("inactive")
  ) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Default internal server error (obscure database internals)
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
