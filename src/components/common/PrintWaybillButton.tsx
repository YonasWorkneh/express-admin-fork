"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { printOrderWaybill } from "@/lib/api/orders";
import toast from "react-hot-toast";
import { MdPrint } from "react-icons/md";
import { cn } from "@/lib/utils";

interface PrintWaybillButtonProps {
  orderId: string;
  /** Compact icon-only trigger for table row actions. */
  iconOnly?: boolean;
  className?: string;
}

export default function PrintWaybillButton({
  orderId,
  iconOnly = false,
  className,
}: PrintWaybillButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [withPromotion, setWithPromotion] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printOrderWaybill(orderId, withPromotion);
      toast.success("Waybill sent to printer.");
      setIsConfirmOpen(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to print waybill.",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          iconOnly
            ? "p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
            : "cursor-pointer",
          className,
        )}
        onClick={(e) => {
          e.stopPropagation();
          setWithPromotion(false);
          setIsConfirmOpen(true);
        }}
        aria-label="Print waybill"
      >
        {iconOnly ? (
          <MdPrint className="h-4 w-4" />
        ) : (
          <span className="flex items-center gap-2">
            <MdPrint className="h-4 w-4" />
            Print Waybill
          </span>
        )}
      </Button>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => !isPrinting && setIsConfirmOpen(false)}
        onConfirm={handlePrint}
        title="Print Waybill"
        description=""
        confirmText="Print"
        variant="info"
        isLoading={isPrinting}
      >
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={withPromotion}
            onCheckedChange={(checked) => setWithPromotion(checked === true)}
            disabled={isPrinting}
          />
          <span className="font-medium text-gray-800">
            Include promotion at the back
          </span>
        </label>
      </ConfirmationModal>
    </>
  );
}
