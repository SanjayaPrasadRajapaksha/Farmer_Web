import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/Loading/LoadingSpinner";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";

function formatIsoDateUtc(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLocalIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysIsoUtc(dateStr, deltaDays) {
  const base = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return "";
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return formatIsoDateUtc(base);
}

function Report() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [marketPrices, setMarketPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [economicCenters, setEconomicCenters] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    productName: "",
    categoryId: "",
  });

  const [differenceMode, setDifferenceMode] = useState("D_MINUS_T");
  const [predDifferenceMode, setPredDifferenceMode] = useState("D_MINUS_T");

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, [products]);

  const categoryById = useMemo(() => {
    const map = new Map();
    for (const c of categories) map.set(String(c.id), c);
    return map;
  }, [categories]);

  const sortedCategories = useMemo(() => {
    const isVegetable = (category) => String(category?.name ?? "").toLowerCase().includes("veget");

    return [...categories].sort((a, b) => {
      const aRank = isVegetable(a) ? 0 : 1;
      const bRank = isVegetable(b) ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
    });
  }, [categories]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [mpRes, prodRes, ecoRes, catRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/market_price/getAll`),
        axios.get(`${API_BASE_URL}/api/product/getAll`),
        axios.get(`${API_BASE_URL}/api/economic_center/getAll`),
        axios.get(`${API_BASE_URL}/api/category/getAll`),
      ]);

      setMarketPrices(mpRes?.data?.result ?? []);
      setProducts(prodRes?.data?.result ?? prodRes?.data ?? []);
      setEconomicCenters(ecoRes?.data?.result ?? ecoRes?.data ?? []);
      setCategories(catRes?.data?.result ?? catRes?.data ?? []);
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.response?.data?.message || error?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const economicCenterIdByName = useMemo(() => {
    const map = new Map();
    for (const e of economicCenters) {
      const name = String(e.name ?? e.location ?? "").trim();
      if (!name) continue;
      map.set(name.toLowerCase(), e.id);
    }
    return map;
  }, [economicCenters]);

  const findCenterId = useCallback(
    (needle) => {
      const n = String(needle).toLowerCase();
      for (const [name, id] of economicCenterIdByName.entries()) {
        if (name.includes(n)) return id;
      }
      return null;
    },
    [economicCenterIdByName]
  );

  const dambullaCenterId = useMemo(() => findCenterId("dambulla"), [findCenterId]);
  const tambuttegamaCenterId = useMemo(() => findCenterId("tambuttegama"), [findCenterId]);

  const availableDates = useMemo(() => {
    const set = new Set();
    for (const r of marketPrices) {
      if (r?.date) set.add(String(r.date));
    }
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [marketPrices]);

  const availableDatesSet = useMemo(() => new Set(availableDates), [availableDates]);

  useEffect(() => {
    if (selectedDate) return;
    if (availableDates.length === 0) return;
    const todayIso = formatLocalIsoDate(new Date());
    if (availableDatesSet.has(todayIso)) {
      setSelectedDate(todayIso);
      return;
    }
    setSelectedDate(availableDates.at(-1) || "");
  }, [availableDates, availableDatesSet, selectedDate]);

  const priceIndex = useMemo(() => {
    const map = new Map();
    for (const r of marketPrices) {
      const productId = r?.product_id;
      const centerId = r?.economic_center_location_id;
      const date = r?.date;
      if (productId === null || productId === undefined) continue;
      if (centerId === null || centerId === undefined) continue;
      if (!date) continue;

      const priceNum = Number.parseFloat(String(r.price));
      if (!Number.isFinite(priceNum)) continue;

      const key = `${productId}|${centerId}|${date}`;
      map.set(key, priceNum);
    }
    return map;
  }, [marketPrices]);

  const tomorrowDate = useMemo(() => (selectedDate ? addDaysIsoUtc(selectedDate, 1) : ""), [selectedDate]);

  const tableRows = useMemo(() => {
    if (!selectedDate) return [];
    if (!dambullaCenterId || !tambuttegamaCenterId) return [];

    const getPrice = (productId, centerId, dateStr) => {
      if (!productId || !centerId || !dateStr) return null;
      const key = `${productId}|${centerId}|${dateStr}`;
      return priceIndex.has(key) ? priceIndex.get(key) : null;
    };

    const compute7DayPrediction = (productId, centerId, dateStr) => {
      if (!productId || !centerId || !dateStr) return null;

      let sum = 0;
      for (let i = 0; i < 7; i++) {
        const d = addDaysIsoUtc(dateStr, -i);
        if (!d) return null;
        const p = getPrice(productId, centerId, d);
        if (p === null) return null;
        sum += p;
      }
      return sum / 7;
    };

    const productIds = new Set();

    for (const r of marketPrices) {
      if (!r?.date || String(r.date) !== String(selectedDate)) continue;
      const centerId = r?.economic_center_location_id;
      if (centerId !== dambullaCenterId && centerId !== tambuttegamaCenterId) continue;
      if (r.product_id !== null && r.product_id !== undefined) productIds.add(String(r.product_id));
    }

    const rowsOut = [];
    for (const productIdStr of productIds) {
      const productId = Number.parseInt(productIdStr, 10);
      const product = productById.get(productIdStr);
      const name = product?.name ?? product?.title ?? `#${productIdStr}`;
      const category_id = product?.category_id ?? null;
      const categoryName =
        category_id === null || category_id === undefined
          ? "-"
          : categoryById.get(String(category_id))?.name ?? "-";

      const dToday = getPrice(productId, dambullaCenterId, selectedDate);
      const tToday = getPrice(productId, tambuttegamaCenterId, selectedDate);

      const dPred = compute7DayPrediction(productId, dambullaCenterId, selectedDate);
      const tPred = compute7DayPrediction(productId, tambuttegamaCenterId, selectedDate);

      rowsOut.push({
        productId: productIdStr,
        name,
        category_id,
        categoryName,
        dToday,
        tToday,
        dPred,
        tPred,
      });
    }

    // Sort category-wise (Vegetables first), then by highest selected-date price.
    rowsOut.sort((a, b) => {
      const aCat = String(a.categoryName ?? "-");
      const bCat = String(b.categoryName ?? "-");

      const aIsVeg = aCat.toLowerCase().includes("veget");
      const bIsVeg = bCat.toLowerCase().includes("veget");
      if (aIsVeg !== bIsVeg) return aIsVeg ? -1 : 1;

      const catCmp = aCat.localeCompare(bCat);
      if (catCmp !== 0) return catCmp;

      const aMax = Math.max(
        Number.isFinite(Number(a.dToday)) ? Number(a.dToday) : -Infinity,
        Number.isFinite(Number(a.tToday)) ? Number(a.tToday) : -Infinity
      );
      const bMax = Math.max(
        Number.isFinite(Number(b.dToday)) ? Number(b.dToday) : -Infinity,
        Number.isFinite(Number(b.tToday)) ? Number(b.tToday) : -Infinity
      );
      if (bMax !== aMax) return bMax - aMax;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    return rowsOut;
  }, [
    selectedDate,
    dambullaCenterId,
    tambuttegamaCenterId,
    marketPrices,
    productById,
    categoryById,
    priceIndex,
  ]);

  const filteredTableRows = useMemo(() => {
    const nameNeedle = String(filters.productName || "").trim().toLowerCase();
    const categoryNeedle = String(filters.categoryId || "");

    return tableRows.filter((r) => {
      if (nameNeedle) {
        const n = String(r.name ?? "").toLowerCase();
        if (!n.includes(nameNeedle)) return false;
      }

      if (categoryNeedle) {
        if (String(r.category_id ?? "") !== categoryNeedle) return false;
      }

      return true;
    });
  }, [tableRows, filters]);

  const totalPages = useMemo(() => {
    const size = Math.max(1, Number(pageSize) || 10);
    return Math.max(1, Math.ceil(filteredTableRows.length / size));
  }, [filteredTableRows.length, pageSize]);

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedTableRows = useMemo(() => {
    const size = Math.max(1, Number(pageSize) || 10);
    const start = (currentPage - 1) * size;
    return filteredTableRows.slice(start, start + size);
  }, [filteredTableRows, currentPage, pageSize]);

  const formatMoney = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";

    const fixed = Math.abs(num) < 1e-9 ? "0.00" : num.toFixed(2);
    const [intRaw, frac = "00"] = fixed.split(".");

    let sign = "";
    let intPart = intRaw;
    if (intRaw.startsWith("-")) {
      sign = "-";
      intPart = intRaw.slice(1);
    }

    return `${sign}${intPart.padStart(2, "0")}.${frac}`;
  };

  const formatPrice = (value) => {
    return formatMoney(value);
  };

  const toFiniteNumberOrNull = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && value.trim() === "-") return null;
    const num = typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(num) ? num : null;
  };

  const getHigherTodaySide = (dToday, tToday) => {
    const dNum = toFiniteNumberOrNull(dToday);
    const tNum = toFiniteNumberOrNull(tToday);
    if (dNum === null || tNum === null) return null;
    if (dNum === tNum) return null;
    return dNum > tNum ? "D" : "T";
  };

  const getHigherPredictedSide = (dPred, tPred) => {
    const dNum = toFiniteNumberOrNull(dPred);
    const tNum = toFiniteNumberOrNull(tPred);
    if (dNum === null || tNum === null) return null;
    if (dNum === tNum) return null;
    return dNum > tNum ? "D" : "T";
  };

  const getDiff = (leftValue, rightValue) => {
    const leftNum = toFiniteNumberOrNull(leftValue);
    const rightNum = toFiniteNumberOrNull(rightValue);
    if (leftNum === null || rightNum === null) return null;
    return leftNum - rightNum;
  };

  const getDifferenceByMode = (dValue, tValue) => {
    if (differenceMode === "T_MINUS_D") return getDiff(tValue, dValue);
    return getDiff(dValue, tValue);
  };

  const getPredDifferenceByMode = (dValue, tValue) => {
    if (predDifferenceMode === "T_MINUS_D") return getDiff(tValue, dValue);
    return getDiff(dValue, tValue);
  };

  const getDifferenceHeader = () => {
    return "Diff";
  };

  const onDownloadPdf = () => {
    if (loading) return;
    if (missingCenters) {
      setErrorMessage("Economic centers not found for Dambulla / Tambuttegama");
      return;
    }
    if (!selectedDate) {
      setErrorMessage("Please select a date");
      return;
    }
    if (filteredTableRows.length === 0) {
      setErrorMessage("No data to export");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      doc.setFontSize(14);
      doc.text("Market Price Comparison", 40, 40);

      doc.setFontSize(10);
      doc.text(`Date: ${selectedDate}`, 40, 60);
      doc.text(`Prediction Date: ${tomorrowDate || "-"}`, 200, 60);

      const diffModeLabel = differenceMode === "T_MINUS_D" ? "T-D" : "D-T";
      const predDiffModeLabel = predDifferenceMode === "T_MINUS_D" ? "T-D" : "D-T";

      const head = [[
        "Product",
        "Category",
        `Dambulla (${selectedDate})`,
        `Tambuttegama (${selectedDate})`,
        `${getDifferenceHeader()} (${diffModeLabel})`,
        `Predicted ${tomorrowDate || "tomorrow"} (D)`,
        `Predicted ${tomorrowDate || "tomorrow"} (T)`,
        `Pred Diff (${predDiffModeLabel})`,
      ]];

      const PDF_GREEN = [22, 163, 74];
      const PDF_RED = [220, 38, 38];

      const pdfCell = (content, textColor) => {
        const contentStr = content === null || content === undefined ? "-" : String(content);
        if (!textColor) return { content: contentStr };
        return { content: contentStr, styles: { textColor } };
      };

      const pdfSignedDiffCell = (diff) => {
        const num = toFiniteNumberOrNull(diff);
        if (num === null) return pdfCell("-");
        const absText = formatPrice(Math.abs(num));
        if (num === 0) return pdfCell(absText);
        const signText = (num > 0 ? "+" : "-") + absText;
        return pdfCell(signText, num > 0 ? PDF_GREEN : PDF_RED);
      };

      const body = filteredTableRows.map((r) => {
        const higherTodaySide = getHigherTodaySide(r.dToday, r.tToday);
        const higherPredictedSide = getHigherPredictedSide(r.dPred, r.tPred);

        const dTodayText = formatPrice(r.dToday);
        const tTodayText = formatPrice(r.tToday);
        const dPredText = formatPrice(r.dPred);
        const tPredText = formatPrice(r.tPred);

        let dTodayColor = null;
        let tTodayColor = null;
        if (higherTodaySide === "D") {
          dTodayColor = PDF_GREEN;
          tTodayColor = PDF_RED;
        } else if (higherTodaySide === "T") {
          dTodayColor = PDF_RED;
          tTodayColor = PDF_GREEN;
        }

        let dPredColor = null;
        let tPredColor = null;
        if (higherPredictedSide === "D") {
          dPredColor = PDF_GREEN;
          tPredColor = PDF_RED;
        } else if (higherPredictedSide === "T") {
          dPredColor = PDF_RED;
          tPredColor = PDF_GREEN;
        }

        return [
          pdfCell(String(r.name ?? "-")),
          pdfCell(String(r.categoryName ?? "-")),
          pdfCell(dTodayText, dTodayColor),
          pdfCell(tTodayText, tTodayColor),
          pdfSignedDiffCell(getDifferenceByMode(r.dToday, r.tToday)),
          pdfCell(dPredText, dPredColor),
          pdfCell(tPredText, tPredColor),
          pdfSignedDiffCell(getPredDifferenceByMode(r.dPred, r.tPred)),
        ];
      });

      autoTable(doc, {
        head,
        body,
        startY: 80,
        styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [245, 245, 245], textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 40, right: 40 },
      });

      const safeDate = String(selectedDate || "").trim() || "date";
      doc.save(`market-price-report_${safeDate}.pdf`);
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.message || "Failed to generate PDF");
    }
  };

  const missingCenters = !dambullaCenterId || !tambuttegamaCenterId;

  const renderSignedDiff = (diff) => {
    const num = toFiniteNumberOrNull(diff);
    if (num === null) return <span>-</span>;
    const absText = formatPrice(Math.abs(num));

    let sign = "";
    let className = "";
    if (num > 0) {
      sign = "+";
      className = "text-green-700";
    } else if (num < 0) {
      sign = "-";
      className = "text-red-700";
    }

    return <span className={className}>{sign + absText}</span>;
  };

  return (
    <div className="w-full mt-6 px-6 sm:px-8 lg:px-12">
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          className="px-3 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-60"
          disabled={loading || missingCenters || filteredTableRows.length === 0}
          onClick={onDownloadPdf}
        >
          Download PDF
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* <h3 className="text-base font-semibold text-gray-800">Daily: Dambulla vs Tambuttegama</h3> */}
            <p className="text-sm text-red-500 mt-1">
              Compares Dambulla vs Tambuttegama for the selected date and predicts {tomorrowDate || "tomorrow"} using a 7-day average (including the selected date).
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="report-date"
              type="date"
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              max={availableDates.length ? availableDates.at(-1) : undefined}
            />
          </div>

          <div>
            <label htmlFor="report-prediction-date" className="block text-sm font-medium text-gray-700 mb-2">
              Prediction Date
            </label>
            <input
              id="report-prediction-date"
              type="text"
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none bg-gray-50"
              value={tomorrowDate || "-"}
              readOnly
            />
          </div>

          <div>
            <label htmlFor="report-product-name" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              id="report-product-name"
              type="text"
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none"
              value={filters.productName}
              onChange={(e) => {
                setFilters((f) => ({ ...f, productName: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Search by product name"
            />
          </div>

          <div>
            <label htmlFor="report-category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="report-category"
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none bg-white"
              value={filters.categoryId}
              onChange={(e) => {
                setFilters((f) => ({ ...f, categoryId: e.target.value }));
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              {sortedCategories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name ?? `#${c.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {filteredTableRows.length} result(s)</p>
          <button
            type="button"
            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
            onClick={() => {
              setFilters({ productName: "", categoryId: "" });
              setCurrentPage(1);
            }}
          >
            Reset
          </button>
        </div>

        {missingCenters ? (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Economic centers not found for Dambulla / Tambuttegama. Make sure PDF uploads have created them in the database.
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        {loading ? (
          <LoadingSpinner label="Loading report..." />
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 border-b">Product</th>
                  <th className="text-left px-4 py-3 border-b">Dambulla ({selectedDate || "-"})</th>
                  <th className="text-left px-4 py-3 border-b">Tambuttegama ({selectedDate || "-"})</th>
                  <th className="text-left px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      <span>{getDifferenceHeader()}</span>
                      <select
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                        value={differenceMode}
                        onChange={(e) => setDifferenceMode(e.target.value)}
                        aria-label="Select difference direction"
                      >
                        <option value="D_MINUS_T">D-T</option>
                        <option value="T_MINUS_D">T-D</option>
                      </select>
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 border-b">Predicted {tomorrowDate || "tomorrow"} (D)</th>
                  <th className="text-left px-4 py-3 border-b">Predicted {tomorrowDate || "tomorrow"} (T)</th>
                  <th className="text-left px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      <span>Pred Diff</span>
                      <select
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                        value={predDifferenceMode}
                        onChange={(e) => setPredDifferenceMode(e.target.value)}
                        aria-label="Select predicted diff direction"
                      >
                        <option value="D_MINUS_T">D-T</option>
                        <option value="T_MINUS_D">T-D</option>
                      </select>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {filteredTableRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={7}>
                      No market prices found for the selected date.
                    </td>
                  </tr>
                ) : (
                  pagedTableRows.map((r) => {
                    const higherTodaySide = getHigherTodaySide(r.dToday, r.tToday);
                    const higherPredictedSide = getHigherPredictedSide(r.dPred, r.tPred);
                    const diffDT = getDifferenceByMode(r.dToday, r.tToday);
                    const predDiffDT = getPredDifferenceByMode(r.dPred, r.tPred);

                    let dTodayIndicator = null;
                    if (higherTodaySide === "D") {
                      dTodayIndicator = <ArrowUp className="text-green-600" size={18} aria-label="Higher than Tambuttegama" />;
                    } else if (higherTodaySide === "T") {
                      dTodayIndicator = <ArrowDown className="text-red-600" size={18} aria-label="Lower than Tambuttegama" />;
                    }

                    let tTodayIndicator = null;
                    if (higherTodaySide === "T") {
                      tTodayIndicator = <ArrowUp className="text-green-600" size={18} aria-label="Higher than Dambulla" />;
                    } else if (higherTodaySide === "D") {
                      tTodayIndicator = <ArrowDown className="text-red-600" size={18} aria-label="Lower than Dambulla" />;
                    }

                    let dPredIndicator = null;
                    if (higherPredictedSide === "D") {
                      dPredIndicator = <ArrowUp className="text-green-600" size={18} aria-label="Higher predicted than Tambuttegama" />;
                    } else if (higherPredictedSide === "T") {
                      dPredIndicator = <ArrowDown className="text-red-600" size={18} aria-label="Lower predicted than Tambuttegama" />;
                    }

                    let tPredIndicator = null;
                    if (higherPredictedSide === "T") {
                      tPredIndicator = <ArrowUp className="text-green-600" size={18} aria-label="Higher predicted than Dambulla" />;
                    } else if (higherPredictedSide === "D") {
                      tPredIndicator = <ArrowDown className="text-red-600" size={18} aria-label="Lower predicted than Dambulla" />;
                    }

                    return (
                      <tr key={r.productId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b">{r.name}</td>
                        <td className="px-4 py-3 border-b">
                          <span className="inline-flex items-center gap-2">
                            <span>{formatPrice(r.dToday)}</span>
                            {dTodayIndicator}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b">
                          <span className="inline-flex items-center gap-2">
                            <span>{formatPrice(r.tToday)}</span>
                            {tTodayIndicator}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b">
                          {renderSignedDiff(diffDT)}
                        </td>
                        <td className="px-4 py-3 border-b">
                          <span className="inline-flex items-center gap-2">
                            <span>{formatPrice(r.dPred)}</span>
                            {dPredIndicator}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b">
                          <span className="inline-flex items-center gap-2">
                            <span>{formatPrice(r.tPred)}</span>
                            {tPredIndicator}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b">
                          {renderSignedDiff(predDiffDT)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {filteredTableRows.length > 0 ? (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-gray-700">
                <div className="text-sm">
                  Page {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="report-rows" className="text-sm">
                    Rows
                  </label>
                  <select
                    id="report-rows"
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                    value={String(pageSize)}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>

                  <button
                    type="button"
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white disabled:opacity-60"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white disabled:opacity-60"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default Report;