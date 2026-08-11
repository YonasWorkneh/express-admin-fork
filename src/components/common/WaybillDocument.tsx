"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { IoCall, IoLocationSharp } from "react-icons/io5";
import {
  COMPANY_ADDRESS,
  COMPANY_LOGO_SRC,
  COMPANY_NAME,
  COMPANY_PHONE,
} from "@/constants/company";

export interface WaybillParty {
  name: string;
  phone: string;
  /** Company/address line — omitted from the printout when unknown */
  companyLine?: string;
}

export interface WaybillGoods {
  categoryName: string;
  quantity: number;
}

export interface WaybillData {
  trackingCode: string;
  shipper: WaybillParty;
  consignee: WaybillParty;
  weightKg?: number;
  dimensions?: { length: number; width: number; height: number };
  goods?: WaybillGoods;
  amount?: number;
  currency?: string;
  paymentMethodLabel?: string;
  serviceTypeName?: string;
  receivedBy?: string;
  createdAt: Date;
}

function Cell({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900 break-words">
        {value != null && value !== "" ? value : " "}
      </p>
    </div>
  );
}

export default function WaybillDocument({ data }: { data: WaybillData }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  useEffect(() => {
    if (!data.trackingCode) {
      setQrCodeDataUrl("");
      return;
    }
    QRCode.toDataURL(data.trackingCode, {
      width: 160,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setQrCodeDataUrl)
      .catch(() => setQrCodeDataUrl(""));
  }, [data.trackingCode]);

  const createdAtLabel = data.createdAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const createdAtTimeLabel = data.createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const volume = data.dimensions
    ? data.dimensions.length * data.dimensions.width * data.dimensions.height
    : undefined;

  const amountLabel =
    data.amount != null
      ? `${data.amount.toLocaleString()}${data.currency ? ` ${data.currency}` : ""}`
      : undefined;

  return (
    <div className="waybill-print border border-gray-200 rounded-lg overflow-hidden bg-white text-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FADF4B] to-[#f2c94c] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={COMPANY_LOGO_SRC} alt={COMPANY_NAME} className="h-10 w-auto" />
        </div>
        <div className="text-right text-[#8a1a1c]">
          <p className="flex items-center justify-end gap-1 font-semibold text-xs sm:text-sm">
            <IoCall className="shrink-0" /> {COMPANY_PHONE}
          </p>
          <p className="flex items-center justify-end gap-1 text-xs mt-1 max-w-md">
            <IoLocationSharp className="shrink-0" /> {COMPANY_ADDRESS}
          </p>
        </div>
      </div>
      <div className="h-1 bg-[#EE1E21]" />

      {/* Waybill number */}
      <div className="border-b border-gray-200 px-6 py-2 text-center font-semibold text-gray-800">
        WayBill / Tracking No: {data.trackingCode}
      </div>

      {/* Shipper / Consignee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
        <div>
          <p className="bg-gray-50 px-4 py-1.5 font-semibold text-gray-800 border-b border-gray-200">
            Shipper Details
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
            <Cell label="Name of Sender" value={data.shipper.name} />
            <Cell label="Phone" value={data.shipper.phone} />
            {data.shipper.companyLine && (
              <Cell
                className="col-span-2"
                label="Company Name and Address"
                value={data.shipper.companyLine}
              />
            )}
          </div>
        </div>
        <div>
          <p className="bg-gray-50 px-4 py-1.5 font-semibold text-gray-800 border-b border-gray-200">
            Consignee Details
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
            <Cell label="Contact Person" value={data.consignee.name} />
            <Cell label="Phone" value={data.consignee.phone} />
            {data.consignee.companyLine && (
              <Cell
                className="col-span-2"
                label="Company Name and Address"
                value={data.consignee.companyLine}
              />
            )}
          </div>
        </div>
      </div>

      {/* Received by / date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
          <Cell label="Received for Yes Express by" value={data.receivedBy} />
          <Cell label="Date and Time" value={`${createdAtLabel} : ${createdAtTimeLabel}`} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
          <Cell label="Service Type" value={data.serviceTypeName} />
          <Cell label="Payment Method" value={data.paymentMethodLabel} />
        </div>
      </div>

      {/* Shipment details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200">
        <div className="p-4 space-y-3">
          <Cell
            label="Actual Weight of Shipment"
            value={data.weightKg != null ? `${data.weightKg} kg` : undefined}
          />
          {data.dimensions && (
            <div>
              <p className="text-[11px] text-gray-500 mb-1">
                Dimensional Weight of Shipment
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-700">
                <span>L: {data.dimensions.length}</span>
                <span>W: {data.dimensions.width}</span>
                <span>H: {data.dimensions.height}</span>
                <span>Vol: {volume}</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <Cell
            label="Description of Goods"
            value={
              data.goods
                ? `${data.goods.quantity} ${data.goods.categoryName}`
                : undefined
            }
          />
          <Cell label="Amount Received" value={amountLabel} />
        </div>
      </div>

      {/* Signatures + QR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-gray-200">
        <div className="sm:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-gray-500">Shipper's Signature</p>
            <div className="h-10 border-b border-dashed border-gray-300" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Receiver's Signature</p>
            <div className="h-10 border-b border-dashed border-gray-300" />
          </div>
        </div>
        {qrCodeDataUrl && (
          <div className="flex justify-center sm:justify-end">
            <img src={qrCodeDataUrl} alt="QR Code" className="h-20 w-20" />
          </div>
        )}
      </div>

      {/* Footer checkboxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200">
        {["For Payee", "For Finance", "For Consignee", "For Branch Office"].map(
          (label) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-3 text-xs text-gray-700"
            >
              <span className="inline-block h-3.5 w-3.5 border border-gray-400" />
              {label}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
