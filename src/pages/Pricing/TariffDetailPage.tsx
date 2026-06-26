"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoArrowBack, IoPricetags } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/** Infer scope from tariff name when API omits shippingScope (e.g. "Town Delivery Tariff - …"). */
function inferScopeFromName(
  name: unknown,
): "TOWN" | "REGIONAL" | "INTERNATIONAL" | null {
  const n = typeof name === "string" ? name.toLowerCase() : "";
  if (!n.trim()) return null;
  if (n.includes("international")) return "INTERNATIONAL";
  if (n.includes("town delivery") || n.includes("town tariff")) return "TOWN";
  if (n.includes("regional")) return "REGIONAL";
  return null;
}

function normalizeScope(
  row: Record<string, unknown>,
): "TOWN" | "REGIONAL" | "INTERNATIONAL" | null {
  const raw = row.shippingScope ?? row.scope;
  if (typeof raw === "string") {
    const u = raw.toUpperCase();
    if (u === "TOWN" || u === "REGIONAL" || u === "INTERNATIONAL") return u;
  }

  const fromName = inferScopeFromName(row.name);
  if (fromName) return fromName;

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

function getRowConfig(
  row: Record<string, unknown>,
): Record<string, unknown> | null {
  const c = row.config;
  if (c != null && typeof c === "object" && !Array.isArray(c)) {
    return c as Record<string, unknown>;
  }
  return null;
}

function serviceTypeLabelForRow(
  tariff: Record<string, unknown>,
  row: Record<string, unknown>,
): string {
  if (row.serviceType != null) {
    return displayServiceType(row.serviceType);
  }
  const rowSid = row.serviceTypeId;
  const tSid = tariff.serviceTypeId;
  if (
    typeof rowSid === "string" &&
    typeof tSid === "string" &&
    rowSid === tSid &&
    tariff.serviceType != null
  ) {
    return displayServiceType(tariff.serviceType);
  }
  return "—";
}

function categoryLabelForRow(row: Record<string, unknown>): string {
  if (row.category != null) return displayCategory(row.category);
  if (typeof row.categoryId === "string" && row.categoryId.trim()) {
    return "Pricing category";
  }
  return "Uncategorized";
}

/** Human-readable bullets from nested `config` + pricing `type` (margin/cost shown in card header). */
function configSummaryLines(type: unknown, config: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const t = typeof type === "string" ? type : "";

  const marginsForUnknown = (): void => {
    if ("profitMargin" in config && typeof config.profitMargin === "number") {
      lines.push(`Profit margin: ${config.profitMargin}`);
    }
    if ("additionalCost" in config && typeof config.additionalCost === "number") {
      lines.push(`Additional cost: ${config.additionalCost}`);
    }
  };

  switch (t) {
    case "UNIT_PRICE": {
      if (typeof config.unitPrice === "number") {
        lines.push(`Unit price: ${formatCell(config.unitPrice)}`);
      }
      break;
    }
    case "WEIGHT_RANGE": {
      break;
    }
    case "UNIT_PRICE_WEIGHT_RANGE": {
      if (typeof config.unitPrice === "number") {
        lines.push(`Unit price: ${formatCell(config.unitPrice)}`);
      }
      const brackets = config.brackets;
      if (Array.isArray(brackets) && brackets.length > 0) {
        lines.push(`${brackets.length} weight bracket(s)`);
      }
      break;
    }
    case "VOLUME_OVERRIDE": {
      if (typeof config.divisor === "number") {
        lines.push(`Divisor: ${formatCell(config.divisor)}`);
      }
      if (typeof config.ratePerKg === "number") {
        lines.push(`Rate / kg: ${formatCell(config.ratePerKg)}`);
      }
      break;
    }
    default: {
      marginsForUnknown();
      if (lines.length === 0) {
        lines.push(formatCell(config));
      }
    }
  }
  return lines;
}

function formatProfitMarginDisplay(m: unknown): string {
  if (m == null || m === "") return "—";
  const n = Number(m);
  if (!Number.isFinite(n)) return formatCell(m);
  if (n >= 0 && n <= 1) return `${n} (${(n * 100).toFixed(1)}%)`;
  return String(n);
}

/** Parsed weight band rows for WEIGHT_RANGE `config.ranges`. */
function weightRangeTableRows(config: Record<string, unknown>): {
  min: string;
  max: string;
  rate: string;
}[] {
  const ranges = config.ranges;
  if (!Array.isArray(ranges)) return [];

  const out: { min: string; max: string; rate: string }[] = [];

  for (const raw of ranges) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const o = raw as Record<string, unknown>;
    const minRaw = o.min ?? o.minKg;
    const maxRaw = o.max ?? o.maxKg;
    let rateNum: number | undefined;
    if (typeof o.perKg === "number" && Number.isFinite(o.perKg)) rateNum = o.perKg;
    else if (typeof o.perkg === "number" && Number.isFinite(o.perkg))
      rateNum = o.perkg;
    else if (typeof o.ratePerKg === "number" && Number.isFinite(o.ratePerKg))
      rateNum = o.ratePerKg;

    out.push({
      min:
        typeof minRaw === "number" && Number.isFinite(minRaw)
          ? `${minRaw}`
          : formatCell(minRaw),
      max:
        typeof maxRaw === "number" && Number.isFinite(maxRaw)
          ? `${maxRaw}`
          : formatCell(maxRaw),
      rate: rateNum !== undefined ? String(rateNum) : "—",
    });
  }

  return out;
}

function WeightRangePricingTable({ config }: { config: Record<string, unknown> }) {
  const rows = weightRangeTableRows(config);
  if (rows.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs font-medium text-gray-600">Rates by weight</p>
      <Table className="border border-gray-200 rounded-md overflow-hidden text-xs">
        <TableHeader className="bg-white">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 text-gray-700">From (kg)</TableHead>
            <TableHead className="h-9 text-gray-700">To (kg)</TableHead>
            <TableHead className="h-9 text-gray-700 text-right">Price / kg</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {rows.map((r, i) => (
            <TableRow key={i} className="hover:bg-gray-50/80">
              <TableCell className="font-medium tabular-nums">{r.min}</TableCell>
              <TableCell className="tabular-nums">{r.max}</TableCell>
              <TableCell className="tabular-nums text-right">{r.rate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function tariffConfigExtras(
  type: unknown,
  cfg: Record<string, unknown> | null,
): ReactNode {
  if (!cfg) return null;
  const t = typeof type === "string" ? type : "";
  if (t !== "WEIGHT_RANGE") return null;
  return <WeightRangePricingTable config={cfg} />;
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

  const categoryPricingRows = useMemo((): Record<string, unknown>[] => {
    if (!tariff || !Array.isArray(tariff.categoryPricing)) return [];
    return tariff.categoryPricing as Record<string, unknown>[];
  }, [tariff]);

  const zonalRows = useMemo(() => {
    if (!tariff || scope === "TOWN") return [];
    return categoryPricingRows;
  }, [tariff, scope, categoryPricingRows]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 p-6 bg-white">
        <Spinner className="h-10 w-10 text-[#EE1E21]" />
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
            className="!text-[#FADF4B] !size-[40px] bg-[#EE1E21] hover:bg-[#EE1E21] !rounded-full !p-0 shrink-0 cursor-pointer"
            onClick={() => navigate("/pricing")}
          >
            <IoArrowBack className="text-[#FADF4B] text-xl" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <IoPricetags className="text-[#EE1E21] text-2xl shrink-0" />
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
          className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] cursor-pointer shrink-0"
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
                <Label className="text-gray-600">Service type</Label>
                <p className="font-medium mt-1">
                  {displayServiceType(tariff.serviceType)}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Type</Label>
                <p className="font-medium text-[#EE1E21] mt-1">{scope}</p>
                {(tariff.shippingScope ?? tariff.scope) != null ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    API scope:{" "}
                    {formatCell(tariff.shippingScope ?? tariff.scope)}
                  </p>
                ) : inferScopeFromName(tariff.name) ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Inferred from tariff name
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
                <p className="font-medium mt-1">
                  {formatCell(tariff.remarkType ?? tariff.remark)}
                </p>
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

        {(scope === "TOWN" &&
          (townServiceRows.length > 0 || categoryPricingRows.length > 0)) ||
        (scope !== "TOWN" && categoryPricingRows.length > 0) ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              {tariff.mode != null ? (
                <p className="text-sm text-gray-500 font-normal">
                  Mode: {formatCell(tariff.mode)}
                  {categoryPricingRows.length > 0
                    ? ` · ${categoryPricingRows.length} categor${categoryPricingRows.length === 1 ? "y" : "ies"}`
                    : null}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {scope === "TOWN" && townServiceRows.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Service summary
                  </p>
                  {townServiceRows.map((row, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap gap-x-6 gap-y-1 py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium">
                        {displayServiceType(
                          row.serviceType ?? row.serviceTypeName,
                        )}
                      </span>
                      <span className="text-gray-600">
                        Base: {formatCell(row.baseFee ?? row.basePrice)}
                      </span>
                      <span className="text-gray-600">
                        Margin:{" "}
                        {formatProfitMarginDisplay(
                          row.profitMargin ?? row.profitPerc ?? row.profit,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {scope === "TOWN" && categoryPricingRows.length > 0 ? (
                <div className="space-y-3">
                  {townServiceRows.length > 0 ? (
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2 border-t border-gray-100">
                      Category pricing
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Category pricing
                    </p>
                  )}
                  {categoryPricingRows.map((row, index) => {
                    const cfg = getRowConfig(row);
                    const rk =
                      typeof row.id === "string" ? row.id : `town-cp-${index}`;
                    const lines =
                      cfg && Object.keys(cfg).length > 0
                        ? configSummaryLines(row.type, cfg)
                        : [];
                    return (
                      <div
                        key={rk}
                        className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 space-y-2"
                      >
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          <span className="font-medium text-gray-900">
                            {categoryLabelForRow(row)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {formatCell(row.type)}
                          </Badge>
                          <span className="text-gray-600">
                            Service:{" "}
                            <span className="font-medium text-gray-800">
                              {serviceTypeLabelForRow(tariff, row)}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-gray-700">
                          <span>
                            Margin:{" "}
                            {formatProfitMarginDisplay(
                              cfg?.profitMargin ??
                                row.profitPerc ??
                                row.profitMargin,
                            )}
                          </span>
                          {"additionalCost" in (cfg ?? {}) ||
                          typeof row.additionalCost === "number" ? (
                            <span>
                              Additional cost:{" "}
                              {formatCell(
                                cfg?.additionalCost ?? row.additionalCost,
                              )}
                            </span>
                          ) : null}
                        </div>
                        {tariffConfigExtras(row.type, cfg)}
                        {lines.length > 0 ? (
                          <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                            {lines.map((line, li) => (
                              <li key={li}>{line}</li>
                            ))}
                          </ul>
                        ) : cfg &&
                          row.type === "WEIGHT_RANGE" &&
                          weightRangeTableRows(cfg).length > 0 ? null : cfg ? (
                          <p className="text-xs text-gray-500 font-mono break-all">
                            {formatCell(cfg)}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {scope !== "TOWN" ? (
                <div className="space-y-3 text-gray-700">
                  <p>
                    <span className="text-gray-600">
                      Category pricing entries:{" "}
                    </span>
                    <span className="font-medium">{zonalRows.length}</span>
                  </p>
                  {zonalRows.length > 0 ? (
                    <div className="space-y-2">
                      {zonalRows.map((row, index) => {
                        const cfg = getRowConfig(row);
                        const rk =
                          typeof row.id === "string"
                            ? row.id
                            : `zonal-cp-${index}`;
                        const lines =
                          cfg && Object.keys(cfg).length > 0
                            ? configSummaryLines(row.type, cfg)
                            : [];
                        const airportRaw =
                          cfg?.airportFeePerKg ??
                          cfg?.airportFee ??
                          row.airportFeePerKg;
                        return (
                          <div
                            key={rk}
                            className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 space-y-2"
                          >
                            <div className="flex flex-wrap items-center gap-2 gap-y-1">
                              <span className="font-medium text-gray-900">
                                {categoryLabelForRow(row)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {formatCell(row.type)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1">
                              <span className="text-gray-600">
                                Service:{" "}
                                <span className="font-medium text-gray-800">
                                  {serviceTypeLabelForRow(tariff, row)}
                                </span>
                              </span>
                              <span className="text-gray-600">
                                Margin:{" "}
                                {formatProfitMarginDisplay(
                                  cfg?.profitMargin ??
                                    row.profitPerc ??
                                    row.profitMargin,
                                )}
                              </span>
                              {airportRaw != null ? (
                                <span className="text-gray-600">
                                  Airport: {formatCell(airportRaw)} / kg
                                </span>
                              ) : null}
                            </div>
                            {tariffConfigExtras(row.type, cfg)}
                            {lines.length > 0 ? (
                              <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                                {lines.map((line, li) => (
                                  <li key={li}>{line}</li>
                                ))}
                              </ul>
                            ) : cfg &&
                              row.type === "WEIGHT_RANGE" &&
                              weightRangeTableRows(cfg).length > 0 ? null : cfg ? (
                              <p className="text-xs text-gray-500 font-mono break-all">
                                {formatCell(cfg)}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No category pricing entries found.
                    </p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : scope === "TOWN" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <p>No service or category pricing rows in this tariff.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
