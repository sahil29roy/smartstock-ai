import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/dialog";
import { Tabs } from "../ui/tabs";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { InventoryWithProduct, StockMovementType } from "@/types/inventory/inventory.types";
import { inventoryClient } from "@/lib/inventory.client";
import { Sliders, RefreshCw, Info } from "lucide-react";

interface InventoryAdjustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryWithProduct | null;
  onSuccess: () => void;
}

export const InventoryAdjustDialog = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}: InventoryAdjustDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("location_reservation");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1 state (Location & Reserved)
  const [location, setLocation] = useState<string>("");
  const [reservedChange, setReservedChange] = useState<string>("0");

  // Tab 2 state (Physical Movement)
  const [moveType, setMoveType] = useState<StockMovementType>("IN");
  const [moveQty, setMoveQty] = useState<string>("0");
  const [adjDirection, setAdjDirection] = useState<"ADD" | "REMOVE">("ADD");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (item) {
      setLocation(item.location || "");
      setReservedChange("0");
      setMoveType("IN");
      setMoveQty("0");
      setAdjDirection("ADD");
      setReason("");
      setError(null);
    }
  }, [item, isOpen]);

  if (!item) return null;

  const handleAdjustLocationReserved = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const parsedChange = parseInt(reservedChange, 10);
      if (isNaN(parsedChange)) {
        throw new Error("Reserved change must be a valid integer.");
      }

      // Check reservation changes client side first to give quick feedback
      if (parsedChange !== 0) {
        const newReserved = item.reserved_quantity + parsedChange;
        if (newReserved < 0) {
          throw new Error("Total reserved quantity cannot be negative.");
        }
        if (newReserved > item.quantity) {
          throw new Error(`Reserved quantity cannot exceed physical stock (${item.quantity}).`);
        }
      }

      await inventoryClient.adjustInventory(item.product_id, {
        location: location.trim() || null,
        reserved_change: parsedChange !== 0 ? parsedChange : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to adjust inventory.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhysicalMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const qtyInput = parseInt(moveQty, 10);
      if (isNaN(qtyInput) || qtyInput <= 0) {
        throw new Error("Quantity must be a positive integer greater than zero.");
      }

      // Compute final quantity based on movement type
      let finalQty = qtyInput;
      if (["OUT", "DAMAGE", "LOSS"].includes(moveType)) {
        finalQty = -qtyInput;
      } else if (moveType === "ADJUSTMENT") {
        finalQty = adjDirection === "ADD" ? qtyInput : -qtyInput;
      }

      // Client side safety check
      const newQty = item.quantity + finalQty;
      if (newQty < 0) {
        throw new Error(`Insufficient stock. Physical stock cannot drop below 0 (Attempted stock: ${newQty}).`);
      }
      if (newQty < item.reserved_quantity) {
        throw new Error(`Stock levels cannot fall below reserved quantity (${item.reserved_quantity}).`);
      }

      await inventoryClient.recordStockMovement({
        product_id: item.product_id,
        quantity: finalQty,
        type: moveType,
        reason: reason.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record stock movement.");
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    { id: "location_reservation", label: "Location & Reservations" },
    { id: "movement", label: "Record Stock Movement" },
  ];

  const renderContent = () => {
    if (activeTab === "location_reservation") {
      return (
        <form onSubmit={handleAdjustLocationReserved} className="space-y-4">
          <div className="bg-primary-very-light dark:bg-primary-light/5 border border-primary-light/20 p-3 rounded text-xs text-foreground flex items-start gap-2">
            <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Current Stock Details:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>Physical Stock: <span className="font-semibold">{item.quantity}</span></li>
                <li>Reserved Quantity: <span className="font-semibold">{item.reserved_quantity}</span></li>
                <li>Available Quantity: <span className="font-semibold">{item.quantity - item.reserved_quantity}</span></li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Storage Location
            </label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Aisle 3, Shelf B"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Reserved Stock Change
            </label>
            <Input
              type="number"
              value={reservedChange}
              onChange={(e) => setReservedChange(e.target.value)}
              placeholder="e.g. 5 to reserve, -3 to release"
            />
            <span className="text-[10px] text-secondary-text mt-1 block">
              Enter positive integer to increase reserved stock, negative integer to decrease.
            </span>
          </div>

          {error && <div className="text-xs text-danger font-semibold bg-danger/5 p-2.5 rounded border border-danger/10">{error}</div>}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handlePhysicalMovement} className="space-y-4">
        <div className="bg-primary-very-light dark:bg-primary-light/5 border border-primary-light/20 p-3 rounded text-xs text-foreground flex items-start gap-2">
          <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Current Physical Stock: {item.quantity}</p>
            <p className="mt-0.5 text-secondary-text">Movements atomically update warehouse stock levels.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Movement Type
            </label>
            <Select
              value={moveType}
              onChange={(e) => setMoveType(e.target.value as StockMovementType)}
              className="w-full"
            >
              <option value="IN">IN (Receive Stock)</option>
              <option value="OUT">OUT (Ship Stock)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Audit Correction)</option>
              <option value="DAMAGE">DAMAGE (Write-off damaged)</option>
              <option value="LOSS">LOSS (Write-off lost)</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Quantity
            </label>
            <Input
              type="number"
              value={moveQty}
              onChange={(e) => setMoveQty(e.target.value)}
              min="1"
              required
            />
          </div>
        </div>

        {moveType === "ADJUSTMENT" && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Adjustment Direction
            </label>
            <Select
              value={adjDirection}
              onChange={(e) => setAdjDirection(e.target.value as "ADD" | "REMOVE")}
              className="w-full"
            >
              <option value="ADD">Add Stock (+)</option>
              <option value="REMOVE">Remove Stock (-)</option>
            </Select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Reason / Description
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this movement is being recorded..."
            rows={3}
            maxLength={500}
          />
        </div>

        {error && <div className="text-xs text-danger font-semibold bg-danger/5 p-2.5 rounded border border-danger/10">{error}</div>}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                Posting...
              </>
            ) : (
              "Post Movement"
            )}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Inventory - ${item.product_name}`}
      size="md"
    >
      <div className="space-y-4">
        <Tabs items={tabItems} activeId={activeTab} onChange={setActiveTab} className="mb-2" />
        <div className="pt-2">{renderContent()}</div>
      </div>
    </Dialog>
  );
};
