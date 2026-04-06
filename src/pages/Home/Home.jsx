import { Link } from "react-router-dom";
import homeImage from "../../assets/home.jpg";

function Home() {
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
  ];

  return (
    <div className="w-full">

      {/* HERO SECTION */}
      <section className="relative w-full">
        <img
          src={homeImage}
          alt="Farm landscape"
          className="w-full h-[70vh] object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Empowering Farmers with Smart Decisions 🌱
          </h1>
          <p className="max-w-xl text-sm md:text-lg mb-6 text-gray-200">
            Get real-time market prices, connect with buyers, and grow your farming business with ease.
          </p>

          <div className="flex gap-4">
            <Link
              to="/contact"
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-md text-white font-semibold shadow-lg transition"
            >
              Register Now
            </Link>

            <Link
              to="/marketprice"
              className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-md text-black font-semibold shadow-lg transition"
            >
              View Prices
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-center mb-10">
          Why Choose Us
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg shadow-md bg-white text-center">
            <h3 className="font-semibold text-lg mb-2">📊 Market Insights</h3>
            <p className="text-sm text-gray-600">
              Stay updated with daily crop prices and trends.
            </p>
          </div>

          <div className="p-6 rounded-lg shadow-md bg-white text-center">
            <h3 className="font-semibold text-lg mb-2">🤝 Easy Connection</h3>
            <p className="text-sm text-gray-600">
              Connect directly with buyers and sellers.
            </p>
          </div>

          <div className="p-6 rounded-lg shadow-md bg-white text-center">
            <h3 className="font-semibold text-lg mb-2">⚡ Fast & Simple</h3>
            <p className="text-sm text-gray-600">
              Clean interface designed for all farmers.
            </p>
          </div>
        </div>
      </section>

      {/* FEEDBACK */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Farmer Feedback</h2>
            <span className="text-sm text-gray-500">Real experiences</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{item.message}"
                </p>

                <div className="mt-4">
                  <p className="font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;