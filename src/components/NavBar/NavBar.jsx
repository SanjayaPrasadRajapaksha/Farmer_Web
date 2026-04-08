import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/aboutus" },
  { label: "Market Price", to: "/marketprice" },
  { label: "Report", to: "/report" },
  { label: "Analytics", to: "/analytics" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="w-24 h-12 object-contain" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 font-medium text-white">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="group relative transition duration-300 pb-1"
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? "text-green-400" : "text-white group-hover:text-green-400"}>
                    {item.label}
                  </span>
                  <span
                    className={
                      "absolute left-0 -bottom-1 h-0.5 bg-yellow-400 transition-all " +
                      (isActive ? "w-full" : "w-0 group-hover:w-full")
                    }
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Call Section */}
        <div className="hidden lg:flex items-center space-x-3 bg-gray-800 px-3 py-1 rounded-full shadow-inner">
          <div className="bg-green-600 p-2 rounded-full">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div className="text-white font-medium text-sm">
            Call: 653 77 19 00 / 658 02 55 84
          </div>
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-300 hover:text-green-400 transition"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 text-white shadow-md px-6 py-4 space-y-4 transition duration-300">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                "block transition " +
                (isActive
                  ? "text-green-400 font-semibold border-l-2 border-yellow-400 pl-3"
                  : "text-white hover:text-green-400")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

export default NavBar;