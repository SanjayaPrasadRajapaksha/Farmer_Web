import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import homeImage from "../../assets/home.jpg";

function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState(0);
  const [isFeedbackTransitionEnabled, setIsFeedbackTransitionEnabled] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const VISIBLE_FEEDBACK_CARDS = 4;

  const openRegister = () => setIsRegisterOpen(true);
  const closeRegister = () => {
    if (isSubmitting) return;
    setIsRegisterOpen(false);
  };

  const onChange = (key) => (e) => {
    const rawValue = e.target.value;

    // Registration validation (client-side)
    // - Phone must be exactly 10 digits.
    // - While typing, we keep only digits and limit length to 10 so the form state
    //   can never contain invalid characters.
    if (key === "phone") {
      const digitsOnly = String(rawValue ?? "").replace(/\D/g, "").slice(0, 10);
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
      role_id: 2,
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

  const feedback = [
    {
      id: 1,
      name: "A. Perera",
      title: "Smallholder Farmer",
      message:
        "The market price updates helped me decide when to sell. The app is simple and fast.",
    },
    {
      id: 2,
      name: "S. Fernando",
      title: "Vegetable Grower",
      message:
        "Registering was easy. I like that everything is in one place and the home page is clear.",
    },
    {
      id: 3,
      name: "N. Silva",
      title: "Farm Co-op Member",
      message:
        "Clean design and helpful info. Looking forward to more crops and more regions.",
    },
    {
      id: 4,
      name: "N. Silva",
      title: "Farm Co-op Member",
      message:
        "Clean design and helpful info. Looking forward to more crops and more regions.",
    },
    {
      id: 5,
      name: "N. Silva",
      title: "Farm Co-op Member",
      message:
        "Clean design and helpful info. Looking forward to more crops and more regions.",
    },
    {
      id: 6,
      name: "N. Silva",
      title: "Farm Co-op Member",
      message:
        "Clean design and helpful info. Looking forward to more crops and more regions.",
    },
  ];

  const feedbackCardBasis = 100 / VISIBLE_FEEDBACK_CARDS;
  const shouldAutoSlide = feedback.length > VISIBLE_FEEDBACK_CARDS;

  const carouselSlides = (() => {
    if (!feedback.length) return [];
    if (shouldAutoSlide) return [...feedback, ...feedback.slice(0, VISIBLE_FEEDBACK_CARDS)];

    // If there aren't enough feedback items, repeat to fill 5 cards.
    return Array.from({ length: VISIBLE_FEEDBACK_CARDS }, (_, i) => feedback[i % feedback.length]);
  })();

  useEffect(() => {
    if (!shouldAutoSlide) return;

    const intervalId = setInterval(() => {
      setActiveFeedbackIndex((prev) => prev + 1);
    }, 4500);

    return () => clearInterval(intervalId);
  }, [shouldAutoSlide]);

  const onFeedbackTransitionEnd = () => {
    if (!shouldAutoSlide) return;
    if (activeFeedbackIndex === feedback.length) {
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
                Customer Registration
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
      {/* FEEDBACK */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-6">

          {/* Title */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
              Farmer Feedback
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Real experiences from our farmers
            </p>
          </div>

          {/* Auto Passing Feedback (4 cards in one row, no scroll) */}
          {feedback.length > 0 && (
            <div className="relative overflow-hidden">
              <div
                className={`flex ${isFeedbackTransitionEnabled ? "transition-transform duration-700 ease-in-out" : ""}`}
                style={{ transform: `translateX(-${activeFeedbackIndex * feedbackCardBasis}%)` }}
                onTransitionEnd={onFeedbackTransitionEnd}
              >
                {carouselSlides.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="px-2"
                    style={{ flex: `0 0 ${feedbackCardBasis}%` }}
                  >
                    <div className="h-full bg-white/90 p-6 rounded-xl border border-green-100 shadow-md hover:shadow-xl hover:border-green-200 transform hover:scale-105 transition duration-300">
                      <p className="text-sm text-gray-700">"{item.message}"</p>
                      <div className="mt-4">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default Home;