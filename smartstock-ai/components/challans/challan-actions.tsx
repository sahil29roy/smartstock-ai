import React, { useState } from "react";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../feedback/confirm-dialog";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Challan } from "@/types/sales/sales.types";
import { UserRole } from "@/types/auth/auth.types";
import { challansClient } from "@/lib/api/challans.client";
import { useRouter } from "next/navigation";

interface ChallanActionsProps {
  challan: Challan;
  userRole?: UserRole;
  onRefresh: () => void;
}

export const ChallanActions = ({ challan, userRole, onRefresh }: ChallanActionsProps) => {
  const router = useRouter();
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const isAdmin = userRole === "ADMIN";
  const isWarehouse = userRole === "WAREHOUSE";

  const canModify = (isAdmin || isWarehouse) && challan.status !== "CANCELLED";
  const canDelete = (isAdmin || isWarehouse);

  const handleDeliverConfirm = async () => {
    try {
      setLoading(true);
      await challansClient.updateChallan(challan.id, {
        status: "DELIVERED",
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to confirm delivery.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      setLoading(true);
      await challansClient.updateChallan(challan.id, {
        status: "CANCELLED",
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to cancel challan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await challansClient.deleteChallan(challan.id);
      router.push(`/sales/${challan.sale_id}`);
    } catch (err: any) {
      alert(err.message || "Failed to delete challan.");
    } finally {
      setLoading(false);
    }
  };

  if (!canModify && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {canModify && challan.status !== "DELIVERED" && (
        <Button
          onClick={() => setIsDeliverOpen(true)}
          className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-white"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark Delivered
        </Button>
      )}

      {canModify && (
        <Button
          variant="destructive"
          onClick={() => setIsCancelOpen(true)}
          className="flex items-center gap-1.5"
        >
          <XCircle className="h-4 w-4" />
          Cancel Challan
        </Button>
      )}

      {canDelete && (
        <Button
          variant="destructive"
          onClick={() => setIsDeleteOpen(true)}
          className="flex items-center gap-1.5 border border-danger bg-transparent text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete Challan
        </Button>
      )}

      {/* Confirm Delivery Dialog */}
      <ConfirmDialog
        isOpen={isDeliverOpen}
        onClose={() => setIsDeliverOpen(false)}
        onConfirm={handleDeliverConfirm}
        title="Confirm Shipment Delivery"
        message="Are you sure you want to mark this challan as delivered? This confirms that the shipment has successfully reached the customer."
        confirmLabel={loading ? "Updating..." : "Deliver"}
      />

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Delivery Challan"
        message="Canceling this challan will reverse the stock dispatch and restore the corresponding inventory quantities. Are you sure you want to cancel?"
        confirmLabel={loading ? "Canceling..." : "Cancel Challan"}
        variant="destructive"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Challan"
        message="Deleting this challan will permanently remove it from the system and restore the corresponding inventory quantities back to physical stock. Are you sure you want to delete?"
        confirmLabel={loading ? "Deleting..." : "Delete Permanently"}
        variant="destructive"
      />
    </div>
  );
};
