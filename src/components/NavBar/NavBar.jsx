import { useState } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

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
          {["Home","About","Market Price","Report","FAQ","Feedback","Contact"].map((item, idx) => (
            <Link
              key={idx}
              to={`/${item.toLowerCase().replace(/\s+/g, "")}`}
              className="relative hover:text-green-400 transition duration-300 pb-1"
            >
              {item}
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-green-400 transition-all group-hover:w-full"></span>
            </Link>
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
          {["Home","About","Market Price","Report","FAQ","Feedback","Contact"].map((item, idx) => (
            <Link
              key={idx}
              to={`/${item.toLowerCase().replace(/\s+/g, "")}`}
              onClick={() => setIsOpen(false)}
              className="block hover:text-green-400 transition"
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default NavBar;