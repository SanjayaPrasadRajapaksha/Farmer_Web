import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/Loading/LoadingSpinner";

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

function normalizeCenterName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function isTambuttegamaCenter(center) {
  const n = normalizeCenterName(center?.name);
  return n === "tambuttegama" || n === "thambuttegama";
}

function isDambullaCenter(center) {
  return normalizeCenterName(center?.name) === "dambulla";
}

function ProductPriceCard({ product, latestPrice }) {
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
            <h3 className="text-base font-semibold text-gray-900">{product?.name || "Unnamed product"}</h3>
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
        setMarketPrices(asArray(pricesJson?.result));
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
    const q = toLowerSafe(searchQuery).trim();
    return asArray(products).filter((p) => {
      const matchesCategory = selectedCategoryId
        ? String(p?.category_id ?? "") === String(selectedCategoryId)
        : true;

      const matchesSearch = q ? toLowerSafe(p?.name).includes(q) : true;
      return matchesCategory && matchesSearch;
    });
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

      const existing = map.get(productId);
      if (!existing) {
        map.set(productId, row);
        continue;
      }

      const existingTime = Math.max(toTime(existing?.updatedAt), toTime(existing?.createdAt));
      const nextTime = Math.max(toTime(row?.updatedAt), toTime(row?.createdAt));
      if (nextTime >= existingTime) map.set(productId, row);
    }
    return map;
  }, [marketPrices, selectedDate, selectedEconomicCenterId]);

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none transition"
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Economic Center</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none transition"
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by product name"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-700">
          No products match your filters.
        </div>
      ) : pricesForSelectedDate.length === 0 ? (
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <LoadingSpinner
              label={
                `No market prices for ${selectedDate} in selected center. Try another date/center.`
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductPriceCard
              key={product.id}
              product={product}
              latestPrice={priceByProductIdForDate.get(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MarketPrice;