import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import marketImage from "../../assets/market.webp";
import LoadingSpinner from "../../components/Loading/LoadingSpinner";
import { fuzzyFilterAndSort } from "../../utils/fuzzySearch";
import { highlightMatchedText } from "../../utils/highlightMatch";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";

function asArray(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [];
}

function formatLKR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `LKR ${n.toFixed(2)}`;
}

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

function toLowerSafe(value) {
  return String(value ?? "").toLowerCase();
}

function toTime(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : -Infinity;
}

function isTrueFlag(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (value === 1 || value === "1") return true;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

function isVerifiedMarketPriceRow(row) {
  // Backend field is `verify` (boolean). Some clients may send/expect `status` or `isVerify`.
  const flag = row?.verify ?? row?.status ?? row?.isVerify;
  return isTrueFlag(flag);
}

function normalizeCenterName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replaceAll(/\s+/g, "")
    .trim();
}

function isTambuttegamaCenter(center) {
  const n = normalizeCenterName(center?.name);
  return n === "tambuttegama" || n === "thambuttegama";
}

function isDambullaCenter(center) {
  return normalizeCenterName(center?.name) === "dambulla";
}

function ProductPriceCard({ product, latestPrice, searchQuery }) {
  const imageUrl = product?.imageURL;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-40 w-full bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product?.name || "Product"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{highlightMatchedText(product?.name ?? "Unnamed product", searchQuery)}</h3>
            <p className="text-xs text-gray-500 mt-1">Unit: {product?.unit ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Latest price</p>
            <p className="text-lg font-bold text-green-700">{formatLKR(latestPrice?.price)}</p>
          </div>
        </div>

        {latestPrice ? (
          <div className="mt-3 text-sm text-gray-700 space-y-1">
            <p>
              <span className="text-gray-500">Market:</span>{" "}
              {latestPrice?.Economic_Center_Location?.name || "—"}
            </p>
            <p>
              <span className="text-gray-500">Date:</span>{" "}
              {latestPrice?.date || "—"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No market price for selected date.</p>
        )}
      </div>
    </div>
  );
}

ProductPriceCard.propTypes = {
  product: PropTypes.object,
  latestPrice: PropTypes.object,
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
      <div className="h-40 w-full bg-gray-200" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
          </div>
          <div className="w-24">
            <div className="h-3 bg-gray-200 rounded w-16 ml-auto" />
            <div className="h-5 bg-gray-200 rounded w-24 mt-2 ml-auto" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

function MarketPrice() {
  const [products, setProducts] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [economicCenters, setEconomicCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(todayISODate());
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedEconomicCenterId, setSelectedEconomicCenterId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [productsRes, pricesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/product/getAll`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/market_price/getAll`, { signal: controller.signal }),
        ]);

        const categoriesRes = await fetch(`${API_BASE_URL}/api/category/getAll`, {
          signal: controller.signal,
        });

        const economicCentersRes = await fetch(`${API_BASE_URL}/api/economic_center/getAll`, {
          signal: controller.signal,
        });

        const productsJson = await productsRes.json().catch(() => null);
        const pricesJson = await pricesRes.json().catch(() => null);
        const categoriesJson = await categoriesRes.json().catch(() => null);
        const economicCentersJson = await economicCentersRes.json().catch(() => null);

        if (!productsRes.ok) {
          throw new Error(productsJson?.message || productsJson?.error || "Failed to load products");
        }
        if (!pricesRes.ok) {
          throw new Error(pricesJson?.message || pricesJson?.error || "Failed to load market prices");
        }
        if (!categoriesRes.ok) {
          throw new Error(categoriesJson?.message || categoriesJson?.error || "Failed to load categories");
        }
        if (!economicCentersRes.ok) {
          throw new Error(
            economicCentersJson?.message || economicCentersJson?.error || "Failed to load economic centers"
          );
        }

        setProducts(asArray(productsJson?.result));
        setMarketPrices(asArray(pricesJson?.result).filter(isVerifiedMarketPriceRow));
        setCategories(asArray(categoriesJson?.result));
        setEconomicCenters(asArray(economicCentersJson?.result));
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error("MarketPrice load failed", e);
        setError(e?.message || "Failed to load market prices");
      } finally {
        setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const allowedEconomicCenters = useMemo(() => {
    const centers = asArray(economicCenters);
    const tambuttegama = centers.find(isTambuttegamaCenter);
    const dambulla = centers.find(isDambullaCenter);
    return [tambuttegama, dambulla].filter(Boolean);
  }, [economicCenters]);

  useEffect(() => {
    if (selectedEconomicCenterId) return;
    if (allowedEconomicCenters.length === 0) return;

    const tambuttegama = allowedEconomicCenters.find(isTambuttegamaCenter);
    const dambulla = allowedEconomicCenters.find(isDambullaCenter);
    setSelectedEconomicCenterId(String(tambuttegama?.id ?? dambulla?.id ?? allowedEconomicCenters[0]?.id ?? ""));
  }, [allowedEconomicCenters, selectedEconomicCenterId]);

  const filteredProducts = useMemo(() => {
    const q = String(searchQuery || "").trim();
    // First filter by category if provided
    let results = asArray(products).filter((p) => {
      return selectedCategoryId ? String(p?.category_id ?? "") === String(selectedCategoryId) : true;
    });

    // If search query provided, use fuzzy search on product name
    if (q) {
      results = fuzzyFilterAndSort(results, q, ["name"]);
    }

    return results;
  }, [products, searchQuery, selectedCategoryId]);

  const pricesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return asArray(marketPrices).filter((row) => {
      const matchesDate = row?.date === selectedDate;
      const matchesCenter = selectedEconomicCenterId
        ? String(row?.economic_center_location_id ?? "") === String(selectedEconomicCenterId)
        : true;
      return matchesDate && matchesCenter;
    });
  }, [marketPrices, selectedDate, selectedEconomicCenterId]);

  const priceByProductIdForDate = useMemo(() => {
    const map = new Map();
    for (const row of asArray(marketPrices)) {
      if (selectedDate && row?.date !== selectedDate) continue;
      if (
        selectedEconomicCenterId &&
        String(row?.economic_center_location_id ?? "") !== String(selectedEconomicCenterId)
      ) {
        continue;
      }
      const productId = row?.product_id ?? row?.Product?.id;
      if (productId == null) continue;

      // Use string keys to avoid number-vs-string mismatches when looking up by `product.id`.
      const productKey = String(productId);

      const existing = map.get(productKey);
      if (!existing) {
        map.set(productKey, row);
        continue;
      }

      const existingTime = Math.max(toTime(existing?.updatedAt), toTime(existing?.createdAt));
      const nextTime = Math.max(toTime(row?.updatedAt), toTime(row?.createdAt));
      if (nextTime >= existingTime) map.set(productKey, row);
    }
    return map;
  }, [marketPrices, selectedDate, selectedEconomicCenterId]);

  // Only show products that have a price record for the selected date + center.
  // (If a product has no price, it should not appear in the filtered results.)
  const pricedFilteredProducts = useMemo(() => {
    const list = asArray(filteredProducts);
    if (!selectedDate) return [];
    return list.filter((p) => priceByProductIdForDate.has(String(p?.id ?? "")));
  }, [filteredProducts, priceByProductIdForDate, selectedDate]);

  if (isLoading) {
    return <LoadingSpinner label="Loading market prices..." />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="mt-3 text-sm text-red-600">{error}</p>
        <p className="mt-2 text-sm text-gray-600">Make sure the backend is running at {API_BASE_URL}.</p>
      </div>
    );
  }

  const dateInputId = "marketprice-date";
  const categorySelectId = "marketprice-category";
  const economicCenterSelectId = "marketprice-economic-center";
  const searchInputId = "marketprice-search";

  return (
    <div className="w-full">
      <section className="relative w-full">
        <img src={marketImage} alt="Market" className="w-full h-[70vh] object-cover" loading="eager" />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Market Prices</h1>
          <p className="max-w-xl text-sm md:text-lg text-gray-200">
            Browse daily prices by date, category, and economic center.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor={dateInputId} className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              id={dateInputId}
              type="date"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor={categorySelectId} className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              id={categorySelectId}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none transition cursor-pointer"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {asArray(categories).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={economicCenterSelectId} className="block text-xs font-medium text-gray-600 mb-1">Economic Center</label>
            <select
              id={economicCenterSelectId}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none transition cursor-pointer disabled:cursor-not-allowed"
              value={selectedEconomicCenterId}
              onChange={(e) => setSelectedEconomicCenterId(e.target.value)}
              disabled={allowedEconomicCenters.length === 0}
            >
              {allowedEconomicCenters.length === 0 ? (
                <option value="">No centers found</option>
              ) : (
                allowedEconomicCenters.map((ec) => (
                  <option key={ec.id} value={ec.id}>
                    {ec.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor={searchInputId} className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              id={searchInputId}
              type="text"
              placeholder="Search by product name"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition cursor-text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          </div>
        </div>

        {(() => {
          if (pricedFilteredProducts.length === 0) {
            return (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <LoadingSpinner label="No products match your filters." />
              </div>
            );
          }

          if (pricesForSelectedDate.length === 0) {
            return (
              <div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                  <LoadingSpinner
                    label={`No market prices for ${selectedDate} in selected center. Try another date/center.`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {["a", "b", "c", "d", "e", "f"].map((key) => (
                    <SkeletonCard key={key} />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricedFilteredProducts.map((product) => (
                <ProductPriceCard
                  key={product.id}
                  product={product}
                  latestPrice={priceByProductIdForDate.get(String(product.id))}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default MarketPrice;