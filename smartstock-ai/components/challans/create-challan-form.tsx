import React, { useState, useMemo } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "../ui/table";
import { Sale, SaleItem, Challan, ChallanItem } from "@/types/sales/sales.types";
import { Product } from "@/types/product/product.types";

interface CreateChallanFormProps {
  sale: Sale & { items: SaleItem[] };
  challans: (Challan & { items?: ChallanItem[] })[];
  products: Product[];
  inventoryMap: Record<string, { quantity: number; reserved: number }>;
  onSubmit: (payload: {
    challan_number: string;
    sale_id: string;
    dispatch_date?: string;
    carrier_details?: string;
    items: { product_id: string; quantity: number }[];
  }) => Promise<void>;
  onClose: () => void;
}

export const CreateChallanForm = ({
  sale,
  challans,
  products,
  inventoryMap,
  onSubmit,
  onClose,
}: CreateChallanFormProps) => {
  const [challanNumber, setChallanNumber] = useState("");
  const [carrierDetails, setCarrierDetails] = useState("");
  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Map products
  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  // Calculate dispatched quantities for each product in the sale
  const dispatchedMap = useMemo(() => {
    const map: Record<string, number> = {};
    sale.items.forEach((item) => {
      map[item.product_id] = 0;
    });

    challans
      .filter((c) => c.status !== "CANCELLED")
      .forEach((c) => {
        if (c.items) {
          c.items.forEach((ci) => {
            if (map[ci.product_id] !== undefined) {
              map[ci.product_id] += ci.quantity;
            }
          });
        }
      });

    return map;
  }, [sale, challans]);

  // Initial state for items: dispatch quantity defaults to remaining quantity
  const [dispatchItems, setDispatchItems] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sale.items.forEach((item) => {
      const alreadyDispatched = dispatchedMap[item.product_id] || 0;
      const remaining = Math.max(0, item.quantity - alreadyDispatched);
      initial[item.product_id] = remaining;
    });
    return initial;
  });

  const handleQtyChange = (productId: string, val: number) => {
    setDispatchItems((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!challanNumber.trim()) {
      setFormError("Delivery Challan Number is required.");
      return;
    }

    const itemsToSend: { product_id: string; quantity: number }[] = [];

    for (const item of sale.items) {
      const qty = dispatchItems[item.product_id] || 0;
      if (qty > 0) {
        const alreadyDispatched = dispatchedMap[item.product_id] || 0;
        const remaining = item.quantity - alreadyDispatched;
        if (qty > remaining) {
          setFormError(
            `Quantity for ${productMap[item.product_id]?.name || "Product"} exceeds remaining ordered quantity (${remaining}).`
          );
          return;
        }

        const stock = inventoryMap[item.product_id];
        const availableStock = stock ? stock.quantity - stock.reserved : 0;
        // In dispatching, physical inventory is deducted. We warn/prevent dispatching more than physical warehouse quantity.
        const physicalStock = stock ? stock.quantity : 0;
        if (qty > physicalStock) {
          setFormError(
            `Quantity for ${productMap[item.product_id]?.name || "Product"} exceeds physical warehouse stock (${physicalStock}).`
          );
          return;
        }

        itemsToSend.push({
          product_id: item.product_id,
          quantity: qty,
        });
      }
    }

    if (itemsToSend.length === 0) {
      setFormError("Please select at least one item and quantity to dispatch.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        challan_number: challanNumber,
        sale_id: sale.id,
        dispatch_date: dispatchDate,
        carrier_details: carrierDetails,
        items: itemsToSend,
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to create delivery challan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 bg-danger/10 text-danger border border-danger/20 rounded-lg text-xs font-semibold">
          {formError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            Challan Number *
          </label>
          <Input
            value={challanNumber}
            onChange={(e) => setChallanNumber(e.target.value)}
            placeholder="e.g. DC-10002"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            Dispatch Date
          </label>
          <Input
            type="date"
            value={dispatchDate}
            onChange={(e) => setDispatchDate(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            Carrier / Vehicle Details
          </label>
          <Input
            value={carrierDetails}
            onChange={(e) => setCarrierDetails(e.target.value)}
            placeholder="e.g. DHL Express, Truck AP-02"
            className="w-full"
          />
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow hoverable={false}>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell className="text-center">Ordered</TableHeaderCell>
                <TableHeaderCell className="text-center">Already Shipped</TableHeaderCell>
                <TableHeaderCell className="text-center">Remaining</TableHeaderCell>
                <TableHeaderCell className="text-center">Physical Stock</TableHeaderCell>
                <TableHeaderCell className="text-center w-24">Ship Qty</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item) => {
                const prod = productMap[item.product_id];
                const shipped = dispatchedMap[item.product_id] || 0;
                const remaining = Math.max(0, item.quantity - shipped);
                const stock = inventoryMap[item.product_id];
                const physicalQty = stock ? stock.quantity : 0;
                const shipVal = dispatchItems[item.product_id] || 0;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-foreground">
                      {prod ? prod.name : "Unknown"}
                      {prod && <div className="text-[10px] text-secondary-text font-mono mt-0.5">{prod.sku}</div>}
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">{item.quantity}</TableCell>
                    <TableCell className="text-center text-secondary-text">{shipped}</TableCell>
                    <TableCell className="text-center font-medium text-foreground">{remaining}</TableCell>
                    <TableCell className="text-center text-secondary-text">{physicalQty}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0"
                        max={Math.min(remaining, physicalQty)}
                        value={shipVal || ""}
                        onChange={(e) => handleQtyChange(item.product_id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="text-center p-1 h-8 font-semibold w-16"
                        disabled={remaining === 0 || physicalQty === 0}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Dispatching..." : "Create Challan"}
        </Button>
      </div>
    </form>
  );
};
