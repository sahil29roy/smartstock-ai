import "dotenv/config";
import { pool, query } from "@/lib/db";
import * as categoryService from "@/services/category/category.service";
import * as productService from "@/services/product/product.service";
import * as salesService from "@/services/sales/sales.service";
import * as procurementService from "@/services/procurement/procurement.service";
import * as inventoryRepo from "@/services/inventory/inventory.repository";
import * as productRepo from "@/services/product/product.repository";

// Valid UUIDv4s for deterministic testing
const TEST_USER_ID = "e5264b38-2321-4770-bc2f-6821217e651e";
const TEST_CUSTOMER_ID = "7541b65e-2b58-450f-bcbc-79f041bf6353";
const TEST_CATEGORY_ID = "32d8494b-14d6-4447-97fe-902e1c312781";
const TEST_SUPPLIER_ID = "195d8208-8e6f-40e9-b223-2895e6f3dc8e";
const TEST_ACCOUNT_ID = "db8957bf-fa1c-43f1-b930-57121cf3e68e";
const TEST_PRODUCT_SKU = "INTEGRATION-SKU-999";

async function cleanup() {
  console.log("Cleaning up test records...");
  
  // Find product ID if it exists
  const prodRes = await query("SELECT id FROM products WHERE sku = $1", [TEST_PRODUCT_SKU]);
  const productId = prodRes.rows[0]?.id;

  // Deletions in dependency order
  if (productId) {
    await query("DELETE FROM goods_receipt_items WHERE product_id = $1", [productId]);
  }
  await query("DELETE FROM goods_receipts WHERE purchase_id IN (SELECT id FROM purchases WHERE supplier_id = $1)", [TEST_SUPPLIER_ID]);
  if (productId) {
    await query("DELETE FROM purchase_items WHERE product_id = $1", [productId]);
  }
  await query("DELETE FROM purchases WHERE supplier_id = $1", [TEST_SUPPLIER_ID]);
  await query("DELETE FROM suppliers WHERE name = 'Test Supplier' OR id = $1", [TEST_SUPPLIER_ID]);
  
  await query("DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = $1)", [TEST_CUSTOMER_ID]);
  if (productId) {
    await query("DELETE FROM challan_items WHERE product_id = $1", [productId]);
  }
  await query("DELETE FROM challans WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = $1)", [TEST_CUSTOMER_ID]);
  if (productId) {
    await query("DELETE FROM sale_items WHERE product_id = $1", [productId]);
  }
  await query("DELETE FROM sales WHERE customer_id = $1", [TEST_CUSTOMER_ID]);
  
  if (productId) {
    await query("DELETE FROM stock_movements WHERE product_id = $1", [productId]);
    await query("DELETE FROM inventory WHERE product_id = $1", [productId]);
  }
  await query("DELETE FROM products WHERE sku = $1 OR name = 'Test Integration Product'", [TEST_PRODUCT_SKU]);
  await query("DELETE FROM categories WHERE name = 'Test Category' OR id = $1", [TEST_CATEGORY_ID]);
  await query("DELETE FROM customers WHERE email = 'customer@smartstock.com' OR id = $1", [TEST_CUSTOMER_ID]);
  await query("DELETE FROM users WHERE email = 'test@smartstock.com' OR id = $1", [TEST_USER_ID]);
  await query("DELETE FROM accounts WHERE name = 'Test Main Account' OR id = $1", [TEST_ACCOUNT_ID]);

  console.log("Cleanup complete.");
}

async function setup() {
  console.log("Setting up test records...");
  
  await query(
    `INSERT INTO users (id, name, email, password_hash, role, is_active)
     VALUES ($1, 'Test User', 'test@smartstock.com', 'hash', 'ADMIN', true)`,
    [TEST_USER_ID]
  );

  await query(
    `INSERT INTO customers (id, name, email, phone)
     VALUES ($1, 'Test Customer', 'customer@smartstock.com', '1234567890')`,
    [TEST_CUSTOMER_ID]
  );

  await query(
    `INSERT INTO categories (id, name, description, created_by)
     VALUES ($1, 'Test Category', 'For integration testing', $2)`,
    [TEST_CATEGORY_ID, TEST_USER_ID]
  );

  await query(
    `INSERT INTO suppliers (id, name, email, phone, created_by)
     VALUES ($1, 'Test Supplier', 'supplier@test.com', '0987654321', $2)`,
    [TEST_SUPPLIER_ID, TEST_USER_ID]
  );

  await query(
    `INSERT INTO accounts (id, name, type, balance, created_by)
     VALUES ($1, 'Test Main Account', 'CASH', 10000.00, $2)`,
    [TEST_ACCOUNT_ID, TEST_USER_ID]
  );

  console.log("Setup complete.");
}

async function runTests() {
  try {
    await cleanup();
    await setup();

    console.log("\n==================================================");
    console.log("TEST 1: Product Creation and Inventory Initialization");
    console.log("==================================================");
    
    const product = await productService.createProduct({
      category_id: TEST_CATEGORY_ID,
      name: "Test Integration Product",
      sku: TEST_PRODUCT_SKU,
      description: "Testing products",
      price: 25.00,
      minimum_stock: 2,
      location: "Warehouse Shelf A",
      created_by: TEST_USER_ID
    });

    const productId = product.id;
    console.log(`Product created with ID: ${productId}`);

    // Verify it initialized inventory record
    const inventory = await inventoryRepo.getInventoryByProductId(productId);
    if (!inventory) {
      throw new Error("FAIL: Inventory record not automatically initialized.");
    }
    if (inventory.location !== "Warehouse Shelf A") {
      throw new Error(`FAIL: Inventory location mismatch. Expected 'Warehouse Shelf A', got '${inventory.location}'.`);
    }
    console.log("PASS: Product created and inventory initialized successfully.");


    console.log("\n==================================================");
    console.log("TEST 2: Category Soft-Delete Constraint");
    console.log("==================================================");
    
    try {
      await categoryService.deleteCategory(TEST_CATEGORY_ID);
      throw new Error("FAIL: Category was deleted despite active products referencing it.");
    } catch (err: any) {
      if (err.message.includes("active products are referencing it")) {
        console.log("PASS: Category soft delete prevented successfully.");
      } else {
        throw err;
      }
    }


    console.log("\n==================================================");
    console.log("TEST 3: Concurrent Sales stock reservation");
    console.log("==================================================");
    
    // Set initial product quantity to 5
    await inventoryRepo.updateInventory(productId, { quantity: 5, reserved_quantity: 0 });

    // Request 10 sales concurrently, each purchasing 1 product
    console.log("Firing 10 concurrent sales requests (1 quantity each, stock available: 5)...");
    const salePromises = Array.from({ length: 10 }).map((_, idx) => {
      return salesService.createSale(
        {
          customer_id: TEST_CUSTOMER_ID,
          created_by: TEST_USER_ID
        },
        [{ product_id: productId, quantity: 1, unit_price: 25.00 }]
      );
    });

    const results = await Promise.allSettled(salePromises);

    const successfulSales: any[] = [];
    let failedSalesCount = 0;

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        successfulSales.push(res.value);
      } else {
        failedSalesCount++;
      }
    });

    console.log(`Results: ${successfulSales.length} succeeded, ${failedSalesCount} failed.`);

    if (successfulSales.length !== 5) {
      throw new Error(`FAIL: Expected exactly 5 successful sales, got ${successfulSales.length}.`);
    }
    if (failedSalesCount !== 5) {
      throw new Error(`FAIL: Expected exactly 5 failed sales, got ${failedSalesCount}.`);
    }

    const postSaleInv = await inventoryRepo.getInventoryByProductId(productId);
    if (!postSaleInv || postSaleInv.quantity !== 5 || postSaleInv.reserved_quantity !== 5) {
      throw new Error(`FAIL: Inventory values incorrect. Expected qty=5, res=5. Got qty=${postSaleInv?.quantity}, res=${postSaleInv?.reserved_quantity}`);
    }
    console.log("PASS: Concurrency safety in sales creation verified.");


    console.log("\n==================================================");
    console.log("TEST 4: Concurrent Delivery Challan Creation");
    console.log("==================================================");
    
    // For the 5 successful sales, create dispatches concurrently
    console.log("Firing 5 concurrent challan creations (1 quantity each, physical stock: 5)...");
    const challanPromises = successfulSales.map((sale, idx) => {
      return salesService.createChallan(
        {
          challan_number: `CH-TEST-${idx}`,
          sale_id: sale.id,
          created_by: TEST_USER_ID
        },
        [{ product_id: productId, quantity: 1 }]
      );
    });

    const challanResults = await Promise.allSettled(challanPromises);

    let successfulChallans = 0;
    challanResults.forEach((res) => {
      if (res.status === "fulfilled") {
        successfulChallans++;
      } else {
        console.error("Challan failed:", res.reason);
      }
    });

    if (successfulChallans !== 5) {
      throw new Error(`FAIL: Expected exactly 5 successful challans, got ${successfulChallans}.`);
    }

    const postChallanInv = await inventoryRepo.getInventoryByProductId(productId);
    if (!postChallanInv || postChallanInv.quantity !== 0 || postChallanInv.reserved_quantity !== 0) {
      throw new Error(`FAIL: Inventory values incorrect. Expected qty=0, res=0. Got qty=${postChallanInv?.quantity}, res=${postChallanInv?.reserved_quantity}`);
    }
    console.log("PASS: Concurrency safety in challan creation verified.");


    console.log("\n==================================================");
    console.log("TEST 5: Goods Receipt Note Cancellation & Stock Movement Signs");
    console.log("==================================================");
    
    // Create Purchase Order for 10 units
    const purchase = await procurementService.createPurchase({
      supplier_id: TEST_SUPPLIER_ID,
      created_by: TEST_USER_ID,
      status: "APPROVED",
      items: [{ product_id: productId, quantity: 10, unit_cost: 15.00 }]
    });

    // Record Goods Receipt for 10 units
    const receipt = await procurementService.createGoodsReceipt({
      purchase_id: purchase.id,
      created_by: TEST_USER_ID,
      items: [{ product_id: productId, quantity: 10 }]
    });

    // Stock should now be 10 (since it was 0)
    const grnInv = await inventoryRepo.getInventoryByProductId(productId);
    if (!grnInv || grnInv.quantity !== 10) {
      throw new Error(`FAIL: Inventory incorrect after goods receipt. Expected 10, got ${grnInv?.quantity}`);
    }
    console.log("Created Purchase Order and Goods Receipt. Stock quantity = 10.");

    // Sell 6 units (create sale + challan) to drop physical stock to 4
    const tempSale = await salesService.createSale(
      { customer_id: TEST_CUSTOMER_ID, created_by: TEST_USER_ID },
      [{ product_id: productId, quantity: 6, unit_price: 25.00 }]
    );
    await salesService.createChallan(
      { challan_number: "CH-GRN-TEMP", sale_id: tempSale.id, created_by: TEST_USER_ID },
      [{ product_id: productId, quantity: 6 }]
    );

    const postSaleQty = (await inventoryRepo.getInventoryByProductId(productId))?.quantity;
    console.log(`Sold 6 units. Current physical stock quantity = ${postSaleQty}`);

    // Try to cancel the goods receipt (needs to deduct 10 units, but only 4 exist!)
    console.log("Attempting to cancel Goods Receipt (should fail due to insufficient inventory)...");
    try {
      await procurementService.cancelGoodsReceipt(receipt.id, TEST_USER_ID);
      throw new Error("FAIL: Cancelled goods receipt note despite insufficient physical inventory.");
    } catch (err: any) {
      if (err.message.includes("Insufficient inventory")) {
        console.log("PASS: Gracefully blocked goods receipt cancellation.");
      } else {
        throw err;
      }
    }

    // Adjust physical stock back to 10 so we can test successful cancellation
    await inventoryRepo.updateInventory(productId, { quantity: 10 });
    console.log("Adjusted stock back to 10. Cancelling Goods Receipt...");
    await procurementService.cancelGoodsReceipt(receipt.id, TEST_USER_ID);

    // Verify stock is 0
    const finalInv = await inventoryRepo.getInventoryByProductId(productId);
    if (!finalInv || finalInv.quantity !== 0) {
      throw new Error(`FAIL: Stock after cancellation should be 0, got ${finalInv?.quantity}`);
    }

    // Verify stock movements
    const movements = await inventoryRepo.getStockMovements(productId);
    const cancelMovement = movements.find(m => m.reason?.includes("Goods receipt cancelled"));
    
    if (!cancelMovement) {
      throw new Error("FAIL: Could not find stock movement for GRN cancellation.");
    }
    if (cancelMovement.type !== "OUT" || cancelMovement.quantity !== -10) {
      throw new Error(`FAIL: Inconsistent stock movement. Expected type 'OUT', qty -10. Got type '${cancelMovement.type}', qty ${cancelMovement.quantity}`);
    }

    console.log("PASS: Goods receipt note cancellation, stock check, and movement signs verified.");

    console.log("\nAll integration and concurrency tests passed successfully!");
  } catch (error) {
    console.error("\nTEST SUITE FAILED:", error);
    process.exit(1);
  } finally {
    await cleanup();
    process.exit(0);
  }
}

runTests();
