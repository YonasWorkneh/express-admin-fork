"use client";

import { useState } from "react";
import type { FleetVehicleTypeListItem } from "@/lib/api/fleet";
import { Truck, Car, Bus, Bike, ImageOff } from "lucide-react";
import { MdElectricScooter } from "react-icons/md";
import { FaMotorcycle } from "react-icons/fa";

/**
 * API `iconUrl` is the primary image src when present.
 * Otherwise falls back to normalized `imageUrl` or legacy `icon` string.
 */
export function vehicleTypeImageSrc(
  vt: FleetVehicleTypeListItem,
): string | undefined {
  if (typeof vt.iconUrl === "string" && vt.iconUrl.trim()) {
    return vt.iconUrl.trim();
  }
  if (typeof vt.imageUrl === "string" && vt.imageUrl.trim()) {
    return vt.imageUrl.trim();
  }
  const raw = vt.icon;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return undefined;
}

export function VehicleTypeIconByName({ name }: { name: string }) {
  const norm = name.toLowerCase().replace(/[\s_-]+/g, "");
  const className = "h-12 w-12 shrink-0 text-gray-700";
  if (norm.includes("truck")) {
    return <Truck className={className} strokeWidth={1.5} aria-hidden />;
  }
  if (
    norm.includes("automobile") ||
    norm === "car" ||
    norm.includes("sedan")
  ) {
    return <Car className={className} strokeWidth={1.5} aria-hidden />;
  }
  if (
    norm.includes("minivan") ||
    (norm.includes("mini") && norm.includes("van")) ||
    norm === "van"
  ) {
    return <Bus className={className} strokeWidth={1.5} aria-hidden />;
  }
  if (norm.includes("scooter")) {
    return <MdElectricScooter className={className} aria-hidden />;
  }
  if (norm.includes("motorcycle") || norm.includes("motorbike")) {
    return <FaMotorcycle className={className} aria-hidden />;
  }
  if (norm.includes("bicycle") || norm === "bike") {
    return <Bike className={className} strokeWidth={1.5} aria-hidden />;
  }
  return (
    <ImageOff
      className={`${className} text-gray-400`}
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

const defaultImgClass =
  "max-h-14 max-w-14 object-contain rounded-md border border-gray-200";

/**
 * Renders API `iconUrl` as &lt;img&gt; when set; otherwise legacy URL or name-based icons.
 * If `iconUrl` fails to load, shows a neutral placeholder (not mapped vehicle icons).
 */
export function VehicleTypeThumbnail({
  vt,
  imgClassName = defaultImgClass,
  wrapperClassName = "flex h-14 w-14 items-center justify-center",
}: {
  vt: FleetVehicleTypeListItem;
  imgClassName?: string;
  wrapperClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const apiIconUrl =
    typeof vt.iconUrl === "string" && vt.iconUrl.trim()
      ? vt.iconUrl.trim()
      : null;

  if (apiIconUrl) {
    if (!failed) {
      return (
        <div className={wrapperClassName}>
          <img
            src={apiIconUrl}
            alt=""
            className={imgClassName}
            onError={() => setFailed(true)}
          />
        </div>
      );
    }
    return (
      <div className={wrapperClassName}>
        <ImageOff
          className="h-10 w-10 text-gray-400 shrink-0"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    );
  }

  const src = vehicleTypeImageSrc(vt);
  if (src && !failed) {
    return (
      <div className={wrapperClassName}>
        <img
          src={src}
          alt=""
          className={imgClassName}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <VehicleTypeIconByName name={vt.name} />
    </div>
  );
}
