import { useState } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="w-20.5 h-20 object-contain" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8 font-medium">
          <Link to="/" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            Home
          </Link>
          <Link to="/aboutus" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            About
          </Link>
          <Link to="/marketprice" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            Market Price
          </Link>
          <Link to="/report" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            Report
          </Link>
          <Link to="/faq" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            FAQ
          </Link>
          <Link to="/feedback" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            Feedback
          </Link>
          <Link to="/contact" className="hover:text-green-600 transition border-b-2 border-transparent hover:border-green-600 pb-1">
            Contact
          </Link>
        </div>

        {/* Right Section */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="bg-green-600 p-2 rounded-full">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            Call: 653 77 19 00
          </span>
        </div>

        {/* Mobile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block hover:text-green-600">Home</Link>
          <Link to="/aboutus" onClick={() => setIsOpen(false)} className="block hover:text-green-600">About</Link>
          <Link to="/marketprice" onClick={() => setIsOpen(false)} className="block hover:text-green-600">Market Price</Link>
          <Link to="/report" onClick={() => setIsOpen(false)} className="block hover:text-green-600">Report</Link>
          <Link to="/faq" onClick={() => setIsOpen(false)} className="block hover:text-green-600">FAQ</Link>
          <Link to="/feedback" onClick={() => setIsOpen(false)} className="block hover:text-green-600">Feedback</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="block hover:text-green-600">Contact</Link>
        </div>
      )}
    </nav>
  );
}

export default NavBar;