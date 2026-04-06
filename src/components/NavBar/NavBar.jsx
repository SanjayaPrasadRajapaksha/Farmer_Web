import React from 'react';
import { Search, Phone } from 'lucide-react';
import logo from "../../assets/logo.png"

function NavBar() {
  return (
    <nav className="bg-slate-800 text-black px-6 py-4" style={{ backgroundColor: '#f2f3fc' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8">
          <a href="/" className="text-black hover:text-yellow-600 transition-colors font-medium">
            Home
          </a>
          <a href="/room" className="text-black hover:text-yellow-600 transition-colors font-medium">
            About
          </a>
          <a href="/aboutus" className="text-black hover:text-yellow-600 transition-colors font-medium">
            Report
          </a>
          <a href="/service" className="text-black hover:text-yellow-600 transition-colors font-medium">
            FQA
          </a>
          <a href="/contact" className="text-black hover:text-yellow-600 transition-colors font-medium">
            Feedback
          </a>
          <a href="/contact" className="text-black hover:text-yellow-600 transition-colors font-medium">
            Contact
          </a>
        </div>

        {/* Contact Info and Search */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-2 text-sm">
            <div className="bg-green-500 rounded-full p-2">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-black font-medium">Call : 653 77 19 00 </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button className="text-black hover:text-yellow-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;