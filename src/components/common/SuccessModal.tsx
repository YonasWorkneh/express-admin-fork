"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IoCheckmarkCircle, IoClose, IoCopy, IoQrCode } from "react-icons/io5";
import QRCode from "qrcode";
import WaybillDocument, { type WaybillData } from "./WaybillDocument";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  title?: string;
  description?: string;
  trackingLabel?: string;
  qrCodeLabel?: string;
  /** When provided, renders a printable waybill instead of the plain tracking/QR card */
  waybill?: WaybillData;
}

export default function SuccessModal({
  isOpen,
  onClose,
  trackingNumber,
  title = "Order Submitted Successfully!",
  description = "Your order has been processed and is ready for pickup.",
  trackingLabel = "Tracking Number",
  qrCodeLabel = "Scan this QR code to track your order",
  waybill,
}: SuccessModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrCodeError, setQrCodeError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (waybill) return;
    if (isOpen && trackingNumber && trackingNumber.trim()) {
      // Reset error state
      setQrCodeError(false);
      setQrCodeDataUrl("");
      
      // Generate QR code for the tracking number
      QRCode.toDataURL(trackingNumber.trim(), {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          setQrCodeDataUrl(url);
          setQrCodeError(false);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
          setQrCodeError(true);
          setQrCodeDataUrl("");
        });
    } else {
      // Reset if no tracking number
      setQrCodeDataUrl("");
      setQrCodeError(false);
    }
  }, [isOpen, trackingNumber]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle focus trap so user can reach modal buttons with Tab/Shift+Tab
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableSelectors =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const modal = modalRef.current;
      // @ts-ignore
      const focusables: HTMLElement[] = Array.from(
        modal.querySelectorAll(focusableSelectors)
      );
      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      const trapFocus = (event: KeyboardEvent) => {
        if (event.key === "Tab") {
          if (focusables.length === 0) return;
          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
              event.preventDefault();
              lastFocusable.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastFocusable) {
              event.preventDefault();
              firstFocusable.focus();
            }
          }
        }
        if (event.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", trapFocus);
      // Focus the close button first
      firstFocusable?.focus();

      return () => {
        document.removeEventListener("keydown", trapFocus);
      };
    }
  }, [isOpen, onClose]);

  const handleCopyTrackingNumber = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy tracking number:", err);
    }
  };

  if (!isOpen) return null;

  // close modal when clicking outside (on backdrop)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      style={{ backdropFilter: "blur(2px)" }}
      onMouseDown={handleBackdropClick}
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className={`w-full ${waybill ? "max-w-2xl" : "max-w-md"} bg-white shadow-xl rounded-lg mx-auto my-8 outline-none max-h-[calc(100vh-2rem)] flex flex-col`}
        style={{ minHeight: 0, maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
        onMouseDown={e => e.stopPropagation()}
      >
        <Card className="flex-1 flex flex-col h-full shadow-none bg-transparent border-none">
          <CardHeader className="text-center pb-4 flex-shrink-0">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 focus:outline-none focus:ring-2 focus:ring-[#EE1E21]"
                tabIndex={0}
                aria-label="Close"
              >
                <IoClose className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <IoCheckmarkCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {title}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {description}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 flex-1 flex flex-col">
            {waybill ? (
              <div className="flex items-center justify-between gap-2 -mt-2">
                <span className="text-xs text-gray-500">{trackingLabel}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTrackingNumber}
                  className="flex items-center gap-2"
                  tabIndex={0}
                  aria-label="Copy tracking number"
                >
                  <IoCopy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            ) : null}

            {waybill ? (
              <WaybillDocument data={waybill} />
            ) : (
              <>
                {/* Tracking Number */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{trackingLabel}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyTrackingNumber}
                      className="flex items-center gap-2"
                      tabIndex={0}
                      aria-label="Copy tracking number"
                    >
                      <IoCopy className="h-4 w-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="bg-white p-3 rounded border font-mono text-lg font-bold text-center text-[#EE1E21]">
                    {trackingNumber}
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-center gap-2">
                    <IoQrCode className="h-5 w-5" />
                    QR Code
                  </h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 inline-block">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    ) : qrCodeError ? (
                      <div className="w-48 h-48 bg-gray-100 rounded flex flex-col items-center justify-center">
                        <IoQrCode className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 text-center px-2">
                          Failed to generate QR code
                        </p>
                      </div>
                    ) : trackingNumber ? (
                      <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EE1E21]"></div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-xs text-gray-500">No tracking number</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {qrCodeLabel}
                  </p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto">
              <Button
                onClick={onClose}
                className="flex-1 bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] focus:outline-none focus:ring-2 focus:ring-[#EE1E21]"
                tabIndex={0}
                aria-label="Close modal"
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="flex-1"
                tabIndex={0}
                aria-label="Print details"
              >
                Print Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
