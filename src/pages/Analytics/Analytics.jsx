import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";

function formatIsoDateUtc(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoToUtcDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysIsoUtc(dateStr, deltaDays) {
  const base = parseIsoToUtcDate(dateStr);
  if (!base) return "";
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return formatIsoDateUtc(base);
}

function getMonthKey(dateStr) {
  const base = parseIsoToUtcDate(dateStr);
  if (!base) return "";
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function daysBetweenIsoUtc(startIso, endIso) {
  const start = parseIsoToUtcDate(startIso);
  const end = parseIsoToUtcDate(endIso);
  if (!start || !end) return null;
  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return diffDays;
}

function getIsoWeekYearAndNumber(dateStr) {
  const base = parseIsoToUtcDate(dateStr);
  if (!base) return null;

  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const dayNr = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - dayNr + 3); // Thu
  const isoYear = d.getUTCFullYear();

  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);

  const weekNo = 1 + Math.round((d.getTime() - firstThursday.getTime()) / 86400000 / 7);
  return { isoYear, weekNo };
}

function toWeekInputValue(dateStr) {
  const parts = getIsoWeekYearAndNumber(dateStr);
  if (!parts) return "";
  return `${parts.isoYear}-W${String(parts.weekNo).padStart(2, "0")}`;
}

function weekInputToMondayIso(weekValue) {
  // weekValue: YYYY-Www
  const m = /^(\d{4})-W(\d{2})$/.exec(String(weekValue));
  if (!m) return "";
  const year = Number.parseInt(m[1], 10);
  const week = Number.parseInt(m[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return "";

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayNr = (jan4.getUTCDay() + 6) % 7; // Mon=0
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4DayNr);

  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  return formatIsoDateUtc(monday);
}

function parseMonthKeyToYearMonth(monthKey) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(monthKey));
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const month = Number.parseInt(m[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, monthIndex: month - 1 };
}

function getDaysInMonthUtc(monthKey) {
  const parts = parseMonthKeyToYearMonth(monthKey);
  if (!parts) return 0;
  // Day 0 of next month is last day of current month.
  return new Date(Date.UTC(parts.year, parts.monthIndex + 1, 0)).getUTCDate();
}

function listMonthKeysInclusive(startMonthKey, endMonthKey) {
  const start = parseMonthKeyToYearMonth(startMonthKey);
  const end = parseMonthKeyToYearMonth(endMonthKey);
  if (!start || !end) return [];

  const out = [];
  let y = start.year;
  let m = start.monthIndex;
  while (y < end.year || (y === end.year && m <= end.monthIndex)) {
    out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function buildDailyValueMap(rows, centerAId, centerBId, fromDate, toDate) {
  const aId = String(centerAId);
  const bId = String(centerBId);
  const map = new Map();

  for (const row of rows) {
    if (row.date < fromDate || row.date > toDate) continue;

    let targetKey = "";
    if (row.centerId === aId) {
      targetKey = "aVal";
    } else if (row.centerId === bId) {
      targetKey = "bVal";
    }

    if (!targetKey) continue;

    const cur = map.get(row.date) || { aVal: null, bVal: null };

    // "Direct price" per day: keep the first seen value for that day+center.
    // Rows come from the API ordered by date DESC, so first seen is typically the latest for that day.
    if (cur[targetKey] === null) cur[targetKey] = row.price;

    map.set(row.date, cur);
  }

  return map;
}

function buildWeeklySeriesFromDailyMap(dailyMap, startDate, weeksCount) {
  // WEEKLY AVG LOGIC
  // We average only over the days that actually have price data.
  // Example: if a product has 5 recorded price-days in a week, the weekly average is:
  //   weeklyAvg = (sum of those 5 prices) / 5
  // NOT divide by 7 (missing days are ignored, not treated as 0).
  // Note: we track separate counts for center A and center B, because one center may have
  // data on days where the other center has no entry.
  const out = [];
  for (let w = 0; w < weeksCount; w += 1) {
    const weekStart = addDaysIsoUtc(startDate, w * 7);
    let aSum = 0;
    let bSum = 0;
    let aCount = 0; // number of days with a valid A-center price
    let bCount = 0; // number of days with a valid B-center price

    for (let d = 0; d < 7; d += 1) {
      const date = addDaysIsoUtc(weekStart, d);
      const cur = dailyMap.get(date);
      if (cur?.aVal !== null && cur?.aVal !== undefined) {
        aSum += cur.aVal;
        aCount += 1;
      }
      if (cur?.bVal !== null && cur?.bVal !== undefined) {
        bSum += cur.bVal;
        bCount += 1;
      }
    }

    out.push({
      week: weekStart,
      // Divide by available-day count (not fixed 7).
      aAvg: aCount > 0 ? aSum / aCount : null,
      bAvg: bCount > 0 ? bSum / bCount : null,
    });
  }
  return out;
}
// DAILY TREND LOGIC:
// For each date in the selected inclusive range, plot that day's direct price per center.
// If a center has no record for a day, keep it as null so the line chart shows a gap.
function computeDailySeries({
  rows,
  centerAId,
  centerBId,
  fromDate,
  toDate,
}) {
  if (!centerAId || !centerBId) return [];
  if (!fromDate || !toDate) return [];
  if (fromDate > toDate) return [];

  const diff = daysBetweenIsoUtc(fromDate, toDate);
  if (diff === null) return [];
  const daysCount = diff + 1;
  if (daysCount <= 0 || daysCount > 370) return [];

  const dailyMap = buildDailyValueMap(rows, centerAId, centerBId, fromDate, toDate);
  const out = [];
  for (let i = 0; i < daysCount; i += 1) {
    const date = addDaysIsoUtc(fromDate, i);
    const cur = dailyMap.get(date);

    out.push({
      date,
      aAvg: cur?.aVal ?? null,
      bAvg: cur?.bVal ?? null,
    });
  }
  return out;
}

function computeWeeklySeries({
  rows,
  centerAId,
  centerBId,
  weekEndDate,
  weeksCount,
}) {
  if (!centerAId || !centerBId || !weekEndDate) return [];
  const startDate = addDaysIsoUtc(weekEndDate, -((weeksCount * 7) - 1));
  if (!startDate) return [];

  const dailyMap = buildDailyValueMap(rows, centerAId, centerBId, startDate, weekEndDate);
  return buildWeeklySeriesFromDailyMap(dailyMap, startDate, weeksCount);
}

function computeMonthlySeries({
  rows,
  centerAId,
  centerBId,
  endMonthKey,
  monthsCount,
}) {
  // MONTHLY AVG LOGIC
  // Same idea as weekly: average over the number of days that have data.
  // Example: if a product has 25 recorded price-days in a month:
  //   monthlyAvg = (sum of those 25 prices) / 25
  // NOT divide by all days in the calendar month.
  if (!centerAId || !centerBId || !endMonthKey) return [];

  const endMonthDate = parseIsoToUtcDate(`${endMonthKey}-01`);
  if (!endMonthDate) return [];
  const startMonthDate = new Date(endMonthDate);
  startMonthDate.setUTCMonth(startMonthDate.getUTCMonth() - (monthsCount - 1));
  const startMonthKey = `${startMonthDate.getUTCFullYear()}-${String(startMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const monthKeys = listMonthKeysInclusive(startMonthKey, endMonthKey);
  if (!monthKeys.length) return [];

  const rangeStart = `${startMonthKey}-01`;
  const endDays = getDaysInMonthUtc(endMonthKey);
  const rangeEnd = endDays ? `${endMonthKey}-${String(endDays).padStart(2, "0")}` : "";
  if (!rangeEnd) return [];

  const dailyMap = buildDailyValueMap(rows, centerAId, centerBId, rangeStart, rangeEnd);

  return monthKeys.map((monthKey) => {
    const daysInMonth = getDaysInMonthUtc(monthKey);
    if (!daysInMonth) return { month: monthKey, aAvg: null, bAvg: null };

    const monthStart = `${monthKey}-01`;
    let aSum = 0;
    let bSum = 0;
    let aCount = 0;
    let bCount = 0;

    for (let d = 0; d < daysInMonth; d += 1) {
      const date = addDaysIsoUtc(monthStart, d);
      const cur = dailyMap.get(date);
      if (cur?.aVal !== null && cur?.aVal !== undefined) {
        aSum += cur.aVal;
        aCount += 1;
      }
      if (cur?.bVal !== null && cur?.bVal !== undefined) {
        bSum += cur.bVal;
        bCount += 1;
      }
    }

    return {
      month: monthKey,
      // Divide by available-day count (not calendar days-in-month).
      aAvg: aCount > 0 ? aSum / aCount : null,
      bAvg: bCount > 0 ? bSum / bCount : null,
    };
  });
}

function formatLKR(value) {
  if (value === null || value === undefined) return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

function toNumber(value) {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function toIdStringOrEmpty(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeMarketPriceRow(rawRow) {
  const date = rawRow?.date ? String(rawRow.date) : "";
  if (!date) return null;

  const centerId = toIdStringOrEmpty(rawRow?.economic_center_location_id);
  if (!centerId) return null;

  const price = toNumber(rawRow?.price);
  if (price === null) return null;

  const productId = toIdStringOrEmpty(rawRow?.product_id) || null;

  return {
    date,
    centerId,
    productId,
    price,
  };
}

function rowPassesFilters(row, selectedCenterIdSet, allowedProductIdSet) {
  if (selectedCenterIdSet.size > 0 && !selectedCenterIdSet.has(row.centerId)) return false;
  if (allowedProductIdSet && allowedProductIdSet.size > 0) {
    if (!row.productId) return false;
    if (!allowedProductIdSet.has(String(row.productId))) return false;
  }
  return true;
}

function normalizeMarketPriceRows({ marketPrices, selectedCenterIds, allowedProductIdSet }) {
  const out = [];
  const selectedCenterIdSet = new Set((selectedCenterIds || []).map(String));

  for (const rawRow of marketPrices || []) {
    const row = normalizeMarketPriceRow(rawRow);
    if (!row) continue;
    if (!rowPassesFilters(row, selectedCenterIdSet, allowedProductIdSet)) continue;
    out.push(row);
  }

  return out;
}

function useAnalyticsRemoteData() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [marketPrices, setMarketPrices] = useState([]);
  const [economicCenters, setEconomicCenters] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [mpRes, ecoRes, prodRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/market_price/getAll`),
          axios.get(`${API_BASE_URL}/api/economic_center/getAll`),
          axios.get(`${API_BASE_URL}/api/product/getAll`),
        ]);

        if (!isMounted) return;
        setMarketPrices(mpRes?.data?.result ?? []);
        setEconomicCenters(ecoRes?.data?.result ?? ecoRes?.data ?? []);
        setProducts(prodRes?.data?.result ?? prodRes?.data ?? []);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage(error?.response?.data?.message || error?.message || "Failed to load analytics data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, errorMessage, marketPrices, economicCenters, products };
}

function useChartDateControls(availableDates) {
  const [dailyFromDate, setDailyFromDate] = useState("");
  const [dailyToDate, setDailyToDate] = useState("");
  const [weeklyWeek, setWeeklyWeek] = useState("");
  const [monthlyMonth, setMonthlyMonth] = useState("");

  const snapshotDate = availableDates.at(-1) || "";

  const minAvailableDate = availableDates.at(0) || "";
  const maxAvailableDate = availableDates.at(-1) || "";
  const minAvailableMonth = minAvailableDate ? getMonthKey(minAvailableDate) : "";
  const maxAvailableMonth = maxAvailableDate ? getMonthKey(maxAvailableDate) : "";

  useEffect(() => {
    if (!snapshotDate) return;
    // Keep chart selectors aligned with the latest available date
    // for the currently filtered dataset (center + product).
    setDailyToDate(snapshotDate);
    setDailyFromDate(addDaysIsoUtc(snapshotDate, -29));
    setWeeklyWeek(toWeekInputValue(snapshotDate));
    setMonthlyMonth(getMonthKey(snapshotDate));
  }, [snapshotDate]);

  return {
    snapshotDate,
    dailyFromDate,
    setDailyFromDate,
    dailyToDate,
    setDailyToDate,
    weeklyWeek,
    setWeeklyWeek,
    monthlyMonth,
    setMonthlyMonth,
    minAvailableDate,
    maxAvailableDate,
    minAvailableMonth,
    maxAvailableMonth,
  };
}

function useEconomicCenterSelection(economicCenters, economicCenterNameById) {
  const [centerFilter, setCenterFilter] = useState("both");

  const findEconomicCenterId = useMemo(() => {
    return (needle) => {
      const n = String(needle).toLowerCase();
      for (const c of economicCenters) {
        const name = String(c?.name ?? c?.location ?? "").toLowerCase();
        if (!name) continue;
        if (name.includes(n)) return String(c.id);
      }
      return "";
    };
  }, [economicCenters]);

  const dambullaId = useMemo(() => {
    return findEconomicCenterId("dambulla") || String(economicCenters.at(0)?.id ?? "");
  }, [economicCenters, findEconomicCenterId]);

  const tambuttegamaId = useMemo(() => {
    return (
      findEconomicCenterId("tambuttegama") ||
      String(economicCenters.at(1)?.id ?? economicCenters.at(0)?.id ?? "")
    );
  }, [economicCenters, findEconomicCenterId]);

  const selection = useMemo(() => {
    if (!dambullaId && !tambuttegamaId) {
      return {
        centerAId: "",
        centerBId: "",
        selectedCenterIds: [],
        selectedCenterName: "Economic Center",
      };
    }

    if (centerFilter === "dambulla") {
      return {
        centerAId: dambullaId,
        centerBId: dambullaId,
        selectedCenterIds: dambullaId ? [String(dambullaId)] : [],
        selectedCenterName: economicCenterNameById.get(String(dambullaId)) || "Dambulla",
      };
    }

    if (centerFilter === "tambuttegama") {
      return {
        centerAId: tambuttegamaId,
        centerBId: tambuttegamaId,
        selectedCenterIds: tambuttegamaId ? [String(tambuttegamaId)] : [],
        selectedCenterName: economicCenterNameById.get(String(tambuttegamaId)) || "Tambuttegama",
      };
    }

    return {
      centerAId: dambullaId,
      centerBId: tambuttegamaId,
      selectedCenterIds: [String(dambullaId), String(tambuttegamaId)].filter(Boolean),
      selectedCenterName: "Dambulla + Tambuttegama",
    };
  }, [centerFilter, dambullaId, economicCenterNameById, tambuttegamaId]);

  const centerAName = economicCenterNameById.get(String(selection.centerAId)) || "Dambulla";
  const centerBName = economicCenterNameById.get(String(selection.centerBId)) || "Tambuttegama";

  return {
    centerFilter,
    setCenterFilter,
    centerAId: selection.centerAId,
    centerBId: selection.centerBId,
    selectedCenterIds: selection.selectedCenterIds,
    selectedCenterName: selection.selectedCenterName,
    centerAName,
    centerBName,
  };
}

function useProductSelection(products) {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const sortedProducts = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => String(a?.name ?? a?.title ?? "").localeCompare(String(b?.name ?? b?.title ?? "")));
    return list;
  }, [products]);

  const selectedProductName = useMemo(() => {
    if (!selectedProductId) return "";
    const p = products.find((x) => String(x?.id) === String(selectedProductId));
    return String(p?.name ?? p?.title ?? "");
  }, [products, selectedProductId]);

  const onProductSearchChange = (nextValue) => {
    const next = String(nextValue);
    setProductSearch(next);
    const needle = next.trim().toLowerCase();
    if (!needle) {
      setSelectedProductId("");
      return;
    }

    const match = products.find((p) => String(p?.name ?? p?.title ?? "").trim().toLowerCase() === needle);
    setSelectedProductId(match?.id !== null && match?.id !== undefined ? String(match.id) : "");
  };

  const clearProductSelection = () => {
    setProductSearch("");
    setSelectedProductId("");
  };

  return {
    productSearch,
    selectedProductId,
    sortedProducts,
    selectedProductName,
    onProductSearchChange,
    clearProductSelection,
  };
}

function AnalyticsHeader() {
  // Intentionally blank: title/subtitle removed per UI requirement.
  return null;
}

function AnalyticsFilters({
  centerFilter,
  setCenterFilter,
  productSearch,
  onProductSearchChange,
  clearProductSelection,
  sortedProducts,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
      <div>
        <label htmlFor="analytics-center" className="block text-sm font-medium text-gray-700 mb-1">
          Economic Center
        </label>
        <select
          id="analytics-center"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none cursor-pointer"
          value={centerFilter}
          onChange={(e) => setCenterFilter(e.target.value)}
        >
          <option value="both">Dambulla + Tambuttegama</option>
          <option value="dambulla">Dambulla</option>
          <option value="tambuttegama">Tambuttegama</option>
        </select>
      </div>

      <div>
        <label htmlFor="analytics-product" className="block text-sm font-medium text-gray-700 mb-1">
          Product (search)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="analytics-product"
            list="analytics-product-list"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none cursor-text"
            placeholder="Select a product"
            value={productSearch}
            onChange={(e) => onProductSearchChange(e.target.value)}
          />
          <button
            type="button"
            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer"
            onClick={clearProductSelection}
          >
            Clear
          </button>
        </div>

        <datalist id="analytics-product-list">
          {sortedProducts.slice(0, 250).map((p) => (
            <option key={p.id} value={String(p?.name ?? p?.title ?? `#${p.id}`)} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

AnalyticsFilters.propTypes = {
  centerFilter: PropTypes.string.isRequired,
  setCenterFilter: PropTypes.func.isRequired,
  productSearch: PropTypes.string.isRequired,
  onProductSearchChange: PropTypes.func.isRequired,
  clearProductSelection: PropTypes.func.isRequired,
  sortedProducts: PropTypes.array.isRequired,
};

function AnalyticsChartsGrid({
  WEEKLY_WEEKS,
  MONTHLY_MONTHS,
  centerFilter,
  selectedCenterName,
  centerAName,
  centerBName,
  dailyFromDate,
  setDailyFromDate,
  dailyToDate,
  setDailyToDate,
  weeklyWeek,
  setWeeklyWeek,
  monthlyMonth,
  setMonthlyMonth,
  minAvailableDate,
  maxAvailableDate,
  minAvailableMonth,
  maxAvailableMonth,
  dailySeries,
  weeklySeries,
  monthlySeries,
}) {
  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Daily Trend (Price)</h2>
            <p className="text-xs text-gray-500 mt-1">Select a date range</p>
          </div>
          <div className="text-xs text-gray-500">Line chart</div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="analytics-daily-from" className="block text-xs font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              id="analytics-daily-from"
              type="date"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none cursor-pointer"
              value={dailyFromDate}
              onChange={(e) => setDailyFromDate(e.target.value)}
              min={minAvailableDate || undefined}
              max={maxAvailableDate || undefined}
            />
          </div>
          <div>
            <label htmlFor="analytics-daily-to" className="block text-xs font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              id="analytics-daily-to"
              type="date"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none cursor-pointer"
              value={dailyToDate}
              onChange={(e) => setDailyToDate(e.target.value)}
              min={minAvailableDate || undefined}
              max={maxAvailableDate || undefined}
            />
          </div>
        </div>

        <div className="h-[320px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v ? `LKR ${Math.round(v)}` : "LKR 0")} />
              <Tooltip formatter={(value) => formatLKR(value)} labelFormatter={(label) => `Date: ${label}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="aAvg"
                name={centerFilter === "both" ? centerAName : selectedCenterName}
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              {centerFilter === "both" ? (
                <Line
                  type="monotone"
                  dataKey="bAvg"
                  name={centerBName}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Weekly Comparison (Avg price)</h2>
            <p className="text-xs text-gray-500 mt-1">Last {WEEKLY_WEEKS} weeks</p>
          </div>
          <div className="text-xs text-gray-500">Bar chart</div>
        </div>

        <div className="mt-3">
          <label htmlFor="analytics-week" className="block text-xs font-medium text-gray-700 mb-1">
            Week (ending)
          </label>
          <input
            id="analytics-week"
            type="week"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none cursor-pointer"
            value={weeklyWeek}
            onChange={(e) => setWeeklyWeek(e.target.value)}
          />
          {weeklyWeek ? <p className="mt-1 text-xs text-gray-600">Selected week: {weeklyWeek}</p> : null}
        </div>

        <div className="h-[320px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v ? `LKR ${Math.round(v)}` : "LKR 0")} />
              <Tooltip formatter={(value) => formatLKR(value)} labelFormatter={(label) => `Week starting: ${label}`} />
              <Legend />
              <Bar
                dataKey="aAvg"
                name={centerFilter === "both" ? centerAName : selectedCenterName}
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />
              {centerFilter === "both" ? (
                <Bar dataKey="bAvg" name={centerBName} fill="#2563eb" radius={[6, 6, 0, 0]} />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Monthly Comparison (Avg price)</h2>
            <p className="text-xs text-gray-500 mt-1">Last {MONTHLY_MONTHS} months</p>
          </div>
          <div className="text-xs text-gray-500">Bar chart</div>
        </div>

        <div className="mt-3">
          <label htmlFor="analytics-month" className="block text-xs font-medium text-gray-700 mb-1">
            Month (ending)
          </label>
          <input
            id="analytics-month"
            type="month"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none cursor-pointer"
            value={monthlyMonth}
            onChange={(e) => setMonthlyMonth(e.target.value)}
            min={minAvailableMonth || undefined}
            max={maxAvailableMonth || undefined}
          />
        </div>

        <div className="h-[320px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v ? `LKR ${Math.round(v)}` : "LKR 0")} />
              <Tooltip formatter={(value) => formatLKR(value)} labelFormatter={(label) => `Month: ${label}`} />
              <Legend />
              <Bar
                dataKey="aAvg"
                name={centerFilter === "both" ? centerAName : selectedCenterName}
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />
              {centerFilter === "both" ? (
                <Bar dataKey="bAvg" name={centerBName} fill="#2563eb" radius={[6, 6, 0, 0]} />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

AnalyticsChartsGrid.propTypes = {
  WEEKLY_WEEKS: PropTypes.number.isRequired,
  MONTHLY_MONTHS: PropTypes.number.isRequired,
  centerFilter: PropTypes.string.isRequired,
  selectedCenterName: PropTypes.string.isRequired,
  centerAName: PropTypes.string.isRequired,
  centerBName: PropTypes.string.isRequired,
  dailyFromDate: PropTypes.string.isRequired,
  setDailyFromDate: PropTypes.func.isRequired,
  dailyToDate: PropTypes.string.isRequired,
  setDailyToDate: PropTypes.func.isRequired,
  weeklyWeek: PropTypes.string.isRequired,
  setWeeklyWeek: PropTypes.func.isRequired,
  monthlyMonth: PropTypes.string.isRequired,
  setMonthlyMonth: PropTypes.func.isRequired,
  minAvailableDate: PropTypes.string.isRequired,
  maxAvailableDate: PropTypes.string.isRequired,
  minAvailableMonth: PropTypes.string.isRequired,
  maxAvailableMonth: PropTypes.string.isRequired,
  dailySeries: PropTypes.array.isRequired,
  weeklySeries: PropTypes.array.isRequired,
  monthlySeries: PropTypes.array.isRequired,
};

function AnalyticsMain({ errorMessage, children }) {
  return (
    <>
      {errorMessage ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {children}
    </>
  );
}

AnalyticsMain.propTypes = {
  errorMessage: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function Analytics() {
  const { errorMessage, marketPrices, economicCenters, products } = useAnalyticsRemoteData();

  const { productSearch, selectedProductId, sortedProducts, onProductSearchChange, clearProductSelection } = useProductSelection(products);

  const WEEKLY_WEEKS = 8;
  const MONTHLY_MONTHS = 12;

  const economicCenterNameById = useMemo(() => {
    const map = new Map();
    for (const c of economicCenters) {
      if (c?.id === null || c?.id === undefined) continue;
      const name = String(c?.name ?? c?.location ?? `#${c.id}`);
      map.set(String(c.id), name);
    }
    return map;
  }, [economicCenters]);

  const { centerFilter, setCenterFilter, centerAId, centerBId, selectedCenterIds, selectedCenterName, centerAName, centerBName } =
    useEconomicCenterSelection(economicCenters, economicCenterNameById);

  const productNameById = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (p?.id === null || p?.id === undefined) continue;
      const name = String(p?.name ?? p?.title ?? "").trim();
      if (!name) continue;
      map.set(String(p.id), name);
    }
    return map;
  }, [products]);

  const productSearchNeedle = useMemo(() => {
    return String(productSearch).trim().toLowerCase();
  }, [productSearch]);

  const allowedProductIdSet = useMemo(() => {
    if (selectedProductId) return new Set([String(selectedProductId)]);
    if (!productSearchNeedle) return null;

    const set = new Set();
    for (const [pid, name] of productNameById.entries()) {
      if (String(name).toLowerCase().includes(productSearchNeedle)) {
        set.add(String(pid));
      }
    }
    return set;
  }, [productNameById, productSearchNeedle, selectedProductId]);

  const filteredAvailableDates = useMemo(() => {
    const set = new Set();
    const centerIdSet = new Set((selectedCenterIds || []).map(String));
    const hasCenterFilter = centerIdSet.size > 0;
    const hasProductFilter = !!(allowedProductIdSet && allowedProductIdSet.size > 0);

    for (const r of marketPrices || []) {
      const date = r?.date ? String(r.date) : "";
      if (!date) continue;

      const cid = toIdStringOrEmpty(r?.economic_center_location_id);
      if (!cid) continue;
      if (hasCenterFilter && !centerIdSet.has(cid)) continue;

      const pid = toIdStringOrEmpty(r?.product_id);
      if (hasProductFilter && !allowedProductIdSet.has(pid)) continue;

      set.add(date);
    }

    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [allowedProductIdSet, marketPrices, selectedCenterIds]);

  const {
    dailyFromDate,
    setDailyFromDate,
    dailyToDate,
    setDailyToDate,
    weeklyWeek,
    setWeeklyWeek,
    monthlyMonth,
    setMonthlyMonth,
    minAvailableDate,
    maxAvailableDate,
    minAvailableMonth,
    maxAvailableMonth,
  } = useChartDateControls(filteredAvailableDates);

  const normalizedRows = useMemo(() => {
    return normalizeMarketPriceRows({
      marketPrices,
      selectedCenterIds,
      allowedProductIdSet,
    });
  }, [allowedProductIdSet, marketPrices, selectedCenterIds]);

  const dailySeries = useMemo(() => {
    return computeDailySeries({
      rows: normalizedRows,
      centerAId,
      centerBId,
      fromDate: dailyFromDate,
      toDate: dailyToDate,
    });
  }, [centerAId, centerBId, dailyFromDate, dailyToDate, normalizedRows]);

  const weeklySeries = useMemo(() => {
    const weekMonday = weeklyWeek ? weekInputToMondayIso(weeklyWeek) : "";
    const weekEndDate = weekMonday ? addDaysIsoUtc(weekMonday, 6) : "";

    return computeWeeklySeries({
      rows: normalizedRows,
      centerAId,
      centerBId,
      weekEndDate,
      weeksCount: WEEKLY_WEEKS,
    });
  }, [WEEKLY_WEEKS, centerAId, centerBId, normalizedRows, weeklyWeek]);

  const monthlySeries = useMemo(() => {
    return computeMonthlySeries({
      rows: normalizedRows,
      centerAId,
      centerBId,
      endMonthKey: monthlyMonth || "",
      monthsCount: MONTHLY_MONTHS,
    });
  }, [MONTHLY_MONTHS, centerAId, centerBId, monthlyMonth, normalizedRows]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <AnalyticsHeader />

        <AnalyticsFilters
          centerFilter={centerFilter}
          setCenterFilter={setCenterFilter}
          productSearch={productSearch}
          onProductSearchChange={onProductSearchChange}
          clearProductSelection={clearProductSelection}
          sortedProducts={sortedProducts}
        />
      </div>

      <AnalyticsMain errorMessage={errorMessage}>
        {selectedProductId ? (
          <AnalyticsChartsGrid
            WEEKLY_WEEKS={WEEKLY_WEEKS}
            MONTHLY_MONTHS={MONTHLY_MONTHS}
            centerFilter={centerFilter}
            selectedCenterName={selectedCenterName}
            centerAName={centerAName}
            centerBName={centerBName}
            dailyFromDate={dailyFromDate}
            setDailyFromDate={setDailyFromDate}
            dailyToDate={dailyToDate}
            setDailyToDate={setDailyToDate}
            weeklyWeek={weeklyWeek}
            setWeeklyWeek={setWeeklyWeek}
            monthlyMonth={monthlyMonth}
            setMonthlyMonth={setMonthlyMonth}
            minAvailableDate={minAvailableDate}
            maxAvailableDate={maxAvailableDate}
            minAvailableMonth={minAvailableMonth}
            maxAvailableMonth={maxAvailableMonth}
            dailySeries={dailySeries}
            weeklySeries={weeklySeries}
            monthlySeries={monthlySeries}
          />
        ) : (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-center text-gray-500 py-8">Please select a product to view analytics</p>
          </div>
        )}
      </AnalyticsMain>
    </div>
  );
}

export default Analytics;