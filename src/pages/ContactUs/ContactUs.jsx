import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";

function ContactUs() {
  const [form, setForm] = useState({ name: "", phoneNumber: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (key) => (e) => {
    const value = e.target.value;

    if (key === "phoneNumber") {
      const digitsOnly = String(value ?? "").replaceAll(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phoneNumber: digitsOnly }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const name = String(form.name ?? "").trim();
    const phoneNumber = String(form.phoneNumber ?? "").trim();
    const email = String(form.email ?? "").trim();
    const message = String(form.message ?? "").trim();

    if (!name || !phoneNumber || !email || !message) {
      alert("Please fill all fields");
      return;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      alert("Phone number must be exactly 10 digits");
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    try {
      setIsSubmitting(true);
      const res = await fetch(`${apiBaseUrl}/api/contact/contactAdd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber, email, message }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.status) {
        const msg = data?.message || "Failed to send message";
        alert(msg);
        return;
      }

      alert("Thanks! We received your message.");
      setForm({ name: "", phoneNumber: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Have a question, suggestion, or need support? Send us a message and we’ll get back to you.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Contact details */}
            <div className="lg:col-span-2">
              <div className="h-full rounded-3xl border border-green-100 bg-white/70 backdrop-blur-sm shadow-sm p-7">
                <h2 className="text-lg font-semibold text-gray-900">Get in touch</h2>
                <p className="mt-2 text-sm text-gray-600">
                  We’re here to help farmers make better market decisions.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-green-700" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">support@farmerapp.lk</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-700" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">653 77 19 00 / 658 02 55 84</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-700" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">Sri Lanka</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-green-100 bg-white p-5">
                  <p className="text-sm font-semibold text-gray-900">Support hours</p>
                  <p className="mt-1 text-sm text-gray-600">Mon–Sat: 8.30 AM – 6.00 PM</p>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-green-100 bg-white">
                  <iframe
                    title="Support location map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.5781096280734!2d79.88604457339788!3d6.821054719637318!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25ace5672d713%3A0x19455164f827004b!2sColombo%20International%20Airport%20Ratmalana!5e0!3m2!1sen!2slk!4v1775645952305!5m2!1sen!2slk"
                    className="w-full h-48"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-7">
                <h2 className="text-lg font-semibold text-gray-900">Send a message</h2>
                <p className="mt-2 text-sm text-gray-600">We usually reply within 24–48 hours.</p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                        placeholder="Your name"
                        value={form.name}
                        onChange={onChange("name")}
                        minLength={1}
                        maxLength={255}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        inputMode="numeric"
                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                        placeholder="Enter 10 digit number"
                        value={form.phoneNumber}
                        onChange={onChange("phoneNumber")}
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={onChange("email")}
                      maxLength={255}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                      rows={6}
                      placeholder="Write your message..."
                      value={form.message}
                      onChange={onChange("message")}
                      minLength={1}
                      maxLength={255}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Max 255 characters.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-full text-white font-semibold shadow-lg transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs