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
import { ChallanItem } from "@/types/sales/sales.types";
import { Product } from "@/types/product/product.types";

interface ChallanItemsTableProps {
  items: ChallanItem[];
  products: Product[];
}

export const ChallanItemsTable = ({ items, products }: ChallanItemsTableProps) => {
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
        This challan does not contain any items.
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
            <TableHeaderCell className="text-center">Shipped Quantity</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const product = productMap[item.product_id];

            return (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-foreground">
                  {product ? product.name : "Unknown Product"}
                </TableCell>
                <TableCell className="font-mono text-xs text-secondary-text">
                  {product ? product.sku : "-"}
                </TableCell>
                <TableCell className="text-center text-foreground font-semibold">
                  {item.quantity}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
