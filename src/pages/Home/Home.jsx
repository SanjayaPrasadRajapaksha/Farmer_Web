import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import homeImage from "../../assets/home.jpg";
import homeImage02 from "../../assets/home02.png";
import homeImage03 from "../../assets/home03.png";
import homeImage04 from "../../assets/home04.png";
import LoadingSpinner from "../../components/Loading/LoadingSpinner";

function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState(0);
  const [isFeedbackTransitionEnabled, setIsFeedbackTransitionEnabled] = useState(true);

  const [feedbackItems, setFeedbackItems] = useState([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: "", message: "", rate: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const VISIBLE_FEEDBACK_CARDS = 4;

  const openRegister = () => setIsRegisterOpen(true);
  const closeRegister = () => {
    if (isSubmitting) return;
    setIsRegisterOpen(false);
  };

  const openAddFeedback = () => setIsAddFeedbackOpen(true);
  const closeAddFeedback = () => {
    if (isFeedbackSubmitting) return;
    setIsAddFeedbackOpen(false);
  };

  const onChange = (key) => (e) => {
    const rawValue = e.target.value;

    // Registration validation (client-side)
    // - Phone must be exactly 10 digits.
    // - While typing, we keep only digits and limit length to 10 so the form state
    //   can never contain invalid characters.
    if (key === "phone") {
      const digitsOnly = String(rawValue ?? "").replaceAll(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [key]: digitsOnly }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: rawValue }));
  };

  const isValidEmail = (value) => {
    const v = String(value ?? "").trim();
    // Simple, practical email validation: user@domain.tld (no spaces).
    // (We also use HTML input type=email + pattern for immediate browser feedback.)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const isValidPhone10Digits = (value) => {
    const v = String(value ?? "").trim();
    // Exactly 10 numeric digits.
    return /^\d{10}$/.test(v);
  };

  const submitRegister = async (e) => {
    e.preventDefault();

    // Submit-time validation (final gate)
    // Even though inputs have `required`/`pattern`, we validate again here so the API
    // is only called with clean, expected values.

    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();
    const address = String(form.address ?? "").trim();
    const phone = String(form.phone ?? "").trim();

    if (!name || !email || !address || !phone) {
      alert("Please fill all required fields");
      return;
    }
    if (name.length > 255) {
      alert("Full name must be 255 characters or less");
      return;
    }
    if (address.length > 255) {
      alert("Address must be 255 characters or less");
      return;
    }
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }
    if (!isValidPhone10Digits(phone)) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    const payload = {
      name,
      email,
      address,
      phone,
      role_id: 3,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/user/registerCustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.error || data?.message || "Registration failed";
        alert(message);
        return;
      }

      alert(data?.message || "Registration successful");
      setForm({ name: "", email: "", address: "", phone: "" });
      setIsRegisterOpen(false);
    } catch (error) {
      console.error("registerCustomer request failed", error);
      alert("Could not reach server (http://localhost:8000)");
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeRate = (value) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > 5) return null;
    return n;
  };

  const fetchFeedback = async () => {
    setIsFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback/getAll`);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.status) {
        const message = data?.message || "Failed to load feedback";
        setFeedbackError(message);
        setFeedbackItems([]);
        return;
      }

      const items = Array.isArray(data.result) ? data.result : [];
      const mapped = items
        .map((f) => ({
          id: f?.id,
          name: String(f?.name ?? "").trim() || "Anonymous",
          message: String(f?.message ?? "").trim(),
          rate: normalizeRate(f?.rate),
          verified: Boolean(f?.verified),
        }))
        .filter((f) => f.message && f.verified);

      setFeedbackItems(mapped);
      setActiveFeedbackIndex(0);
      setIsFeedbackTransitionEnabled(true);
    } catch (error) {
      console.error("getAll feedback request failed", error);
      setFeedbackError("Could not reach server");
      setFeedbackItems([]);
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();

    const name = String(feedbackForm.name ?? "").trim();
    const message = String(feedbackForm.message ?? "").trim();
    const rate = normalizeRate(feedbackForm.rate);

    if (!name || !message || !rate) {
      alert("Please enter name, message and rating (1-5)");
      return;
    }
    if (name.length > 255) {
      alert("Name must be 255 characters or less");
      return;
    }
    if (message.length > 255) {
      alert("Message must be 255 characters or less");
      return;
    }

    setIsFeedbackSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, rate }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.status) {
        const msg = data?.message || "Failed to submit feedback";
        alert(msg);
        return;
      }

      alert(data?.message || "Feedback added successfully");
      setFeedbackForm({ name: "", message: "", rate: "" });
      setIsAddFeedbackOpen(false);

      // Refresh the carousel from server so we show the actual stored feedback.
      fetchFeedback();
    } catch (error) {
      console.error("create feedback request failed", error);
      alert("Could not reach server");
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  // If there are fewer than 4 feedback items, we show each item exactly once
  // (no repeating to “fill” the row). Card width is based on the actual count.
  const visibleFeedbackCards = Math.min(VISIBLE_FEEDBACK_CARDS, feedbackItems.length || 1);
  const feedbackCardBasis = 100 / visibleFeedbackCards;
  const shouldAutoSlide = feedbackItems.length > VISIBLE_FEEDBACK_CARDS;

  const carouselSlides = (() => {
    if (!feedbackItems.length) return [];
    if (shouldAutoSlide) return [...feedbackItems, ...feedbackItems.slice(0, VISIBLE_FEEDBACK_CARDS)];

    // No auto-slide: render the real items once.
    return feedbackItems;
  })();

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!shouldAutoSlide) return;

    const intervalId = setInterval(() => {
      setActiveFeedbackIndex((prev) => prev + 1);
    }, 4500);

    return () => clearInterval(intervalId);
  }, [shouldAutoSlide]);

  const onFeedbackTransitionEnd = () => {
    if (!shouldAutoSlide) return;
    if (activeFeedbackIndex === feedbackItems.length) {
      setIsFeedbackTransitionEnabled(false);
      setActiveFeedbackIndex(0);
      setTimeout(() => setIsFeedbackTransitionEnabled(true), 0);
    }
  };

  return (
    <div className="w-full">

      {/* HERO */}
      <section className="relative w-full">
        <img
          src={homeImage}
          alt="Farm"
          className="w-full h-[70vh] object-cover"
        />

        <div className="absolute inset-0 bg-black/40"></div>

        <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Empowering Farmers with Smart Decisions 🌱
          </h1>

          <p className="max-w-xl text-sm md:text-lg mb-6 text-gray-200">
            Get real-time market prices, connect with buyers, and grow your farming business with ease.
          </p>

          <div className="flex gap-4">
            <button
              onClick={openRegister}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-md text-white font-semibold shadow-lg transition"
            >
              Register Now
            </button>

            <Link
              to="/marketprice"
              className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-md text-black font-semibold shadow-lg transition"
            >
              View Prices
            </Link>
          </div>
        </div>
      </section>
      {/* POPUP */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-fadeIn">

            {/* ❌ Close Button (Top Right Corner) */}
            <button
              onClick={closeRegister}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition"
              disabled={isSubmitting}
            >
              &times;
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Farmer Registration
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sign up to get daily market price updates via email
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={submitRegister} className="space-y-4">

              <input
                placeholder="Full Name"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                value={form.name}
                onChange={onChange("name")}
                minLength={1}
                maxLength={255}
                title="Full name must be 1 to 255 characters"
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                value={form.email}
                onChange={onChange("email")}
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                title="Enter a valid email address (example: name@example.com)"
                autoComplete="email"
                required
              />

              <input
                placeholder="Address"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                value={form.address}
                onChange={onChange("address")}
                autoComplete="street-address"
                minLength={1}
                maxLength={255}
                title="Address must be 1 to 255 characters"
                required
              />

              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                value={form.phone}
                onChange={onChange("phone")}
                inputMode="numeric"
                pattern="\d{10}"
                title="Phone number must be exactly 10 digits"
                minLength={10}
                maxLength={10}
                autoComplete="tel"
                required
              />

              {/* Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 py-2.5 rounded-lg text-white font-semibold transition transform hover:scale-105"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ADD FEEDBACK POPUP */}
      {isAddFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-fadeIn">
            <button
              onClick={closeAddFeedback}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold transition"
              disabled={isFeedbackSubmitting}
            >
              &times;
            </button>

            <div className="text-center mb-5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Add Feedback
              </h2>
              <p className="text-sm text-gray-500 mt-1">Share your experience with other farmers</p>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4">
              <input
                placeholder="Your Name"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                value={feedbackForm.name}
                onChange={(e) => setFeedbackForm((p) => ({ ...p, name: e.target.value }))}
                minLength={1}
                maxLength={255}
                title="Name must be 1 to 255 characters"
                required
              />

              <textarea
                placeholder="Your Feedback"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                rows={4}
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm((p) => ({ ...p, message: e.target.value }))}
                minLength={1}
                maxLength={255}
                title="Message must be 1 to 255 characters"
                required
              />

              <div className="w-full px-4 py-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Rating</span>
                  <span className="text-xs text-gray-500">
                    {feedbackForm.rate ? `${feedbackForm.rate}/5` : "Select 1-5"}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Select rating">
                  {Array.from({ length: 5 }, (_, i) => {
                    const value = i + 1;
                    const selected = normalizeRate(feedbackForm.rate) === value;
                    const filled = normalizeRate(feedbackForm.rate) && value <= normalizeRate(feedbackForm.rate);

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFeedbackForm((p) => ({ ...p, rate: value }))}
                        className={`text-2xl leading-none transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded ${
                          selected ? "ring-2 ring-green-500" : ""
                        } ${filled ? "text-yellow-500" : "text-gray-300"}`}
                        aria-label={`${value} star`}
                        aria-checked={selected}
                        role="radio"
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isFeedbackSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 py-2.5 rounded-lg text-white font-semibold transition transform hover:scale-105"
              >
                {isFeedbackSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-b from-green-50 to-white border border-green-100 px-6 py-10">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
            Why Choose Us
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Market Insights */}
            <div className="p-6 bg-white rounded-xl border border-green-100 shadow-md hover:shadow-xl hover:border-green-200 transform hover:scale-105 transition duration-300">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="font-semibold text-xl mb-2 text-green-700">Market Insights</h3>
            <p className="text-sm text-gray-600">
              Stay updated with daily crop prices and trends.
            </p>
          </div>

          {/* Easy Connection */}
          <div className="p-6 bg-white rounded-xl border border-green-100 shadow-md hover:shadow-xl hover:border-green-200 transform hover:scale-105 transition duration-300">
            <div className="mb-4 text-4xl">🤝</div>
            <h3 className="font-semibold text-xl mb-2 text-green-700">Easy Connection</h3>
            <p className="text-sm text-gray-600">
              Connect directly with buyers and sellers seamlessly.
            </p>
          </div>

          {/* Fast & Simple */}
          <div className="p-6 bg-white rounded-xl border border-green-100 shadow-md hover:shadow-xl hover:border-green-200 transform hover:scale-105 transition duration-300">
            <div className="mb-4 text-4xl">⚡</div>
            <h3 className="font-semibold text-xl mb-2 text-green-700">Fast & Simple</h3>
            <p className="text-sm text-gray-600">
              Enjoy a clean, easy interface designed for all farmers.
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* FIELD STORIES */}
      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="rounded-3xl border border-green-100 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-green-700">From the field</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Farmers, markets, and daily progress</h2>
              <p className="mt-2 text-sm md:text-base text-gray-600 max-w-2xl">
                A quick look at the real farming environment this platform is built for.
                We bring these day-to-day market moments into actionable insights.
              </p>
            </div>
            <Link
              to="/aboutus"
              className="inline-flex items-center justify-center rounded-full border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
            >
              Learn more about us
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 relative overflow-hidden rounded-3xl border border-green-100 bg-emerald-950">
              <img
                src={homeImage03}
                alt="Fresh produce display in a market"
                className="h-72 md:h-[26rem] w-full object-contain md:object-cover transition duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />

              <div className="absolute left-5 bottom-5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-100">Daily view</p>
                <p className="mt-1 text-sm md:text-base font-semibold">Real market activity across regions</p>
              </div>
            </div>

            <div className="md:col-span-5 relative min-h-[21rem] md:min-h-[26rem]">
              <div className="absolute left-0 right-8 top-0 rounded-2xl overflow-hidden border border-green-100 bg-white shadow-xl rotate-[-1.8deg] transition hover:rotate-0">
                <img
                  src={homeImage02}
                  alt="Farm produce prepared for trade"
                  className="h-48 md:h-56 w-full object-cover"
                />
                <div className="px-4 py-3 bg-white">
                  <p className="text-xs uppercase tracking-[0.12em] text-green-700">Produce ready</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">Harvest prepared for the market</p>
                </div>
              </div>

              <div className="absolute left-8 right-0 bottom-0 rounded-2xl overflow-hidden border border-green-100 bg-white shadow-xl rotate-[1.8deg] transition hover:rotate-0">
                <img
                  src={homeImage04}
                  alt="Farm market activity and produce variety"
                  className="h-48 md:h-56 w-full object-cover"
                />
                <div className="px-4 py-3 bg-white">
                  <p className="text-xs uppercase tracking-[0.12em] text-green-700">Market pulse</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">Price movement and trading energy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK */}
      <section className="bg-gradient-to-b from-green-50 to-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl border border-green-100 bg-white/70 backdrop-blur-sm shadow-sm px-6 py-10 md:px-10">

            {/* Title */}
            <div className="mb-10 flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                  Farmer Feedback
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Real experiences from our farmers
                </p>
              </div>

              <button
                onClick={openAddFeedback}
                className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-full text-white font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add Feedback
              </button>
            </div>

          {/* Auto Passing Feedback (4 cards in one row, no scroll) */}
          {isFeedbackLoading && (
            <div className="flex justify-center">
              <LoadingSpinner label="Loading feedback..." />
            </div>
          )}

          {!isFeedbackLoading && feedbackError && (
            <div className="flex justify-center">
              <LoadingSpinner label={feedbackError} />
            </div>
          )}

          {!isFeedbackLoading && !feedbackError && feedbackItems.length > 0 && (
            <div className="relative overflow-x-hidden overflow-y-visible py-2">
              <div
                className={`flex ${isFeedbackTransitionEnabled ? "transition-transform duration-700 ease-in-out" : ""}`}
                style={{ transform: `translateX(-${activeFeedbackIndex * feedbackCardBasis}%)` }}
                onTransitionEnd={onFeedbackTransitionEnd}
              >
                {carouselSlides.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="px-2 py-2"
                    style={{ flex: `0 0 ${feedbackCardBasis}%` }}
                  >
                    <div className="group h-72 min-h-0 bg-white/90 p-7 rounded-2xl border border-green-100 shadow-md hover:shadow-xl hover:border-green-200 transform hover:scale-[1.02] transition duration-300 flex flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <div className="shrink-0 flex items-center gap-0.5" aria-label="Rating">
                          {Array.from({ length: 5 }, (_, i) => {
                            const filled = item.rate && i < item.rate;
                            return (
                              <span
                                key={i}
                                className={filled ? "text-yellow-500" : "text-gray-300"}
                              >
                                ★
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className={`mt-4 text-sm text-gray-800 leading-relaxed flex-1 min-h-0 pr-2 ${
                          String(item.message ?? "").length > 100 ? "overflow-y-auto" : "overflow-hidden"
                        }`}
                      >
                        "{item.message}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isFeedbackLoading && !feedbackError && feedbackItems.length === 0 && (
            <div className="flex justify-center">
              <LoadingSpinner label="No feedback available" />
            </div>
          )}
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;