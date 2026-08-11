import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { Skeleton } from "antd";
import api from "@/lib/api/api";

// =============================
// TYPES
// =============================
interface RevenuePeriod {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalSurcharge: number;
  totalDiscount: number;
  totalMiscFees: number;
  totalAirportFee: number;
}

interface RevenueSummary {
  day: { current: RevenuePeriod; previous: RevenuePeriod };
  week: { current: RevenuePeriod; previous: RevenuePeriod };
  month: { current: RevenuePeriod; previous: RevenuePeriod };
  meta: { generatedAt: string };
}

interface SalesData {
  name: string;
  revenue: number;
  profit: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any;
  label?: string;
}

// =============================
// CUSTOM TOOLTIP (UI unchanged)
// =============================
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-slate-900/90 border border-slate-700 flex flex-col gap-2 rounded-lg shadow-xl">
        <p className="text-white font-semibold">{label}</p>
        <p className="text-sm text-[#EE1E21]">
          Revenue: <span className="ml-2">${payload[0].value}</span>
        </p>
        <p className="text-sm text-[#FADF4B]">
          Profit: <span className="ml-2">${payload[1].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// =============================
// MAIN COMPONENT
// =============================
const Revenue = () => {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);

  // Fetch revenue summary
  const fetchRevenueSummary = async () => {
    try {
      setLoading(true);

      const res = await api.get<{ data: RevenueSummary }>(
        "/report/dashboard/revenue-summary"
      );

      setSummary(res.data.data);
    } catch (error) {
      console.error("Revenue fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueSummary();
  }, []);

  // =============================
  // Convert API → Chart Data
  // =============================
  const getChartData = (): SalesData[] => {
    if (!summary) return [];

    const convert = (label: string, data: RevenuePeriod): SalesData => ({
      name: label,
      revenue: data.totalRevenue ?? 0,
      profit: data.totalProfit ?? 0,
    });

    if (view === "daily") {
      return [
        convert("Previous Day", summary.day.previous),
        convert("Today", summary.day.current),
      ];
    }

    if (view === "weekly") {
      return [
        convert("Previous Week", summary.week.previous),
        convert("This Week", summary.week.current),
      ];
    }

    return [
      convert("Previous Month", summary.month.previous),
      convert("This Month", summary.month.current),
    ];
  };

  const data = getChartData();

  // =============================
  // RENDER UI
  // =============================
  return (
    <div className="w-full h-96 pt-6 font-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <p className="font-semibold text-base">Revenue Trends</p>

        {/* View Switcher */}
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((option) => (
            <button
              key={option}
              onClick={() => setView(option as typeof view)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                view === option
                  ? "bg-[#EE1E21] text-[#FADF4B]"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EE1E21" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EE1E21" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f2c94c" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f2c94c" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              axisLine={false}
              tickLine={false}
            />
            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#EE1E21"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="profit"
              stroke="#f2c94c"
              fillOpacity={1}
              fill="url(#colorProfit)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default Revenue;
