import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "../ui/table";
import { SaleItem } from "@/types/sales/sales.types";
import { Product } from "@/types/product/product.types";

interface SaleItemsTableProps {
  items: SaleItem[];
  products: Product[];
}

export const SaleItemsTable = ({ items, products }: SaleItemsTableProps) => {
  // Create a product map for easy lookup
  const productMap = React.useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-secondary-text">
        This sale does not contain any items.
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell className="text-center">Quantity</TableHeaderCell>
            <TableHeaderCell className="text-right">Unit Price</TableHeaderCell>
            <TableHeaderCell className="text-right">Total</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const product = productMap[item.product_id];
            const lineTotal = item.quantity * item.unit_price;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-foreground">
                  {product ? product.name : "Unknown Product"}
                </TableCell>
                <TableCell className="font-mono text-xs text-secondary-text">
                  {product ? product.sku : "-"}
                </TableCell>
                <TableCell className="text-center text-foreground font-medium">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  ${item.unit_price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold text-foreground">
                  ${lineTotal.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
