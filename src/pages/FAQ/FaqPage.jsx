import axios from "axios";
import { ChevronDown, HelpCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";

const QUICK_TOPICS = [
  "Market price updates",
  "How to report an issue",
  "Feedback and support",
  "Using the analytics view",
];

function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadFaqs = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const res = await axios.get(`${API_BASE_URL}/api/faq/getAll/`);
        const items = Array.isArray(res?.data?.result) ? res.data.result : [];
        const activeItems = items.filter((item) => Boolean(item?.isActive));

        if (!isMounted) return;

        setFaqs(activeItems);
        setOpenId(activeItems[0]?.id ?? null);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;

        setErrorMessage(error.response?.data?.message || error.message || "Failed to load FAQs");
        setFaqs([]);
        setOpenId(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFaqs = useMemo(() => {
    const needle = String(query ?? "").trim().toLowerCase();
    if (!needle) return faqs;

    return faqs.filter((faq) => {
      const question = String(faq?.question ?? "").toLowerCase();
      const answer = String(faq?.answer ?? "").toLowerCase();
      return question.includes(needle) || answer.includes(needle);
    });
  }, [faqs, query]);

  useEffect(() => {
    if (!filteredFaqs.length) {
      setOpenId(null);
      return;
    }

    setOpenId((current) => {
      if (filteredFaqs.some((faq) => faq.id === current)) return current;
      return filteredFaqs[0]?.id ?? null;
    });
  }, [filteredFaqs]);

  const stats = useMemo(() => {
    return [
      { label: "Active FAQs", value: String(faqs.length).padStart(2, "0") },
      { label: "Quick topics", value: String(QUICK_TOPICS.length).padStart(2, "0") },
      { label: "Support focus", value: "24/7" },
    ];
  }, [faqs.length]);

  let statusText = `${filteredFaqs.length} questions available`;
  if (filteredFaqs.length === 1) statusText = "1 question available";
  if (!loading && !errorMessage && faqs.length === 0) statusText = "No active FAQs available yet.";
  if (loading) statusText = "Loading the latest FAQs...";
  if (errorMessage) statusText = errorMessage;

  return (
    <div className="w-full bg-gradient-to-b from-emerald-50 via-white to-lime-50">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-[-5rem] h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute top-24 left-[-6rem] h-80 w-80 rounded-full bg-lime-200/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Helpful answers in one place
              </div>

              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
                <span className="block">Frequently asked</span>
                <span className="block bg-gradient-to-r from-emerald-700 to-lime-600 bg-clip-text text-transparent">
                  questions
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base md:text-lg text-gray-600 leading-8">
                Find quick answers about market prices, support, feedback, and how to use the Farmer Web
                platform effectively.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="mt-1 text-sm text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:justify-self-end w-full max-w-xl">
              <div className="rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-100/40 p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                    <HelpCircle className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Need something specific?</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Search the FAQ or jump to a common topic below.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="faq-search" className="sr-only">
                    Search FAQ
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <input
                      id="faq-search"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search questions or answers..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900">Quick topics</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setQuery(topic)}
                        className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 transition hover:bg-emerald-100"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-lime-100 bg-lime-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-lime-700" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Reliable answers</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Only active FAQ items published by the admin are shown here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Common support areas</h2>
            <p className="mt-2 text-sm text-gray-600">
              These are the most common things farmers ask about when using the platform.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Market prices</p>
                <p className="mt-1 text-sm text-gray-600">
                  Learn how to check live prices and compare centers before selling your produce.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Feedback</p>
                <p className="mt-1 text-sm text-gray-600">
                  Share your thoughts so the platform can improve with real farmer input.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Support and contact</p>
                <p className="mt-1 text-sm text-gray-600">
                  Use the contact page when you need help that is not answered here.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">FAQ</h2>
                <p className="mt-2 text-sm text-gray-600">{statusText}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  No FAQ items match your search. Try a different keyword or choose a quick topic.
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openId === faq.id;

                  return (
                    <button
                      key={faq.id}
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            FAQ {String(faq.id).padStart(2, "0")}
                          </p>
                          <h3 className="mt-2 text-base md:text-lg font-semibold text-gray-900">
                            {faq.question || "Untitled question"}
                          </h3>
                        </div>

                        <span
                          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                            isOpen ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"
                          }`}
                          aria-hidden="true"
                        >
                          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </span>
                      </div>

                      <div
                        className={`grid overflow-hidden transition-all duration-300 ${isOpen ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"}`}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <p className="text-sm md:text-base leading-7 text-gray-600">
                            {faq.answer || "No answer available yet."}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              If you still need help, visit the Contact page and send us a message.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FaqPage