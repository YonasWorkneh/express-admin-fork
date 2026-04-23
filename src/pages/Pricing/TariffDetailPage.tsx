"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoArrowBack, IoPricetags } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/utils/spinner";
import { fetchTariffById } from "@/lib/api/pricingTariff";
import TownPricingForm from "@/features/pricing/components/TownPricingForm";
import ZonalTariffPricingForm from "@/features/pricing/components/ZonalTariffPricingForm";

/** When API omits `shippingScope` / `scope`, infer from payload shape. */
function inferZonalKindFromName(name: unknown): "REGIONAL" | "INTERNATIONAL" {
  const n = typeof name === "string" ? name.toLowerCase() : "";
  if (n.includes("international")) return "INTERNATIONAL";
  return "REGIONAL";
}

function normalizeScope(
  row: Record<string, unknown>,
): "TOWN" | "REGIONAL" | "INTERNATIONAL" | null {
  const raw = row.shippingScope ?? row.scope;
  if (typeof raw === "string") {
    const u = raw.toUpperCase();
    if (u === "TOWN" || u === "REGIONAL" || u === "INTERNATIONAL") return u;
  }
  if (row.townConfig != null && typeof row.townConfig === "object") {
    return "TOWN";
  }
  if (
    row.townPricing != null &&
    typeof row.townPricing === "object" &&
    !Array.isArray(row.townPricing)
  ) {
    return "TOWN";
  }
  if (Array.isArray(row.categoryPricing) && row.categoryPricing.length > 0) {
    return inferZonalKindFromName(row.name);
  }
  return null;
}

function displayServiceType(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidate = obj.name ?? obj.label ?? obj.title;
    if (typeof candidate === "string" || typeof candidate === "number") {
      const text = String(candidate).trim();
      return text || "Unknown service type";
    }
  }
  return "Unknown service type";
}

function displayCategory(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidate = obj.name ?? obj.label ?? obj.title;
    if (typeof candidate === "string" || typeof candidate === "number") {
      const text = String(candidate).trim();
      return text || "Uncategorized";
    }
  }
  return "Uncategorized";
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  try {
    return JSON.stringify(v);
  } catch {
    return "—";
  }
}

export default function TariffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tariff, setTariff] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id?.trim()) {
        setFetchError("Missing tariff id");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchTariffById(id.replace(/^#/, ""));
        if (!cancelled) setTariff(data);
      } catch (e: unknown) {
        const msg =
          e &&
          typeof e === "object" &&
          "response" in e &&
          (e as { response?: { data?: { message?: string } } }).response?.data
            ?.message;
        if (!cancelled) {
          setFetchError(
            typeof msg === "string" && msg.trim()
              ? msg
              : "Could not load tariff",
          );
          setTariff(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const scope = useMemo(
    () => (tariff ? normalizeScope(tariff) : null),
    [tariff],
  );

  const townServiceRows = useMemo(() => {
    if (!tariff || scope !== "TOWN") return [];
    const tp = tariff.townPricing;
    if (tp && typeof tp === "object" && !Array.isArray(tp)) {
      const tpr = tp as Record<string, unknown>;
      const sid = tariff.serviceTypeId;
      return [
        {
          serviceTypeId: typeof sid === "string" ? sid : undefined,
          baseFee: tpr.baseFee,
          profitPerc: tpr.profitPct ?? tpr.profitMargin,
        },
      ];
    }
    const tc = tariff.townConfig;
    if (tc && typeof tc === "object" && !Array.isArray(tc)) {
      const inner = (tc as Record<string, unknown>).serviceTypes;
      if (Array.isArray(inner)) return inner as Record<string, unknown>[];
    }
    const st = tariff.serviceTypes;
    if (!Array.isArray(st)) return [];
    return st as Record<string, unknown>[];
  }, [tariff, scope]);

  const zonalRows = useMemo(() => {
    if (!tariff || scope === "TOWN") return [];
    if (!Array.isArray(tariff.categoryPricing)) return [];
    return tariff.categoryPricing as Record<string, unknown>[];
  }, [tariff, scope]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 p-6 bg-white">
        <Spinner className="h-10 w-10 text-blue-600" />
        <p className="text-gray-600">Loading tariff…</p>
      </div>
    );
  }

  if (fetchError || !tariff) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white">
        <Button
          type="button"
          variant="outline"
          className="mb-4 cursor-pointer"
          onClick={() => navigate("/pricing")}
        >
          Back to pricing
        </Button>
        <p className="text-red-600">{fetchError ?? "Tariff not found."}</p>
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white">
        <Button
          type="button"
          variant="outline"
          className="mb-4"
          onClick={() => navigate("/pricing")}
        >
          Back to pricing
        </Button>
        <p className="text-amber-800">
          This tariff has no recognized type (no{" "}
          <code className="text-xs">shippingScope</code> /{" "}
          <code className="text-xs">scope</code>,{" "}
          <code className="text-xs">townConfig</code>,{" "}
          <code className="text-xs">townPricing</code>, or{" "}
          <code className="text-xs">categoryPricing</code>). Check the backend
          payload or open edit if a form still applies.
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-6xl mx-auto min-h-screen bg-white">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setEditing(false)}
            >
              Cancel edit
            </Button>
            <p className="text-sm text-gray-600 truncate">
              Editing tariff{" "}
              <span className="font-medium text-gray-900">
                {formatCell(tariff.name)}
              </span>
            </p>
          </div>
        </div>
        <div className="p-6 pt-4">
          {scope === "TOWN" ? (
            <TownPricingForm
              key={String(tariff.id ?? id)}
              prefetchedTariff={tariff}
              enableTariffListProbe={false}
            />
          ) : scope === "REGIONAL" ? (
            <ZonalTariffPricingForm
              key={String(tariff.id ?? id)}
              shippingScope="REGIONAL"
              tariffDisplayName="Regional Delivery Tariff"
              headerTitle={{
                create: "Regional Pricing Configuration",
                edit: "Edit Regional Pricing Configuration",
              }}
              prefetchedTariff={tariff}
              enableTariffListProbe={false}
            />
          ) : (
            <ZonalTariffPricingForm
              key={String(tariff.id ?? id)}
              shippingScope="INTERNATIONAL"
              tariffDisplayName="International Delivery Tariff"
              headerTitle={{
                create: "International Pricing Configuration",
                edit: "Edit International Pricing Configuration",
              }}
              prefetchedTariff={tariff}
              enableTariffListProbe={false}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            type="button"
            className="!text-white !size-[40px] bg-blue-500 hover:bg-blue-400 !rounded-full !p-0 shrink-0 cursor-pointer"
            onClick={() => navigate("/pricing")}
          >
            <IoArrowBack className="text-white text-xl" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <IoPricetags className="text-blue-500 text-2xl shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-medium text-gray-800 truncate">
                Tariff details
              </h1>
              <p className="text-sm text-gray-500 truncate">
                {formatCell(tariff.name)}
              </p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shrink-0"
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Type</Label>
                <p className="font-medium text-blue-600 mt-1">{scope}</p>
                {(tariff.shippingScope ?? tariff.scope) != null ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    API: {formatCell(tariff.shippingScope ?? tariff.scope)}
                  </p>
                ) : null}
              </div>
              <div>
                <Label className="text-gray-600">Mode</Label>
                <p className="font-medium mt-1">{formatCell(tariff.mode)}</p>
              </div>
              <div>
                <Label className="text-gray-600">Currency</Label>
                <p className="font-medium text-green-700 mt-1">
                  {formatCell(tariff.currency)}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Remark</Label>
                <p className="font-medium mt-1">{formatCell(tariff.remark)}</p>
              </div>
              <div>
                <Label className="text-gray-600">Status</Label>
                <div className="mt-1">
                  {tariff.isActive === true ? (
                    <Badge className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Created</Label>
                <p className="font-medium mt-1">
                  {tariff.createdAt
                    ? new Date(String(tariff.createdAt)).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Updated</Label>
                <p className="font-medium mt-1">
                  {tariff.updatedAt
                    ? new Date(String(tariff.updatedAt)).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {scope === "TOWN" && townServiceRows.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {townServiceRows.map((row, i) => (
                <div
                  key={i}
                  className="flex flex-wrap gap-x-6 gap-y-1 py-2 border-b border-gray-100 last:border-0 text-sm"
                >
                  <span className="font-medium">
                    {displayServiceType(row.serviceType ?? row.serviceTypeName)}
                  </span>
                  <span className="text-gray-600">
                    Base: {formatCell(row.baseFee ?? row.basePrice)}
                  </span>
                  <span className="text-gray-600">
                    Margin:{" "}
                    {formatCell(
                      row.profitMargin ?? row.profitPerc ?? row.profit,
                    )}
                    %
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {scope !== "TOWN" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-3">
              <p>
                <span className="text-gray-600">Category pricing entries: </span>
                <span className="font-medium">
                  {zonalRows.length}
                </span>
              </p>
              {zonalRows.length > 0 ? (
                <div className="space-y-2">
                  {zonalRows.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap gap-x-6 gap-y-1 py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium">
                        {displayCategory(
                          row.category ?? row.categoryName ?? row.categoryType,
                        )}
                      </span>
                      <span className="text-gray-600">
                        Service:{" "}
                        {displayServiceType(
                          row.serviceType ?? row.serviceTypeName,
                        )}
                      </span>
                      <span className="text-gray-600">
                        Margin:{" "}
                        {formatCell(
                          row.profitPerc ?? row.profitMargin ?? row.profitPct,
                        )}
                        %
                      </span>
                      <span className="text-gray-600">
                        Airport: {formatCell(row.airportFeePerKg)} / kg
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No category pricing entries found.</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
