import { ArrowRight, Leaf, LineChart, MapPinned, ShieldCheck, Users2 } from "lucide-react";
import aboutImageOne from "../../assets/about01.png";
import aboutImageTwo from "../../assets/about02.png";

const highlights = [
  {
    icon: <MapPinned className="h-5 w-5" aria-hidden="true" />,
    title: "Local market insight",
    text: "See market prices and trends from trusted local centers in one place.",
  },
  {
    icon: <LineChart className="h-5 w-5" aria-hidden="true" />,
    title: "Smarter decisions",
    text: "Use clear reporting and analytics to decide when and where to sell.",
  },
  {
    icon: <Users2 className="h-5 w-5" aria-hidden="true" />,
    title: "Farmer-first design",
    text: "Built to help farmers, traders, and administrators work faster together.",
  },
];

const stats = [
  { value: "24/7", label: "Access to information" },
  { value: "2", label: "Market views showcased" },
  { value: "100%", label: "Focused on farmers" },
];

function AboutUs() {
  return (
    <div className="w-full bg-gradient-to-b from-emerald-50 via-white to-lime-50">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute top-28 left-[-6rem] h-80 w-80 rounded-full bg-lime-200/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur">
                <Leaf className="h-4 w-4" aria-hidden="true" />
                About Farmer Web
              </div>

              <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                <span className="block">Helping farmers make</span>
                <span className="block bg-gradient-to-r from-emerald-700 to-lime-600 bg-clip-text text-transparent">
                  better market decisions
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base md:text-lg leading-8 text-gray-600">
                Farmer Web is built to make market information easier to access, compare, and act on.
                From price tracking to support and analytics, the platform brings practical tools together
                in a simple, farmer-friendly experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/marketprice"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  Explore Market Prices
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Contact Support
                </a>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="mt-1 text-sm text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-100/40">
                  <img
                    src={aboutImageOne}
                    alt="Busy vegetable and fruit market"
                    className="h-[260px] w-full object-cover md:h-[340px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] gap-4 items-stretch">
                  <div className="rounded-[2rem] border border-gray-200 bg-gray-900 text-white p-6 shadow-xl">
                    <ShieldCheck className="h-10 w-10 text-lime-400" aria-hidden="true" />
                    <h2 className="mt-4 text-xl font-semibold">Trusted and practical</h2>
                    <p className="mt-2 text-sm leading-7 text-gray-300">
                      The platform focuses on useful information that supports everyday farming decisions.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-100/40">
                    <img
                      src={aboutImageTwo}
                      alt="Farmer arranging fresh vegetables at a market stall"
                      className="h-[220px] w-full object-cover md:h-[260px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Why this platform exists</h2>
            <p className="mt-3 text-sm md:text-base leading-7 text-gray-600">
              Farmers often need fast access to reliable market prices, clearer trends, and a place to
              ask questions. Farmer Web brings those essentials into one interface so the focus stays on
              planning, not searching.
            </p>

            <div className="mt-6 space-y-4">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-lime-500 p-6 md:p-8 text-white shadow-xl shadow-emerald-200/40">
            <h2 className="text-2xl font-bold">Built for everyday use</h2>
            <p className="mt-3 text-sm md:text-base leading-7 text-emerald-50/95">
              Whether you are checking prices before heading to market, reading analytics, or finding
              support information, the interface is designed to stay clear and easy to navigate on
              desktop and mobile.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur">
                <p className="text-sm text-emerald-50/90">Market tracking</p>
                <p className="mt-1 text-lg font-semibold">Prices, trends, and reports</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur">
                <p className="text-sm text-emerald-50/90">Support access</p>
                <p className="mt-1 text-lg font-semibold">Questions, contact, and feedback</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-50/80">Our goal</p>
              <p className="mt-2 text-base md:text-lg font-medium leading-7 text-white">
                Make market information easier to understand so farmers can act with more confidence.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;