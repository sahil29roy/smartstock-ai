import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { Challan } from "@/types/sales/sales.types";
export {
  withTransaction,
  getChallanById,
  getChallanByNumber,
  createChallan,
  updateChallan,
  getChallans,
  createChallanItem,
  getChallanItems
} from "../sales/sales.repository";

export async function deleteChallan(id: string, client?: PoolClient): Promise<boolean> {
  const sql = "DELETE FROM challans WHERE id = $1";
  const executor = client || pool;
  const result = await executor.query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getChallanByIdForUpdate(id: string, client: PoolClient): Promise<Challan | null> {
  const sql = `
    SELECT id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by, created_at, updated_at
    FROM challans
    WHERE id = $1
    FOR UPDATE
  `;
  const result = await client.query(sql, [id]);
  return result.rows[0] || null;
}

export async function deleteChallanItems(challanId: string, client?: PoolClient): Promise<number> {
  const sql = "DELETE FROM challan_items WHERE challan_id = $1";
  const executor = client || pool;
  const result = await executor.query(sql, [challanId]);
  return result.rowCount ?? 0;
}
